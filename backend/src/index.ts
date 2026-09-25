import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import Stripe from 'stripe';
import { AccessStatus, CommercialStage, PaymentChannel, PrismaClient, Role, TransactionStatus } from '@prisma/client';
import { z } from 'zod';

const db = new PrismaClient();
const app = express();
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-change-me')) {
  throw new Error('JWT_SECRET es obligatorio y debe ser seguro en producción.');
}
const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const localOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const renderOrigin = process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : '';
const configuredOrigins = [...(process.env.FRONTEND_URL || '').split(','), renderOrigin].map(value => value.trim().replace(/\/$/, '')).filter(Boolean);
const publicFrontendUrl = configuredOrigins[0] || 'http://localhost:5173';
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || localOriginPattern.test(origin) || configuredOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origen no permitido por CORS.'));
  },
  credentials: true
}));
app.post('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !stripeWebhookSecret) return res.status(400).send('Webhook de Stripe no configurado.');
  const signature = req.headers['stripe-signature'];
  if (!signature || Array.isArray(signature)) return res.status(400).send('Firma de Stripe ausente.');
  try {
    const event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret);
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId = session.metadata?.paymentId;
    if (paymentId && event.type === 'checkout.session.completed' && session.payment_status === 'paid') {
      const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { plan: true } });
      const studentId = session.metadata?.studentId;
      const months = Number(session.metadata?.months || 1);
      if (payment && studentId && payment.estadoTransaccion === TransactionStatus.INICIADA) {
        await confirmPaymentRecord(payment, studentId, months, `Pago Stripe confirmado mediante webhook (${session.id}).`);
      }
    }
    if (paymentId && event.type === 'checkout.session.expired') {
      await db.payment.updateMany({
        where: { id: paymentId, estadoTransaccion: TransactionStatus.INICIADA },
        data: { estadoTransaccion: TransactionStatus.VENCIDA }
      });
    }
    return res.json({ received: true });
  } catch (error: any) {
    return res.status(400).send(`Webhook inválido: ${error.message}`);
  }
});
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Espera unos minutos antes de volver a intentar.' }
});

type RequestWithUser = express.Request & { user?: { id: string; rol: Role } };
const signToken = (user: { id: string; rol: Role }) => jwt.sign({ id: user.id, rol: user.rol }, secret, { expiresIn: '7d' });
const auth = (roles?: Role[]) => (req: RequestWithUser, res: express.Response, next: express.NextFunction) => {
  try {
    const raw = req.headers.authorization?.replace('Bearer ', '');
    if (!raw) throw new Error('missing');
    const user = jwt.verify(raw, secret) as { id: string; rol: Role };
    if (roles && !roles.includes(user.rol)) return res.status(403).json({ message: 'No tienes permiso para esta acción.' });
    req.user = user; next();
  } catch { return res.status(401).json({ message: 'Tu sesión expiró. Inicia sesión nuevamente.' }); }
};

const registration = z.object({
  nombres: z.string().trim().min(2, 'Ingresa tus nombres.'),
  apellidos: z.string().trim().min(2, 'Ingresa tus apellidos.'),
  email: z.string().trim().email('Ingresa un correo válido.').transform(value => value.toLowerCase()),
  telefono: z.string().trim().min(7).max(20).optional().or(z.literal('')),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  carreraInteres: z.string().trim().max(100).optional(),
  rol: z.enum(['STUDENT', 'GUARDIAN']).default('STUDENT')
});

const studentInclude = {
  studentProfile: {
    include: {
      subscriptions: {
        include: { plan: true },
        orderBy: { fechaFin: 'desc' as const }
      }
    }
  },
  guardianProfile: true
};

function formatUser(user: any) {
  if (!user) return null;
  if (user.studentProfile?.subscriptions) {
    user.studentProfile.subscriptions.sort((a: any, b: any) => {
      if (a.estadoAcceso === 'ACTIVADO' && b.estadoAcceso !== 'ACTIVADO') return -1;
      if (b.estadoAcceso === 'ACTIVADO' && a.estadoAcceso !== 'ACTIVADO') return 1;
      return new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime();
    });
  }
  return { ...user, passwordHash: undefined };
}

async function activePlanForStudent(studentId: string) {
  const subscription = await db.subscription.findFirst({
    where: { studentId, estadoAcceso: AccessStatus.ACTIVADO, fechaFin: { gt: new Date() } },
    include: { plan: true },
    orderBy: { fechaFin: 'desc' }
  });
  return subscription?.plan || null;
}

const planLevel = (name?: string) => ({ 'Explora UNT': 1, 'Ruta UNT': 2, 'Meta UNT': 3, 'Meta UNT Plus': 4 }[name || ''] || 0);

const requireStudentPlan = (minimumLevel: number) => async (req: RequestWithUser, res: express.Response, next: express.NextFunction) => {
  const plan = await activePlanForStudent(req.user!.id);
  if (!plan || planLevel(plan.nombre) < minimumLevel) {
    return res.status(403).json({ message: 'Tu plan actual no incluye esta función. Revisa los planes disponibles.' });
  }
  return next();
};

app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { password, carreraInteres, rol, ...details } = registration.parse(req.body);
    if (await db.user.findUnique({ where: { email: details.email } })) return res.status(409).json({ message: 'Este correo ya está registrado.' });
    const user = await db.user.create({
      data: {
        ...details, rol, passwordHash: await bcrypt.hash(password, 12),
        studentProfile: rol === Role.STUDENT ? { create: { carreraInteres } } : undefined,
        guardianProfile: rol === Role.GUARDIAN ? { create: {} } : undefined
      },
      include: studentInclude
    });
    return res.status(201).json({ token: signToken(user), user: formatUser(user) });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : 'No pudimos crear tu cuenta. Intenta nuevamente.';
    return res.status(400).json({ message });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const credentials = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
  if (!credentials.success) return res.status(400).json({ message: 'Ingresa correo y contraseña.' });
  const user = await db.user.findUnique({
    where: { email: credentials.data.email.toLowerCase() },
    include: studentInclude
  });
  if (!user || !(await bcrypt.compare(credentials.data.password, user.passwordHash))) return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
  return res.json({ token: signToken(user), user: formatUser(user) });
});

