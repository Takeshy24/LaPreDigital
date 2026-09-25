import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();
const plans = [
  { nombre: 'Explora UNT', descripcion: 'Diagnóstico, contenidos de muestra y 1 simulacro.', precioMensual: 0, precioSemestral: null, diasPrueba: 14 },
  { nombre: 'Ruta UNT', descripcion: 'Materiales, ejercicios, ruta de estudio y evaluaciones.', precioMensual: 39.9, precioSemestral: null, diasPrueba: 0 },
  { nombre: 'Meta UNT', descripcion: 'Personalización completa, simulacros, análisis y seguimiento mediante IA.', precioMensual: 79.9, precioSemestral: 399.9, diasPrueba: 0 },
  { nombre: 'Meta UNT Plus', descripcion: 'Personalización completa, simulacros, análisis y seguimiento mediante IA. Reportes al apoderado, alertas avanzadas y atención prioritaria.', precioMensual: 99.9, precioSemestral: 499.9, diasPrueba: 0 }
];
async function main() {
  for (const plan of plans) await db.plan.upsert({ where: { nombre: plan.nombre }, update: plan, create: plan });
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@lapredigital.pe').trim().toLowerCase();
  const rawPassword = process.env.ADMIN_PASSWORD?.trim();
  const adminPassword = (rawPassword && rawPassword.length >= 10) ? rawPassword : 'PreDigital2026!';
  if (!rawPassword || rawPassword.length < 10) {
    console.log('[Seed] ADMIN_PASSWORD no fue definida o es menor a 10 caracteres. Se asignó la clave por defecto: PreDigital2026!');
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await db.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, rol: 'ADMIN' },
    create: { nombres: 'Equipo', apellidos: 'PRE', email: adminEmail, passwordHash, rol: 'ADMIN' }
  });
}
main().finally(() => db.$disconnect());