app.get('/api/auth/me', auth(), async (req: RequestWithUser, res) => {
  const user = await db.user.findUnique({
    where: { id: req.user!.id },
    include: studentInclude
  });
  return res.json(formatUser(user));
});
app.patch('/api/auth/me', auth(), async (req: RequestWithUser, res) => {
  const input = z.object({
    nombres: z.string().trim().min(2).max(80),
    apellidos: z.string().trim().min(2).max(80),
    telefono: z.string().trim().min(7).max(20).optional().or(z.literal('')),
    carreraInteres: z.string().trim().max(100).optional(),
    areaRefuerzo: z.string().trim().max(100).optional(),
    nivelEducativo: z.string().trim().max(100).optional()
  }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ message: 'Revisa los datos de tu perfil.' });
  const { carreraInteres, areaRefuerzo, nivelEducativo, ...userData } = input.data;
  const user = await db.user.update({
    where: { id: req.user!.id },
    data: {
      ...userData,
      studentProfile: req.user!.rol === Role.STUDENT ? { upsert: { create: { carreraInteres, areaRefuerzo, nivelEducativo }, update: { carreraInteres, areaRefuerzo, nivelEducativo } } } : undefined
    },
    include: { studentProfile: true }
  });
  return res.json({ ...user, passwordHash: undefined });
});
app.post('/api/onboarding/complete', auth([Role.STUDENT]), async (req: RequestWithUser, res) => {
  const input = z.object({
    carreraInteres: z.string().trim().min(2).max(100),
    areaRefuerzo: z.string().trim().min(2).max(100),
    nivelEducativo: z.string().trim().min(2).max(100),
    fechaExamen: z.string().datetime().optional(),
    horasSemanales: z.number().min(2).max(40)
  }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ message: 'Completa los datos para personalizar tu ruta.' });
  const subscription = await db.subscription.findFirst({ where: { studentId: req.user!.id, estadoAcceso: AccessStatus.ACTIVADO, fechaFin: { gt: new Date() } }, include: { plan: true }, orderBy: { fechaInicio: 'desc' } });
  if (!subscription || !subscription.plan.nombre.includes('Meta UNT')) return res.status(403).json({ message: 'La personalización está disponible para Meta UNT.' });
  await db.studentProfile.upsert({
    where: { userId: req.user!.id },
    create: { userId: req.user!.id, carreraInteres: input.data.carreraInteres, areaRefuerzo: input.data.areaRefuerzo, nivelEducativo: input.data.nivelEducativo, fechaExamen: input.data.fechaExamen ? new Date(input.data.fechaExamen) : null },
    update: { carreraInteres: input.data.carreraInteres, areaRefuerzo: input.data.areaRefuerzo, nivelEducativo: input.data.nivelEducativo, fechaExamen: input.data.fechaExamen ? new Date(input.data.fechaExamen) : null }
  });
  await db.subscription.update({ where: { id: subscription.id }, data: { estadoOnboarding: 'COMPLETADO' } });
  return res.json({ message: 'Tu ruta personalizada está lista.', horasSemanales: input.data.horasSemanales });
});
app.get('/api/plans', async (_req, res) => res.json(await db.plan.findMany({ where: { activo: true }, orderBy: { precioMensual: 'asc' } })));

app.post('/api/guardians/link', auth([Role.GUARDIAN]), async (req: RequestWithUser, res) => {
  const input = z.object({ studentEmail: z.string().email(), relacionConEstudiante: z.string().min(2), autorizadoContacto: z.boolean().default(true) }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ message: 'Completa los datos del estudiante.' });
  const student = await db.user.findFirst({ where: { email: input.data.studentEmail.toLowerCase(), rol: Role.STUDENT } });
  if (!student) return res.status(404).json({ message: 'No encontramos un estudiante con ese correo.' });
  await db.studentGuardian.upsert({ where: { studentId_guardianId: { studentId: student.id, guardianId: req.user!.id } }, update: {}, create: { studentId: student.id, guardianId: req.user!.id } });
  await db.guardianProfile.update({ where: { userId: req.user!.id }, data: { relacionConEstudiante: input.data.relacionConEstudiante, autorizadoContacto: input.data.autorizadoContacto } });
  return res.json({ message: 'Estudiante asociado correctamente.', student: { id: student.id, nombres: student.nombres, apellidos: student.apellidos } });
});

app.get('/api/guardians/students', auth([Role.GUARDIAN]), async (req: RequestWithUser, res) => {
  const links = await db.studentGuardian.findMany({
    where: { guardianId: req.user!.id }
  });

  const studentIds = links.map(l => l.studentId);
  const studentUsers = await db.user.findMany({
    where: { id: { in: studentIds } },
    include: {
      studentProfile: {
        include: {
          subscriptions: {
            where: { estadoAcceso: AccessStatus.ACTIVADO, fechaFin: { gt: new Date() } },
            include: { plan: true }
          }
        }
      }
    }
  });

  const students = studentUsers.map(s => {
    const sub = s.studentProfile?.subscriptions[0];
    return {
      id: s.id,
      nombres: s.nombres,
      apellidos: s.apellidos,
      email: s.email,
      telefono: s.telefono,
      carrera: s.studentProfile?.carreraInteres || 'Ingeniería / Ciencias',
      plan: sub?.plan?.nombre || 'Sin plan activo',
      areaRefuerzo: s.studentProfile?.areaRefuerzo || 'Intermedio Competitivo',
      metricas: {
        asistencia: 94,
        horasEstudio: 6.5,
        sesionesCompletadas: 12,
        puntajeActual: 740,
        puntajeCorte: 810,
        percentil: 'Top 18% general'
      }
    };
  });

  return res.json({ students });
});

app.post('/api/trials/activate', auth([Role.STUDENT]), async (req: RequestWithUser, res) => {
  const existing = await db.subscription.findFirst({ where: { studentId: req.user!.id, plan: { diasPrueba: { gt: 0 } } } });
  if (existing) return res.status(409).json({ message: 'Tu prueba gratuita ya fue activada.' });
  const activeSubscription = await db.subscription.findFirst({ where: { studentId: req.user!.id, estadoAcceso: AccessStatus.ACTIVADO, fechaFin: { gt: new Date() } } });
  if (activeSubscription) return res.status(409).json({ message: 'Ya tienes un plan activo. Puedes mejorarlo desde Planes y servicios.' });
  const plan = await db.plan.findFirst({ where: { diasPrueba: { gt: 0 }, activo: true } });
  if (!plan) return res.status(404).json({ message: 'No hay una prueba disponible.' });
  const subscription = await db.subscription.create({ data: { studentId: req.user!.id, planId: plan.id, fechaFin: new Date(Date.now() + plan.diasPrueba * 86400000), estadoAcceso: AccessStatus.ACTIVADO, estadoOnboarding: 'INICIADO' } });
  await db.user.update({ where: { id: req.user!.id }, data: { etapaComercial: CommercialStage.LEAD } });
  return res.status(201).json(subscription);
});

async function payableStudent(payer: { id: string; rol: Role }, requestedId?: string) {
  const studentId = requestedId || (payer.rol === Role.STUDENT ? payer.id : undefined);
  if (!studentId) return null;
  if (payer.rol === Role.STUDENT && studentId === payer.id) return studentId;
  const link = await db.studentGuardian.findUnique({ where: { studentId_guardianId: { studentId, guardianId: payer.id } } });
  return link ? studentId : null;
}

async function confirmPaymentRecord(payment: any, studentId: string, months: number, detail: string) {
  if (months !== 1 && months !== 6) throw new Error('La duración elegida no es válida.');
  if (months === 6 && !payment.plan.precioSemestral) throw new Error('Este plan no ofrece modalidad semestral.');
  return db.$transaction(async tx => {
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, estadoTransaccion: TransactionStatus.INICIADA },
      data: { estadoTransaccion: TransactionStatus.PENDIENTE }
    });
    if (!claimed.count) {
      const current = await tx.payment.findUnique({ where: { id: payment.id }, include: { plan: true, subscription: true } });
      if (current?.estadoTransaccion === TransactionStatus.CONFIRMADA) return current;
      throw new Error('Este pago ya no está disponible.');
    }

    const prior = await tx.subscription.findFirst({
      where: { studentId, planId: payment.planId, estadoAcceso: AccessStatus.ACTIVADO, fechaFin: { gt: new Date() } },
      orderBy: { fechaFin: 'desc' }
    });
    const start = prior?.fechaFin || new Date();
    await tx.subscription.updateMany({
      where: { studentId, planId: { not: payment.planId }, estadoAcceso: AccessStatus.ACTIVADO },
      data: { estadoAcceso: AccessStatus.SUSPENDIDO }
    });
    const completedOnboarding = await tx.subscription.findFirst({
      where: { studentId, estadoOnboarding: 'COMPLETADO' },
      select: { id: true }
    });
    const subscription = await tx.subscription.create({
      data: {
        studentId,
        planId: payment.planId,
        fechaInicio: start,
        fechaFin: new Date(start.getTime() + months * 30 * 86400000),
        estadoAcceso: AccessStatus.ACTIVADO,
        estadoOnboarding: completedOnboarding ? 'COMPLETADO' : 'PENDIENTE'
      }
    });
    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        subscriptionId: subscription.id,
        estadoTransaccion: TransactionStatus.CONFIRMADA,
        fechaConfirmacion: new Date(),
        attempts: { create: { canalPago: payment.canalPago, estado: 'CONFIRMADA', detalle: detail } }
      },
      include: { plan: true, subscription: true }
    });
    await tx.user.update({ where: { id: studentId }, data: { etapaComercial: CommercialStage.PAYER } });
    return updated;
  });
}

app.post('/api/payments/create', auth([Role.STUDENT, Role.GUARDIAN]), async (req: RequestWithUser, res) => {
  const input = z.object({ planId: z.string().min(1), canalPago: z.enum(['YAPE', 'PLIN']), monto: z.number().nonnegative(), recurrencia: z.boolean(), studentId: z.string().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ message: 'Datos de pago inválidos.', issues: input.error.flatten() });
  const studentId = await payableStudent(req.user!, input.data.studentId);
  const plan = await db.plan.findUnique({ where: { id: input.data.planId } });
  if (!studentId || !plan || plan.diasPrueba > 0) return res.status(400).json({ message: 'No se pudo preparar este pago.' });
  const expected = input.data.monto;
  if (![plan.precioMensual, plan.precioSemestral].filter(Boolean).some(price => Math.abs(expected - Number(price)) < .01)) return res.status(400).json({ message: 'El monto no corresponde al plan elegido.' });
  await db.user.update({ where: { id: studentId }, data: { etapaComercial: CommercialStage.LEAD } });
  const payment = await db.payment.create({ data: { userId: req.user!.id, planId: plan.id, canalPago: input.data.canalPago, monto: expected, autorizacionRecurrencia: input.data.recurrencia, codigoOperacion: 'PRE-' + randomUUID().slice(0, 8).toUpperCase() } });
  return res.status(201).json({ ...payment, studentId });
});

app.post('/api/payments/stripe/checkout-session', auth([Role.STUDENT, Role.GUARDIAN]), async (req: RequestWithUser, res) => {
  if (!stripe) return res.status(503).json({ message: 'Stripe no está configurado. Agrega STRIPE_SECRET_KEY con tu clave de prueba.' });
  const input = z.object({ planId: z.string().min(1), modalidad: z.enum(['mensual', 'semestral']), studentId: z.string().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ message: 'Datos de Stripe inválidos.' });

  const studentId = await payableStudent(req.user!, input.data.studentId);
  const plan = await db.plan.findUnique({ where: { id: input.data.planId } });
  const months = input.data.modalidad === 'semestral' ? 6 : 1;
  const amount = months === 6 ? Number(plan?.precioSemestral) : Number(plan?.precioMensual);
  if (!studentId || !plan || plan.diasPrueba > 0 || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: 'No se pudo preparar el cobro para este plan.' });
  }

  const payer = await db.user.findUnique({ where: { id: req.user!.id }, select: { email: true } });
  const payment = await db.payment.create({
    data: {
      userId: req.user!.id,
      planId: plan.id,
      canalPago: PaymentChannel.CARD,
      monto: amount,
      autorizacionRecurrencia: false,
      codigoOperacion: 'STRIPE-' + randomUUID().slice(0, 8).toUpperCase()
    }
  });
  await db.user.update({ where: { id: studentId }, data: { etapaComercial: CommercialStage.LEAD } });

  const requestOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  const origin = (localOriginPattern.test(requestOrigin) || configuredOrigins.includes(requestOrigin))
    ? requestOrigin
    : publicFrontendUrl;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: payer?.email || undefined,
      client_reference_id: payment.id,
      metadata: { paymentId: payment.id, studentId, months: String(months), planId: plan.id },
      payment_intent_data: { metadata: { paymentId: payment.id, studentId, planId: plan.id } },
      line_items: [{
        price_data: {
          currency: 'pen',
          product_data: { name: `La PRE Digital · ${plan.nombre}`, description: plan.descripcion },
          unit_amount: Math.round(amount * 100)
        },
        quantity: 1
      }],
      success_url: `${origin}/#/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#/checkout?stripe=cancelled`
    });
    await db.payment.update({
      where: { id: payment.id },
      data: { attempts: { create: { canalPago: PaymentChannel.CARD, estado: 'PENDIENTE', detalle: `Checkout Stripe iniciado (${session.id}).` } } }
    });
    if (!session.url) throw new Error('Stripe no devolvió una URL de Checkout.');
    return res.status(201).json({ url: session.url });
  } catch (error: any) {
    await db.payment.update({ where: { id: payment.id }, data: { estadoTransaccion: TransactionStatus.RECHAZADA } });
    return res.status(400).json({ message: error.message || 'No se pudo iniciar Stripe Checkout.' });
  }
});

app.get('/api/payments/stripe/session/:sessionId', auth([Role.STUDENT, Role.GUARDIAN]), async (req: RequestWithUser, res) => {
  if (!stripe) return res.status(503).json({ message: 'Stripe no está configurado.' });
  const sessionId = String(req.params.sessionId);
  if (!sessionId.startsWith('cs_')) return res.status(400).json({ message: 'Sesión de Stripe inválida.' });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentId = session.metadata?.paymentId;
    const studentId = session.metadata?.studentId;
    const months = Number(session.metadata?.months || 1);
    const payment = paymentId ? await db.payment.findUnique({ where: { id: paymentId }, include: { plan: true } }) : null;
    if (!payment || payment.userId !== req.user!.id) return res.status(404).json({ message: 'No encontramos este pago.' });
    const confirmed = session.payment_status === 'paid' && payment.estadoTransaccion === TransactionStatus.INICIADA && studentId
      ? await confirmPaymentRecord(payment, studentId, months, `Pago Stripe confirmado al volver de Checkout (${session.id}).`)
      : payment;
    return res.json({ paid: session.payment_status === 'paid', status: session.payment_status, payment: confirmed });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'No se pudo validar el pago con Stripe.' });
  }
});

app.post('/api/payments/:id/confirm', auth([Role.STUDENT, Role.GUARDIAN]), async (req: RequestWithUser, res) => {
  const payment = await db.payment.findUnique({ where: { id: String(req.params.id) }, include: { plan: true } });
  if (!payment || payment.userId !== req.user!.id || payment.estadoTransaccion !== TransactionStatus.INICIADA || payment.canalPago === PaymentChannel.CARD) return res.status(404).json({ message: 'Este pago ya no está disponible.' });
  const studentId = await payableStudent(req.user!, req.body.studentId);
  const months = req.body.modalidad === 'semestral' ? 6 : 1;
  if (!studentId || (months === 6 && !payment.plan.precioSemestral)) return res.status(400).json({ message: 'No se pudo confirmar el pago.' });
  try {
    return res.json(await confirmPaymentRecord(payment, studentId, months, 'Pago de demostración aprobado.'));
  } catch (error: any) {
    return res.status(409).json({ message: error.message || 'No se pudo confirmar el pago.' });
  }
});
app.get('/api/payments/my-payments', auth(), async (req: RequestWithUser, res) => res.json(await db.payment.findMany({ where: { userId: req.user!.id }, include: { plan: true, subscription: { include: { student: { include: { user: true } } } } }, orderBy: { fechaInicio: 'desc' } })));
app.get('/api/admin/users', auth([Role.ADMIN]), async (_req, res) => res.json(await db.user.findMany({ select: { id: true, nombres: true, apellidos: true, email: true, rol: true, etapaComercial: true, createdAt: true }, orderBy: { createdAt: 'desc' } })));
app.get('/api/admin/payments', auth([Role.ADMIN]), async (_req, res) => res.json(await db.payment.findMany({
  include: { user: { select: { id: true, nombres: true, apellidos: true, email: true, rol: true } }, plan: true, subscription: true, attempts: { orderBy: { createdAt: 'desc' } } },
  orderBy: { fechaInicio: 'desc' }
})));
app.get('/api/admin/users/:id/progress', auth([Role.ADMIN]), async (req, res) => {
  const user = await db.user.findFirst({
    where: { id: String(req.params.id), rol: Role.STUDENT },
    include: {
      studentProfile: { include: { subscriptions: { include: { plan: true }, orderBy: { fechaInicio: 'desc' } } } },
      payments: { include: { plan: true }, orderBy: { fechaInicio: 'desc' } }
    }
  });
  if (!user) return res.status(404).json({ message: 'Estudiante no encontrado.' });
  const active = user.studentProfile?.subscriptions.find(item => item.estadoAcceso === AccessStatus.ACTIVADO);
  return res.json({
    student: { id: user.id, nombres: user.nombres, apellidos: user.apellidos, email: user.email, etapaComercial: user.etapaComercial, carreraInteres: user.studentProfile?.carreraInteres },
    subscription: active || user.studentProfile?.subscriptions[0] || null,
    academic: { avanceSemanal: active ? 68 : 0, horasEstudiadas: active ? 6.5 : 0, actividadesCompletadas: active ? 12 : 0, proximaActividad: active ? 'Patrones y sucesiones' : null },
    payments: user.payments
  });
});
app.get('/api/student/guardian', auth([Role.STUDENT]), requireStudentPlan(4), async (req: RequestWithUser, res) => {
  const studentId = req.user!.id;
  const link = await db.studentGuardian.findFirst({
    where: { studentId }
  });
  if (!link) return res.json({ linked: false });

  const guardian = await db.user.findUnique({
    where: { id: link.guardianId },
    include: { guardianProfile: true }
  });
  if (!guardian) return res.json({ linked: false });

  return res.json({
    linked: true,
    guardian: {
      id: guardian.id,
      nombres: guardian.nombres,
      apellidos: guardian.apellidos,
      email: guardian.email,
      telefono: guardian.telefono,
      relacion: guardian.guardianProfile?.relacionConEstudiante || 'Apoderado',
      autorizadoContacto: guardian.guardianProfile?.autorizadoContacto ?? true
    }
  });
});

app.post('/api/student/guardian', auth([Role.STUDENT]), requireStudentPlan(4), async (req: RequestWithUser, res) => {
  const schema = z.object({
    nombres: z.string().trim().min(2, 'Ingresa nombres válidos.'),
    apellidos: z.string().trim().min(2, 'Ingresa apellidos válidos.'),
    email: z.string().trim().email('Ingresa un correo electrónico válido.').transform(v => v.toLowerCase()),
    telefono: z.string().trim().min(6, 'Ingresa un teléfono válido.'),
    relacion: z.string().trim().min(2, 'Indica el parentesco.')
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Datos de apoderado incompletos.', issues: parsed.error.flatten() });

  const studentId = req.user!.id;
  const { nombres, apellidos, email, telefono, relacion } = parsed.data;

  let guardian = await db.user.findUnique({ where: { email } });
  if (!guardian) {
    guardian = await db.user.create({
      data: {
        nombres,
        apellidos,
        email,
        telefono,
        rol: Role.GUARDIAN,
        passwordHash: await bcrypt.hash('Pre123456!', 10),
        guardianProfile: {
          create: {
            relacionConEstudiante: relacion,
            autorizadoContacto: true
          }
        }
      }
    });
  } else {
    await db.user.update({
      where: { id: guardian.id },
      data: { nombres, apellidos, telefono }
    });
    await db.guardianProfile.upsert({
      where: { userId: guardian.id },
      create: { userId: guardian.id, relacionConEstudiante: relacion, autorizadoContacto: true },
      update: { relacionConEstudiante: relacion, autorizadoContacto: true }
    });
  }

  await db.studentGuardian.upsert({
    where: {
      studentId_guardianId: {
        studentId,
        guardianId: guardian.id
      }
    },
    create: {
      studentId,
      guardianId: guardian.id
    },
    update: {}
  });

  return res.json({
    ok: true,
    message: 'Apoderado vinculado con éxito.',
    guardian: {
      id: guardian.id,
      nombres,
      apellidos,
      email,
      telefono,
      relacion
    }
  });
});

app.get('/api/student/report-data', auth([Role.STUDENT]), requireStudentPlan(4), async (req: RequestWithUser, res) => {
  const student = await db.user.findUnique({
    where: { id: req.user!.id },
    include: {
      studentProfile: {
        include: {
          subscriptions: {
            where: { estadoAcceso: AccessStatus.ACTIVADO, fechaFin: { gt: new Date() } },
            include: { plan: true }
          }
        }
      }
    }
  });
  if (!student) return res.status(404).json({ message: 'Estudiante no encontrado.' });

  const sub = student.studentProfile?.subscriptions[0];
  const guardianLink = await db.studentGuardian.findFirst({ where: { studentId: student.id } });
  const guardian = guardianLink
    ? await db.user.findUnique({ where: { id: guardianLink.guardianId }, include: { guardianProfile: true } })
    : null;

  return res.json({
    fechaEmision: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }),
    estudiante: {
      nombres: `${student.nombres} ${student.apellidos}`,
      email: student.email,
      carrera: student.studentProfile?.carreraInteres || 'Ingeniería / Ciencias',
      plan: sub?.plan?.nombre || 'Sin plan activo',
      validoHasta: sub?.fechaFin ? new Date(sub.fechaFin).toLocaleDateString('es-PE') : 'Sin vigencia'
    },
    apoderado: guardian
      ? {
          nombres: `${guardian.nombres} ${guardian.apellidos}`,
          telefono: guardian.telefono || 'No registrado',
          relacion: guardian.guardianProfile?.relacionConEstudiante || 'Apoderado'
        }
      : null,
    metricas: {
      asistencia: 94,
      horasEstudio: 6.5,
      sesionesCompletadas: 12,
      sesionesTotales: 14,
      puntajeActual: 740,
      puntajeCorte: 810,
      percentil: 'Top 18% general'
    },
    desgloseAreas: [
      { area: 'Razonamiento Matemático', efectividad: 82, nivel: 'Sobresaliente' },
      { area: 'Razonamiento Verbal', efectividad: 65, nivel: 'Requiere refuerzo' },
      { area: 'Ciencias y Biología', efectividad: 78, nivel: 'Competitivo' },
      { area: 'Física y Química', efectividad: 70, nivel: 'En progresión' }
    ],
    observacionPedagogica:
      'El postulante mantiene una disciplina destacada en razonamiento cuantitativo y ciencias. Se recomienda sostener el ritmo diario de práctica y reforzar la resolución de analogías y textos complejos en razonamiento verbal.'
  });
});

app.get('/api/student/academic-analytics', auth([Role.STUDENT]), requireStudentPlan(3), async (req: RequestWithUser, res) => {
  const student = await db.user.findUnique({
    where: { id: req.user!.id },
    include: {
      studentProfile: {
        include: {
          subscriptions: {
            where: { estadoAcceso: AccessStatus.ACTIVADO, fechaFin: { gt: new Date() } },
            include: { plan: true }
          }
        }
      }
    }
  });
  if (!student) return res.status(404).json({ message: 'Estudiante no encontrado.' });

  const careersCutoff: Record<string, { corte: number; vacantes: number; area: string }> = {
    'Medicina Humana': { corte: 855, vacantes: 45, area: 'Ciencias Médicas' },
    'Ingeniería de Sistemas': { corte: 790, vacantes: 60, area: 'Ingeniería' },
    'Ingeniería Industrial': { corte: 765, vacantes: 70, area: 'Ingeniería' },
    'Derecho': { corte: 750, vacantes: 80, area: 'Ciencias Sociales y Jurídicas' },
    'Arquitectura y Urbanismo': { corte: 745, vacantes: 40, area: 'Ingeniería y Diseño' },
    'Enfermería': { corte: 730, vacantes: 55, area: 'Ciencias Médicas' },
    'Psicología': { corte: 725, vacantes: 65, area: 'Humanidades y Salud' },
    'Contabilidad y Finanzas': { corte: 710, vacantes: 90, area: 'Ciencias Económicas' },
    'Administración': { corte: 705, vacantes: 85, area: 'Ciencias Económicas' },
    'Arqueología': { corte: 680, vacantes: 35, area: 'Ciencias Sociales' }
  };

  const requestedCareer = (req.query.carrera as string) || student.studentProfile?.carreraInteres || 'Ingeniería de Sistemas';
  const foundKey =
    Object.keys(careersCutoff).find(k => k.toLowerCase() === requestedCareer.toLowerCase()) ||
    Object.keys(careersCutoff).find(
      k => requestedCareer.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(requestedCareer.toLowerCase())
    ) ||
    'Ingeniería de Sistemas';

  const careerInfo = careersCutoff[foundKey];
  const puntajeActual = 740;
  const brecha = careerInfo.corte - puntajeActual;
  const ratio = Math.min(Math.max(Math.round((puntajeActual / careerInfo.corte) * 100), 40), 99);

  let probabilidadTexto = 'Alta';
  let probabilidadColor = '#10b981';
  let estadoVacante = 'En zona de vacante';
  if (brecha > 60) {
    probabilidadTexto = 'Competitiva en desarrollo';
    probabilidadColor = '#f59e0b';
    estadoVacante = 'A ' + brecha + ' pts de zona segura';
  } else if (brecha > 0) {
    probabilidadTexto = 'Muy alta';
    probabilidadColor = '#1e5ee5';
    estadoVacante = 'A tiro de vacante (' + brecha + ' pts)';
  } else {
    probabilidadTexto = 'Excelente';
    probabilidadColor = '#10b981';
    estadoVacante = 'Supera corte por +' + Math.abs(brecha) + ' pts';
  }

  return res.json({
    carreraSeleccionada: foundKey,
    carrerasDisponibles: Object.keys(careersCutoff).map(k => ({
      nombre: k,
      corte: careersCutoff[k].corte,
      area: careersCutoff[k].area,
      vacantes: careersCutoff[k].vacantes
    })),
    resumen: {
      puntajeActual,
      puntajeCorte: careerInfo.corte,
      brecha,
      probabilidadPorcentaje: ratio,
      probabilidadTexto,
      probabilidadColor,
      estadoVacante,
      areaGeneral: careerInfo.area,
      percentilEstudiante: 82,
      totalPreguntasSimuladas: 180
    },
    velocidad: {
      tiempoPromedioSegundos: 88,
      tiempoOptimoSegundos: 80,
      ritmoEstado: 'Ritmo competitivo',
      recomendacionVelocidad:
        'Ganas buen tiempo en ciencias y biología. En razonamiento verbal podrías recortar 8 segundos por texto para asegurar tiempo de revisión final.'
    },
    radarAreas: [
      {
        area: 'Razonamiento Matemático',
        pct: 82,
        color: 'blue',
        aciertos: '29 / 35',
        tiempoMedio: '1m 45s',
        estado: 'Dominio fuerte'
      },
      {
        area: 'Razonamiento Verbal',
        pct: 65,
        color: 'amber',
        aciertos: '20 / 30',
        tiempoMedio: '1m 15s',
        estado: 'Prioridad alta de refuerzo'
      },
      {
        area: 'Ciencias y Biología',
        pct: 78,
        color: 'emerald',
        aciertos: '23 / 30',
        tiempoMedio: '1m 30s',
        estado: 'Zona competitiva'
      },
      {
        area: 'Física y Química',
        pct: 70,
        color: 'indigo',
        aciertos: '18 / 25',
        tiempoMedio: '2m 05s',
        estado: 'Progresión favorable'
      }
    ],
    temasPrioritarios: [
      {
        materia: 'Raz. Verbal',
        tema: 'Analogías y Relaciones Semánticas',
        payoff: '+18 pts en prueba general',
        dificultad: 'Intermedio',
        efectividadActual: '58%',
        runnerType: 'exercise',
        accion: 'Resolver bloque'
      },
      {
        materia: 'Física UNT',
        tema: 'Cinemática y Dinámica Lineal',
        payoff: '+15 pts en ciencias',
        dificultad: 'Avanzado',
        efectividadActual: '62%',
        runnerType: 'exercise',
        accion: 'Resolver bloque'
      },
      {
        materia: 'Raz. Matemático',
        tema: 'Sucesiones y Sumatorias Notables',
        payoff: '+12 pts cuantitativos',
        dificultad: 'Intermedio',
        efectividadActual: '74%',
        runnerType: 'lesson',
        accion: 'Repasar teoría'
      }
    ],
    planEstrategicoSemanal: [
      'Dedica un bloque de 25 min diarios a razonamiento verbal (comprensión de textos DECO y analogías semánticas).',
      'Realiza una prueba corta de 10 ejercicios de física con cronómetro para calibrar el tiempo medio a menos de 1m 50s.',
      'Rinde el simulacro general programado para este sábado para validar el avance del percentil.'
    ]
  });
});

app.get('/api/materials', auth([Role.STUDENT]), requireStudentPlan(2), async (_req: RequestWithUser, res) => {
  const materials = [
    {
      id: 'mat-01',
      semana: 'Semana 01',
      materia: 'Razonamiento Matemático',
      titulo: 'Sucesiones, Progresiones Aritméticas y Series UNT',
      descripcion:
        'Compendio teórico completo con fórmulas de término enésimo, propiedades de sumatorias y 35 ejercicios modelo resueltos paso a paso.',
      paginas: 18,
      tamano: '2.4 MB',
      formato: 'PDF Oficial',
      destacado: true,
      sintesis:
        'Una progresión aritmética (P.A.) es una sucesión en la que cada término se obtiene sumando al anterior una cantidad constante llamada razón (r). Las series notables permiten calcular sumatorias de los primeros números naturales, pares, impares y cuadrados.',
      formulas: [
        'Término general: Tn = T1 + (n - 1) × r',
        'Número de términos: n = [(Tu - T1) / r] + 1',
        'Suma de términos: Sn = [(T1 + Tn) / 2] × n',
        'Suma de primeros n naturales: S = [n(n + 1)] / 2',
        'Suma de primeros n impares: S = n²'
      ],
      ejercicioModelo: {
        enunciado: 'En la progresión aritmética: 7, 11, 15, 19, ... determine el término que ocupa la posición 25.',
        solucion:
          'Identificamos T1 = 7 y razón r = 11 - 7 = 4. Aplicamos la fórmula del término general: T25 = 7 + (25 - 1) × 4 = 7 + 24 × 4 = 7 + 96 = 103.'
      }
    },
    {
      id: 'mat-02',
      semana: 'Semana 01',
      materia: 'Razonamiento Verbal',
      titulo: 'Comprensión Lectora y Analogías Semánticas',
      descripcion:
        'Estrategias de análisis de textos científicos y filosóficos tipo DECO de la UNT, campos léxicos y relaciones lógicas.',
      paginas: 14,
      tamano: '1.8 MB',
      formato: 'PDF Oficial',
      destacado: false,
      sintesis:
        'Las analogías semánticas miden la capacidad de identificar relaciones de semejanza entre pares de conceptos (parte-todo, causa-efecto, intensidad, sinonimia condicionada). En comprensión de textos UNT se evalúa la jerarquía de ideas, la intención del autor y la extrapolación semántica.',
      formulas: [
        'Método RON: Relación, Orden y Naturaleza semántica',
        'Estructura textual: Tesis central vs. Argumentos de soporte',
        'Tipos de inferencia: Deductiva (general a particular) e Inductiva'
      ],
      ejercicioModelo: {
        enunciado: 'Determine el par análogo que reproduce la relación lógica: EPÍLOGO : LIBRO ::',
        solucion:
          'La relación es de parte final a la obra completa en su totalidad. El epílogo concluye un libro, así como el desenlace concluye una novela (DESENLACE : NOVELA).'
      }
    },
    {
      id: 'mat-03',
      semana: 'Semana 02',
      materia: 'Biología y Anatomía',
      titulo: 'Biomoléculas Orgánicas y Estructura Celular',
      descripcion:
        'Resumen gráfico de glúcidos, lípidos, proteínas, ácidos nucleicos y organelas celulares con preguntas de fijación.',
      paginas: 22,
      tamano: '3.1 MB',
      formato: 'PDF Oficial',
      destacado: true,
      sintesis:
        'Las biomoléculas orgánicas son los pilares de los seres vivos: glúcidos (fuente de energía inmediata), lípidos (reserva y membranas), proteínas (estructurales y biocatalizadoras) y ácidos nucleicos (almacenamiento de información genética en ADN y ARN).',
      formulas: [
        'Enlace glucosídico: Unión entre monosacáridos con liberación de H2O',
        'Enlace peptídico: Entre grupo amino (-NH2) y grupo carboxilo (-COOH)',
        'Estructura celular: Membrana fosfolipídica de mosaico fluido (Singer-Nicholson)'
      ],
      ejercicioModelo: {
        enunciado: '¿Cuál de los siguientes polisacáridos cumple función de reserva energética en los animales y se almacena en el hígado y tejido muscular?',
        solucion:
          'El glucógeno es el principal polisacárido de reserva energética en animales, formado por ramificaciones de alfa-glucosa.'
      }
    },
    {
      id: 'mat-04',
      semana: 'Semana 02',
      materia: 'Geometría y Trigonometría',
      titulo: 'Triángulos, Congruencia y Líneas Notables',
      descripcion:
        'Formulario esencial de teoremas de ángulos interiores, exteriores, cevianas, medianas y bisectrices.',
      paginas: 16,
      tamano: '2.0 MB',
      formato: 'PDF Oficial',
      destacado: false,
      sintesis:
        'Los triángulos constituyen la base de la geometría euclidiana plana. Los teoremas angulares fundamentales y los criterios de congruencia (LAL, ALA, LLL) permiten resolver configuraciones complejas de polígonos y figuras inscritas.',
      formulas: [
        'Suma de ángulos interiores: α + β + θ = 180°',
        'Ángulo exterior: e = α + β (suma de los dos no adyacentes)',
        'Teorema de la bisectriz interior: AB / BC = AD / DC',
        'Teorema de Pitágoras: a² + b² = c² (en triángulo rectángulo)'
      ],
      ejercicioModelo: {
        enunciado: 'En un triángulo rectángulo ABC, los catetos miden 9 cm y 12 cm. Calcule la longitud de la altura relativa a la hipotenusa.',
        solucion:
          'Hipotenusa c = √(9² + 12²) = √(81 + 144) = √225 = 15 cm. Por relaciones métricas en el triángulo rectángulo: cateto1 × cateto2 = hipotenusa × altura. Entonces: 9 × 12 = 15 × h => 108 = 15h => h = 7.2 cm.'
      }
    },
    {
      id: 'mat-05',
      semana: 'Semana 03',
      materia: 'Física Preuniversitaria',
      titulo: 'Cinemática: MRU, MRUV y Caída Libre',
      descripcion:
        'Guía metodológica de vectores de posición, velocidad instantánea, ecuaciones horarias y gráficos cinemáticos.',
      paginas: 20,
      tamano: '2.7 MB',
      formato: 'PDF Oficial',
      destacado: true,
      sintesis:
        'La cinemática describe el movimiento de los cuerpos sin atender las causas que lo originan. El MRU se caracteriza por velocidad constante (aceleración nula) y el MRUV por aceleración constante en módulo y dirección.',
      formulas: [
        'MRU: d = v × t',
        'MRUV (Velocidad): Vf = Vi ± a × t',
        'MRUV (Distancia): d = Vi × t ± ½ × a × t²',
        'MRUV (Torricelli): Vf² = Vi² ± 2 × a × d',
        'Caída libre vertical: g = 9.8 m/s² (aprox. 10 m/s²)'
      ],
      ejercicioModelo: {
        enunciado: 'Un automóvil parte del reposo y alcanza una velocidad de 20 m/s en 4 segundos con aceleración constante. ¿Qué distancia recorrió en dicho lapso?',
        solucion:
          'Vi = 0 m/s, Vf = 20 m/s, t = 4 s. Aceleración a = (20 - 0) / 4 = 5 m/s². Distancia d = ½ × a × t² = 0.5 × 5 × 16 = 40 metros.'
      }
    },
    {
      id: 'mat-06',
      semana: 'Semana 03',
      materia: 'Química General',
      titulo: 'Estructura Atómica y Configuración Electrónica',
      descripcion:
        'Números cuánticos, principio de Aufbau, regla de Hund y distribución por niveles y subniveles.',
      paginas: 15,
      tamano: '1.9 MB',
      formato: 'PDF Oficial',
      destacado: false,
      sintesis:
        'El átomo moderno consta de un núcleo positivo denso (protones y neutrones) y una nube electrónica descrita por orbitales probabilísticos según la mecánica cuántica de Schrödinger.',
      formulas: [
        'Número de masa: A = Z + N',
        'Carga nuclear: Z = número de protones',
        'Regla de las diagonales (Aufbau): 1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰...',
        'Números cuánticos: n (nivel), l (subnivel: s=0, p=1, d=2, f=3), ml (orbital), ms (espín ±½)'
      ],
      ejercicioModelo: {
        enunciado: 'Determine el número de electrones desapareados que presenta el átomo de Hierro (Fe, Z = 26) en su estado fundamental.',
        solucion:
          'Configuración del Fe (Z=26): [Ar18] 4s² 3d⁶. El subnivel 3d tiene 5 orbitales. Por la regla de Hund, distribuimos 6 electrones: 1 par apareado y 4 electrones con espines paralelos desapareados. Por tanto, posee 4 electrones desapareados.'
      }
    }
  ];
  return res.json(materials);
});

app.get('/api/diagnostic', auth([Role.STUDENT]), requireStudentPlan(1), async (_req: RequestWithUser, res) => {
  return res.json({
    titulo: 'Evaluación Diagnóstica Inicial UNT (15 Preguntas)',
    descripcion:
      'Prueba de calibración académica multidisciplinaria cronometrada que evalúa tus fundamentos en 5 áreas de admisión UNT: Raz. Matemático, Raz. Verbal, Biología, Física y Química.',
    duracionMinutos: 15,
    totalPreguntas: 15,
    preguntas: [
      // Razonamiento Matemático (1-3)
      {
        id: 'd-1',
        materia: 'Raz. Matemático',
        enunciado: 'En la sucesión: 3, 7, 13, 21, 31, ... ¿cuál es el término que ocupa la posición 10?',
        opciones: ['91', '101', '111', '121'],
        correcta: 2,
        explicacion: 'La ley cuadrática de recurrencia es n² + n + 1. Para n = 10: 100 + 10 + 1 = 111.'
      },
      {
        id: 'd-2',
        materia: 'Raz. Matemático',
        enunciado: 'Se define el operador matemático: a * b = 2a + 3b - 5. Calcule el valor de (4 * 2) * 3.',
        opciones: ['18', '20', '22', '25'],
        correcta: 2,
        explicacion: '4 * 2 = 2(4) + 3(2) - 5 = 8 + 6 - 5 = 9. Luego, 9 * 3 = 2(9) + 3(3) - 5 = 18 + 9 - 5 = 22.'
      },
      {
        id: 'd-3',
        materia: 'Raz. Matemático',
        enunciado: 'La suma de las edades de dos hermanos es 36 años. Si el mayor excede al menor en 8 años, ¿cuál es la edad del menor?',
        opciones: ['12 años', '14 años', '16 años', '18 años'],
        correcta: 1,
        explicacion: 'x + (x + 8) = 36 => 2x = 28 => x = 14 años.'
      },

      // Razonamiento Verbal (4-6)
      {
        id: 'd-4',
        materia: 'Raz. Verbal',
        enunciado: 'Identifique el par análogo que completa: EPÍLOGO : LIBRO ::',
        opciones: ['Prólogo : Lectura', 'Desenlace : Novela', 'Partitura : Ópera', 'Corolario : Teorema'],
        correcta: 1,
        explicacion: 'El epílogo es la parte final de un libro, así como el desenlace es el final de una novela.'
      },
      {
        id: 'd-5',
        materia: 'Raz. Verbal',
        enunciado: 'Precisión léxica: El abogado intentó _______ los testimonios presentados por los peritos para favorecer a su defendido.',
        opciones: ['adulterar', 'tergiversar', 'estropear', 'falsear'],
        correcta: 1,
        explicacion: 'Tergiversar significa dar una interpretación forzada o errónea a palabras o acontecimientos.'
      },
      {
        id: 'd-6',
        materia: 'Raz. Verbal',
        enunciado: 'Comprensión lectora: En un texto científico, señalar que un ecosistema exhibe "resiliencia ecológica" alude a:',
        opciones: [
          'Su total inmunidad ante cualquier perturbación externa',
          'Su capacidad de absorber perturbaciones y recuperar su estructura',
          'La ausencia de especies invasoras en su bioma',
          'El crecimiento demográfico descontrolado de sus poblaciones'
        ],
        correcta: 1,
        explicacion: 'La resiliencia ecológica es la capacidad de un ecosistema de sobreponerse a alteraciones y volver a su equilibrio.'
      },

      // Biología y Anatomía (7-9)
      {
        id: 'd-7',
        materia: 'Biología',
        enunciado: '¿Cuál de las siguientes biomoléculas cumple principalmente una función estructural en la pared celular vegetal?',
        opciones: ['Glucógeno', 'Celulosa', 'Almidón', 'Quitina'],
        correcta: 1,
        explicacion: 'La celulosa es un polisacárido estructural fundamental de la pared celular en las plantas.'
      },
      {
        id: 'd-8',
        materia: 'Biología',
        enunciado: 'Al cruzar dos individuos heterocigotos (Aa × Aa) para un carácter con dominancia completa, ¿cuál es la probabilidad de obtener descendencia homocigota dominante (AA)?',
        opciones: ['25% (1/4)', '50% (1/2)', '75% (3/4)', '100%'],
        correcta: 0,
        explicacion: 'En el cuadro de Punnett: 1 AA (25%), 2 Aa (50%), 1 aa (25%).'
      },
      {
        id: 'd-9',
        materia: 'Biología',
        enunciado: '¿Qué glándula endocrina es responsable de segregar las hormonas insulina y glucagón para regular la concentración de glucosa en sangre?',
        opciones: ['Tiroides', 'Páncreas', 'Hipófisis', 'Glándula suprarrenal'],
        correcta: 1,
        explicacion: 'Los islotes de Langerhans en el páncreas producen insulina (células beta) y glucagón (células alfa).'
      },

      // Física Preuniversitaria (10-12)
      {
        id: 'd-10',
        materia: 'Física',
        enunciado: 'Un móvil que parte del reposo acelera a razón constante de 4 m/s². ¿Qué distancia recorre al cabo de 5 segundos?',
        opciones: ['40 m', '50 m', '60 m', '80 m'],
        correcta: 1,
        explicacion: 'd = ½ × a × t² = 0.5 × 4 × 25 = 50 metros.'
      },
      {
        id: 'd-11',
        materia: 'Física',
        enunciado: 'Un bloque de 8 kg reposa sobre una superficie horizontal lisa. Si se le aplica una fuerza horizontal neta de 24 N, ¿cuál es su aceleración?',
        opciones: ['2 m/s²', '3 m/s²', '4 m/s²', '6 m/s²'],
        correcta: 1,
        explicacion: 'Segunda Ley de Newton: F = m × a => a = F / m = 24 N / 8 kg = 3 m/s².'
      },
      {
        id: 'd-12',
        materia: 'Física',
        enunciado: '¿Cuál es la energía cinética de un cuerpo de 4 kg que se desplaza a una velocidad constante de 6 m/s?',
        opciones: ['36 J', '48 J', '72 J', '144 J'],
        correcta: 2,
        explicacion: 'Ec = ½ × m × v² = 0.5 × 4 × (6)² = 2 × 36 = 72 Joules.'
      },

      // Química General (13-15)
      {
        id: 'd-13',
        materia: 'Química',
        enunciado: 'El número atómico Z de un elemento es 17 (Cloro). ¿Cuántos electrones de valencia posee en su última capa?',
        opciones: ['5', '6', '7', '8'],
        correcta: 2,
        explicacion: 'Configuración: 1s² 2s² 2p⁶ 3s² 3p⁵. En el nivel 3 posee 2 + 5 = 7 electrones de valencia.'
      },
      {
        id: 'd-14',
        materia: 'Química',
        enunciado: '¿Qué tipo de enlace químico se produce fundamentalmente por transferencia de electrones entre un metal reactivo (Sodio, Na) y un no metal electronegativo (Cloro, Cl)?',
        opciones: ['Enlace Covalente Apolar', 'Enlace Covalente Polar', 'Enlace Iónico o Electrovalente', 'Enlace Metálico'],
        correcta: 2,
        explicacion: 'La gran diferencia de electronegatividad genera la transferencia completa del electrón, formando un enlace iónico (Na⁺ Cl⁻).'
      },
      {
        id: 'd-15',
        materia: 'Química',
        enunciado: 'En la combustión completa de cualquier hidrocarburo con oxígeno en exceso, los productos principales generados son:',
        opciones: ['CO y H2', 'CO2 y H2O', 'C (hollín) y H2O', 'CH4 y O2'],
        correcta: 1,
        explicacion: 'Toda combustión completa de hidrocarburos libera Dióxido de Carbono (CO2) y vapor de Agua (H2O) junto con energía calorífica.'
      }
    ]
  });
});

app.post('/api/diagnostic/submit', auth([Role.STUDENT]), requireStudentPlan(1), async (req: RequestWithUser, res) => {
  const { respuestas } = req.body;
  const items = Array.isArray(respuestas) ? respuestas : [];
  const total = items.length || 15;
  const aciertos = items.filter((r: any) => r.esCorrecto).length;
  const puntaje = Math.round((aciertos / total) * 1000);

  // Group by area
  const areaCounts: Record<string, { total: number; aciertos: number }> = {
    'Raz. Matemático': { total: 0, aciertos: 0 },
    'Raz. Verbal': { total: 0, aciertos: 0 },
    'Biología': { total: 0, aciertos: 0 },
    'Física': { total: 0, aciertos: 0 },
    'Química': { total: 0, aciertos: 0 }
  };

  items.forEach((r: any) => {
    const m = r.materia || 'Raz. Matemático';
    if (areaCounts[m]) {
      areaCounts[m].total++;
      if (r.esCorrecto) areaCounts[m].aciertos++;
    }
  });

  const desglose = Object.entries(areaCounts).map(([area, data]) => ({
    area,
    aciertos: data.aciertos,
    total: data.total || 3,
    porcentaje: data.total ? Math.round((data.aciertos / data.total) * 100) : 70
  }));

  desglose.sort((a, b) => a.porcentaje - b.porcentaje);
  const prioridadRefuerzo = desglose[0]?.area || 'Raz. Verbal';
  const mayorFortaleza = desglose[desglose.length - 1]?.area || 'Raz. Matemático';

  let nivel = 'Intermedio Competitivo';
  if (puntaje >= 800) nivel = 'Avanzado / Zona de Ingreso';
  else if (puntaje < 600) nivel = 'Básico / Refuerzo Necesario';

  await db.studentProfile.updateMany({
    where: { userId: req.user!.id },
    data: { areaRefuerzo: `${nivel} (${puntaje} pts · Refuerzo: ${prioridadRefuerzo})` }
  });

  return res.json({
    aciertos,
    total,
    puntajeProyectado: puntaje,
    nivelCalibrado: nivel,
    prioridadRefuerzo,
    mayorFortaleza,
    desglose,
    recomendacion:
      `Tu nivel calibrado de entrada es ${nivel} con ${puntaje}/1000 puntos. Tu mayor fortaleza se encuentra en ${mayorFortaleza}, y tu prioridad principal de refuerzo para el examen UNT es ${prioridadRefuerzo}.`
  });
});

app.get('/api/health', async (_req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    return res.json({ ok: true, database: 'connected' });
  } catch {
    return res.status(503).json({ ok: false, database: 'unavailable' });
  }
});

if (isProduction) {
  const frontendDist = path.resolve(__dirname, '../../../frontend/dist');
  app.use(express.static(frontendDist, { maxAge: '1y', immutable: true, index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    return res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error.message);
  return res.status(500).json({ message: 'Ocurrió un error interno. Intenta nuevamente.' });
});

const port = Number(process.env.PORT || 4000);
const server = app.listen(port, '0.0.0.0', () => console.log(`API lista en el puerto ${port}`));

async function shutdown(signal: string) {
  console.log(`${signal}: cerrando servidor...`);
  server.close(async () => {
    await db.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
