import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpen,
  Check,
  ChevronDown,
  ClipboardList,
  Clock,
  CreditCard,
  Flame,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
  X,
  Award,
  Calendar,
  BookMarked,
  Lightbulb,
  CheckCircle2,
  Printer,
  Download,
  Phone,
  Mail,
  FileText,
  Edit3,
  UserCheck,
  Zap,
  Sliders,
  Search,
  Eye,
  ChevronRight
} from 'lucide-react';

import './tailwind.css';
import './style.css';
import './admin.css';
import './menu.css';
import './menu-fix.css';
import './student-experience.css';
import './learning.css';
import './spacing.css';
import './admin-sections.css';
import './modal-fix.css';
import './benefits.css';
import './system-header.css';
import './header-offset.css';
import './header-menu-position.css';
import './onboarding.css';
import './runner.css';
import './plan-selection.css';
import './ai-action-plan.css';
import './stripe-checkout.css';
import './mobile-responsive.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

type Plan = {
  id: string;
  nombre: string;
  descripcion: string;
  precioMensual: number;
  precioSemestral?: number;
  diasPrueba: number;
};

const api = async (path: string, method = 'GET', body?: unknown) => {
  const r = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.token ? { Authorization: 'Bearer ' + localStorage.token } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.message);
  return d;
};

const Logo = () => (
  <a className="logo" href="#/">
    La PRE <i>Digital</i>
  </a>
);

const money = (n: number) => (n === 0 ? 'Gratis' : `S/ ${n.toFixed(2)}`);

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'cmu6co4et0000uy5c8sfsy6d9',
    nombre: 'Explora UNT',
    descripcion: 'Diagnóstico, contenidos de muestra y 1 simulacro.',
    precioMensual: 0,
    precioSemestral: 0,
    diasPrueba: 14
  },
  {
    id: 'cmu6co4eu0001uy5c03zwh03x',
    nombre: 'Ruta UNT',
    descripcion: 'Materiales, ejercicios, ruta de estudio y evaluaciones.',
    precioMensual: 39.90,
    precioSemestral: undefined,
    diasPrueba: 0
  },
  {
    id: 'cmu6co4eu0002uy5crfvk6qxb',
    nombre: 'Meta UNT',
    descripcion: 'Personalización completa, simulacros, análisis y seguimiento mediante IA.',
    precioMensual: 79.90,
    precioSemestral: 399.90,
    diasPrueba: 0
  },
  {
    id: 'cmu6co4eu0003uy5ce7hefw50',
    nombre: 'Meta UNT Plus',
    descripcion: 'Personalización completa, simulacros, análisis y seguimiento mediante IA. Reportes al apoderado, alertas avanzadas y atención prioritaria.',
    precioMensual: 99.90,
    precioSemestral: 499.90,
    diasPrueba: 0
  }
];

const benefitsFor = (name: string): string[] =>
  ({
    'Explora UNT': [
      'Diagnóstico inicial',
      'Contenidos de muestra',
      '1 simulacro de bienvenida'
    ],
    'Ruta UNT': [
      'Materiales y recursos',
      'Ejercicios y evaluaciones',
      'Ruta de estudio organizada'
    ],
    'Meta UNT': [
      'Personalización completa',
      'Simulacros con análisis',
      'Seguimiento mediante IA'
    ],
    'Meta UNT Plus': [
      'Personalización completa y simulacros',
      'Análisis y seguimiento mediante IA',
      'Reportes al apoderado',
      'Alertas avanzadas y atención prioritaria'
    ]
  }[name] || []);

function getActiveSubscription(user: any) {
  if (!user?.studentProfile?.subscriptions) return null;
  return (
    user.studentProfile.subscriptions.find(
      (s: any) => s.estadoAcceso === 'ACTIVADO' && new Date(s.fechaFin).getTime() > Date.now()
    ) || null
  );
}

function SystemHeader({ user, section }: { user?: any; section: string }) {
  const [profile, setProfile] = useState<any>(user);

  useEffect(() => {
    if (localStorage.token) {
      api('/auth/me')
        .then(setProfile)
        .catch(() => {});
    }
  }, [user]);

  const current = profile || user;
  const initials = current
    ? (current.nombres?.[0] || '') + (current.apellidos?.[0] || '')
    : 'AD';
  const sub = getActiveSubscription(current);
  const planName = sub?.plan?.nombre || (current?.rol === 'ADMIN' ? 'Administración' : 'Estudiante UNT');
  const carrera = current?.studentProfile?.carreraInteres;

  return (
    <>
      <div className="system-header">
        <div className="system-context">
          <span>LA PRE DIGITAL</span>
          <b>/</b>
          <strong>{section}</strong>
          {carrera && (
            <>
              <b>·</b>
              <span style={{ color: '#1e5ee5', fontWeight: 700 }}>Meta: {carrera}</span>
            </>
          )}
        </div>
        <div className="system-actions">
          <div className="system-streak-pill" title="Días consecutivos de estudio esta semana">
            <Flame size={15} />
            <span>4 días de racha</span>
          </div>
          <button className="notification" aria-label="Notificaciones">
            <BellRing size={19} />
            <i />
          </button>
          <div className="system-user">
            <div className="system-avatar">{initials}</div>
            <div>
              <b>{current ? `${current.nombres} ${current.apellidos}` : 'Equipo PRE'}</b>
              <small>{planName}</small>
            </div>
            <ChevronDown size={15} color="#94a3b8" />
          </div>
        </div>
      </div>
      {current && <Onboarding user={current} onDone={setProfile} />}
    </>
  );
}

function Header({ go }: { go: (s: string) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header>
        <Logo />
        <nav>
          <a href="#beneficios">Beneficios</a>
          <a onClick={() => go('plans')}>Planes</a>
          <a onClick={() => go('login')}>Iniciar sesión</a>
          <button onClick={() => go('register')}>
            Empieza gratis <ArrowRight size={16} />
          </button>
        </nav>
        <button
          className="mobile mobile-menu-btn"
          aria-label="Abrir menú de navegación"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={23} />
        </button>
      </header>

      {mobileOpen && (
        <>
          <div
            className="public-mobile-backdrop"
            onClick={() => setMobileOpen(false)}
          />
          <div className="public-mobile-drawer" role="dialog" aria-modal="true">
            <div className="public-mobile-drawer-head">
              <Logo />
              <button
                className="public-mobile-close"
                aria-label="Cerrar menú"
                onClick={() => setMobileOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="public-mobile-links">
              <a
                href="#beneficios"
                onClick={() => setMobileOpen(false)}
              >
                <span>Beneficios y Metodología</span>
                <ChevronRight size={16} />
              </a>
              <button
                onClick={() => {
                  go('plans');
                  setMobileOpen(false);
                }}
              >
                <span>Planes y servicios</span>
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => {
                  go('login');
                  setMobileOpen(false);
                }}
              >
                <span>Iniciar sesión</span>
                <ChevronRight size={16} />
              </button>
              <button
                className="public-mobile-cta"
                onClick={() => {
                  go('register');
                  setMobileOpen(false);
                }}
              >
                Empieza gratis <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function AppSidebar({
  active,
  go,
  user
}: {
  active: 'dashboard' | 'learning' | 'plans' | 'payments' | 'profile' | 'admin' | 'admin-users' | 'admin-transactions';
  go: (page: string) => void;
  user?: any;
}) {
  const [open, setOpen] = useState(false);
  const admin = active.startsWith('admin');
  const isGuardian = user?.rol === 'GUARDIAN';

  const item = (id: string, label: string, Icon: any) => (
    <button
      className={active === id ? 'nav-item active' : 'nav-item'}
      onClick={() => {
        go(id);
        setOpen(false);
      }}
    >
      <Icon size={19} />
      <span>{label}</span>
    </button>
  );

  const logout = () => {
    localStorage.clear();
    sessionStorage.removeItem('pendingPlan');
    window.location.hash = '/';
    window.location.reload();
  };

  return (
    <>
      <SystemHeader user={user} section={admin ? 'Administración' : isGuardian ? 'Portal Apoderado' : 'Mi preparación'} />
      <button
        className={'hamburger ' + (open ? 'is-open' : '')}
        aria-label="Abrir menú"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={21} />
      </button>
      {open && <button className="nav-backdrop" aria-label="Cerrar menú" onClick={() => setOpen(false)} />}
      <aside className={'app-sidebar ' + (open ? 'open' : '')}>
        <div className="brand-row">
          <Logo />
          <button className="menu-close" aria-label="Cerrar menú" onClick={() => setOpen(false)}>
            <X size={21} />
          </button>
        </div>
        <p className="nav-caption">{admin ? 'GESTIÓN' : isGuardian ? 'APODERADO' : 'MI ESPACIO'}</p>
        <div className="nav-items">
          {admin ? (
            <>
              {item('admin', 'Vista general', LayoutDashboard)}
              {item('admin-users', 'Usuarios', UserRound)}
              {item('admin-transactions', 'Transacciones', CreditCard)}
            </>
          ) : isGuardian ? (
            <>
              {item('dashboard', 'Estudiantes', LayoutDashboard)}
              {item('payments', 'Mis pagos', CreditCard)}
              {item('profile', 'Mi perfil', UserRound)}
            </>
          ) : (
            <>
              {item('dashboard', 'Resumen', LayoutDashboard)}
              {item('learning', 'Mi aula', BookOpen)}
              {item('plans', 'Planes y servicios', Target)}
              {item('payments', 'Mis pagos', CreditCard)}
              {item('profile', 'Mi perfil', UserRound)}
            </>
          )}
        </div>
        <div className="sidebar-foot">
          <div className="help-chip">
            <Sparkles size={16} />
            <span>Tu meta UNT empieza hoy</span>
          </div>
          <button className="logout" onClick={logout}>
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function Landing({ go }: { go: (s: string) => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  useEffect(() => {
    api('/plans')
      .then(setPlans)
      .catch(() => {});
  }, []);

  const highlights = [
    [Target, 'Diagnóstico que te ubica', 'Empieza entendiendo qué reforzar y por dónde avanzar.'],
    [BookOpen, 'Una ruta que sí se sigue', 'Sesiones, práctica y objetivos organizados para tu semana.'],
    [TrendingUp, 'Avance que puedes ver', 'Cada actividad terminada convierte tu esfuerzo en claridad.']
  ];

  return (
    <div className="landing-page">
      <Header go={go} />
      <main>
        <section className="premium-hero">
          <div className="premium-hero-copy">
            <div className="eyebrow">
              <Sparkles size={15} /> PREPARACIÓN UNT, CON PROPÓSITO
            </div>
            <h1>
              No estudies más.
              <br />
              <em>Prepárate mejor.</em>
            </h1>
            <p>
              Una experiencia de preparación que transforma tu meta universitaria en una ruta clara, práctica y hecha para tu ritmo.
            </p>
            <div className="actions">
              <button onClick={() => go('register')}>
                Comenzar mi diagnóstico <ArrowRight size={18} />
              </button>
              <button className="ghost" onClick={() => go('plans')}>
                Explorar planes
              </button>
            </div>
            <div className="hero-assurance">
              <span>
                <Check size={15} /> Diagnóstico inicial
              </span>
              <span>
                <Check size={15} /> Sin tarjeta para empezar
              </span>
            </div>
          </div>
          <div className="hero-stage">
            <div className="hero-stage-glow"></div>
            <div className="study-window">
              <div className="study-top">
                <span>MI RUTA DE HOY</span>
                <b>Miércoles · 7:00 PM</b>
              </div>
              <div className="study-subject">
                <div className="subject-icon">
                  <BookOpen size={22} />
                </div>
                <div>
                  <small>RAZONAMIENTO MATEMÁTICO</small>
                  <strong>Patrones y sucesiones</strong>
                  <p>Sesión 04 · 35 min · Nivel intermedio</p>
                </div>
              </div>
              <div className="study-progress">
                <div>
                  <span>Progreso del módulo</span>
                  <b>68%</b>
                </div>
                <i>
                  <i />
                </i>
                <small>4 de 6 objetivos completados</small>
              </div>
              <button onClick={() => go('register')}>
                Continuar mi ruta <ArrowRight size={16} />
              </button>
            </div>
            <div className="stage-score">
              <span>AVANCE SEMANAL</span>
              <b>+12%</b>
              <small>sobre tu objetivo</small>
            </div>
            <div className="stage-chip">
              <Check size={16} />
              <span>Actividad completada</span>
            </div>
          </div>
        </section>
        <section className="trust-strip">
          <div>
            <b>+4,800</b>
            <span>estudiantes creando su ruta</span>
          </div>
          <div>
            <b>4 etapas</b>
            <span>para avanzar con foco</span>
          </div>
          <div>
            <b>1 objetivo</b>
            <span>llegar preparado a la UNT</span>
          </div>
          <button onClick={() => go('plans')}>
            Conoce cómo funciona <ArrowRight size={16} />
          </button>
        </section>
        <section id="beneficios" className="premium-benefits">
          <div className="section-heading">
            <p className="label">UNA EXPERIENCIA QUE TE ACOMPAÑA</p>
            <h2>
              Todo lo que necesitas
              <br />
              para sentirte <em>capaz.</em>
            </h2>
            <p>No se trata de acumular horas: se trata de saber qué estudiar, practicar con intención y ver tu avance.</p>
          </div>
          <div className="premium-feature-grid">
            {highlights.map(([I, t, d]: any, i) => (
              <article key={t}>
                <div className="feature-number">0{i + 1}</div>
                <I size={25} />
                <h3>{t}</h3>
                <p>{d}</p>
                <a onClick={() => go('register')}>
                  Descubrir la experiencia <ArrowRight size={15} />
                </a>
              </article>
            ))}
          </div>
        </section>
        <section className="program-proof">
          <div className="proof-copy">
            <p className="label">TU SEMANA, BIEN ORGANIZADA</p>
            <h2>
              Un aula que convierte
              <br />
              la intención en <em>avance.</em>
            </h2>
            <p>Encuentra lo que toca hoy, resuelve ejercicios, realiza simulacros y entiende en qué debes enfocarte después.</p>
            <ul>
              <li>
                <Check size={17} /> Sesiones con tiempo, tema y nivel claros.
              </li>
              <li>
                <Check size={17} /> Ejercicios para practicar al terminar.
              </li>
              <li>
                <Check size={17} /> Simulacros para medir tu preparación.
              </li>
            </ul>
            <button onClick={() => go('register')}>
              Quiero construir mi ruta <ArrowRight size={17} />
            </button>
          </div>
          <div className="proof-dashboard">
            <div className="proof-dashboard-top">
              <span>MI AULA</span>
              <b>Hola, estudiante</b>
              <i>Meta UNT</i>
            </div>
            <div className="proof-progress-card">
              <p>OBJETIVO DE LA SEMANA</p>
              <strong>
                6.5 <small>horas</small>
              </strong>
              <div>
                <i style={{ width: '72%' }}></i>
              </div>
              <span>72% completado · vas muy bien</span>
            </div>
            <div className="proof-next-card">
              <span>PRÓXIMA ACTIVIDAD</span>
              <h3>Razonamiento verbal</h3>
              <p>Comprensión lectora · 25 min</p>
              <button onClick={() => go('register')}>
                Empezar <Play size={14} />
              </button>
            </div>
          </div>
        </section>
        <section className="how premium-how">
          <div>
            <p className="label">ASÍ EMPIEZA TU RUTA</p>
            <h2>
              Menos incertidumbre.
              <br />
              <em>Más dirección.</em>
            </h2>
            <p>En pocos pasos conviertes tus objetivos en un plan de estudio accionable.</p>
          </div>
          <ol>
            <li>
              <b>01</b>
              <div>
                <strong>Crea tu cuenta</strong>
                <span>Empieza con tus datos básicos.</span>
              </div>
            </li>
            <li>
              <b>02</b>
              <div>
                <strong>Conoce tu punto de partida</strong>
                <span>Explora tu diagnóstico inicial.</span>
              </div>
            </li>
            <li>
              <b>03</b>
              <div>
                <strong>Elige el impulso correcto</strong>
                <span>Selecciona el plan que acompaña tu meta.</span>
              </div>
            </li>
            <li>
              <b>04</b>
              <div>
                <strong>Estudia con foco</strong>
                <span>Tu aula te dice qué hacer hoy.</span>
              </div>
            </li>
          </ol>
        </section>
        <section className="premium-plans">
          <div className="section-heading">
            <p className="label">PLANES PARA CADA MOMENTO</p>
            <h2>
              Tu meta merece una
              <br />
              ruta a su <em>altura.</em>
            </h2>
            <p>Comienza con una prueba y elige el acompañamiento que necesitas para sostener tu preparación.</p>
          </div>
          <div className="premium-plan-grid">
            {plans.map((p, i) => (
              <article className={p.nombre === 'Meta UNT' ? 'featured' : ''} key={p.id}>
                {p.nombre === 'Meta UNT' && <span className="plan-badge">MÁS ELEGIDO</span>}
                <p className="plan-kicker">{i === 0 ? 'PARA EMPEZAR' : i === 1 ? 'PARA AVANZAR' : 'PARA IR MÁS LEJOS'}</p>
                <h3>{p.nombre}</h3>
                <p className="plan-description">{p.descripcion}</p>
                <strong>
                  {p.diasPrueba ? 'Gratis' : money(p.precioMensual)}
                  {!p.diasPrueba && <small>/ mes</small>}
                </strong>
                <ul>
                  {benefitsFor(p.nombre).map(item => (
                    <li key={item}>
                      <Check size={16} />
                      {item}
                    </li>
                  ))}
                </ul>
                <button onClick={() => go('plans')}>
                  {p.diasPrueba ? 'Activar prueba' : 'Ver este plan'} <ArrowRight size={15} />
                </button>
              </article>
            ))}
          </div>
          <button className="plans-link" onClick={() => go('plans')}>
            Comparar todos los beneficios <ArrowRight size={16} />
          </button>
        </section>
        <section className="final-cta">
          <div>
            <p className="label">TU PRÓXIMO PASO EMPIEZA AQUÍ</p>
            <h2>
              La UNT no es solo una meta.
              <br />
              <em>Es tu siguiente etapa.</em>
            </h2>
            <p>Empieza hoy con una experiencia que te guía, te reta y te muestra cuánto estás avanzando.</p>
          </div>
          <button onClick={() => go('register')}>
            Crear mi cuenta gratis <ArrowRight size={18} />
          </button>
        </section>
      </main>
      <footer>
        <Logo />
        <span>© 2026 La PRE Digital · Trujillo, Perú</span>
      </footer>
    </div>
  );
}

function Auth({ mode, done }: { mode: 'login' | 'register'; done: (u: any) => void }) {
  const [err, setErr] = useState('');

  const submit = async (e: any) => {
    e.preventDefault();
    const f = new FormData(e.target);
    if (mode === 'register' && f.get('password') !== f.get('confirm')) return setErr('Las contraseñas no coinciden');
    try {
      const body = Object.fromEntries(f);
      const d = await api('/auth/' + (mode === 'login' ? 'login' : 'register'), 'POST', body);
      localStorage.token = d.token;
      // If backend already returned full formatted user in d.user, pass it; else call /auth/me
      const userProfile = d.user?.studentProfile ? d.user : await api('/auth/me');
      done(userProfile);
    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <div className="auth">
      <Logo />
      <div className="auth-copy">
        <span className="eyebrow">LA PRE DIGITAL</span>
        <h1>{mode === 'login' ? 'Qué bueno verte de nuevo.' : 'Todo comienza con una decisión.'}</h1>
        <p>Tu preparación para la UNT empieza aquí.</p>
      </div>
      <form onSubmit={submit}>
        <h2>{mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}</h2>
        {mode === 'register' && (
          <div className="split">
            <input name="nombres" placeholder="Nombres" required />
            <input name="apellidos" placeholder="Apellidos" required />
          </div>
        )}
        <input name="email" type="email" placeholder="Correo electrónico" required />
        {mode === 'register' && (
          <>
            <input name="telefono" placeholder="Teléfono" />
            <input name="carreraInteres" placeholder="Carrera de interés" />
            <select name="rol">
              <option value="STUDENT">Soy estudiante</option>
              <option value="GUARDIAN">Soy apoderado</option>
            </select>
          </>
        )}
        <input name="password" type="password" placeholder="Contraseña (mínimo 6 caracteres)" required />
        {mode === 'register' && <input name="confirm" type="password" placeholder="Confirma tu contraseña" required />}
        {err && <p className="error">{err}</p>}
        <button>
          {mode === 'login' ? 'Entrar a mi preparación' : 'Crear mi cuenta'} <ArrowRight size={17} />
        </button>
        <p className="switch">
          {mode === 'login' ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'}{' '}
          <a href={mode === 'login' ? '#/register' : '#/login'}>{mode === 'login' ? 'Regístrate' : 'Inicia sesión'}</a>
        </p>
      </form>
    </div>
  );
}

function Plans({
  select,
  user,
  go
}: {
  select: (p: Plan, semestral: boolean) => void;
  user?: any;
  go: (page: string) => void;
}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [semi, setSemi] = useState(false);
  const subscription = getActiveSubscription(user);

  useEffect(() => {
    api('/plans').then(setPlans).catch(() => {});
  }, []);

  const planRanks: Record<string, number> = {
    'Explora UNT': 1,
    'Ruta UNT': 2,
    'Meta UNT': 3,
    'Meta UNT Plus': 4
  };
  const currentRank = subscription?.plan?.nombre ? planRanks[subscription.plan.nombre] || 0 : 0;

  const catalogContent = (
    <section className="plans-catalog-section premium-plan-selection">
      <div className="plans-catalog-header premium-plan-header">
        <div className="premium-plan-heading">
          <span className="plans-badge-pill">
            {subscription ? 'MEJORA DE SUSCRIPCIÓN' : 'PLANES PREUNIVERSITARIOS'}
          </span>
          <h2>
            {subscription
              ? 'Haz que tu preparación llegue más lejos.'
              : <>Elige el impulso que<br /><em>sostiene tu meta.</em></>}
          </h2>
          <p>
            {subscription
              ? 'Compara lo que desbloquea cada nivel y elige el acompañamiento que necesitas ahora.'
              : 'Todos los planes están pensados para que estudies con dirección, avances con evidencia y llegues a la UNT con mayor seguridad.'}
          </p>
        </div>
        <div className="billing-control">
          <span>ELIGE TU FORMA DE PAGO</span>
          <div className="toggle">
            <button className={!semi ? 'active' : ''} onClick={() => setSemi(false)}>
              Mensual
            </button>
            <button className={semi ? 'active' : ''} onClick={() => setSemi(true)}>
              6 meses <b>Ahorra hasta 16%</b>
            </button>
          </div>
        </div>
      </div>

      <div className="plan-selection-note">
        <Sparkles size={17} />
        <span>Tu plan define el nivel de personalización y los servicios que se habilitan en tu aula.</span>
      </div>

      <div className="plans-grid premium-plans-grid">
        {plans.map((p, i) => {
          const actualSemi = semi && !!p.precioSemestral;
          const price = actualSemi ? p.precioSemestral! : p.precioMensual;
          const isCurrent = subscription && (subscription.planId === p.id || subscription.plan?.nombre === p.nombre);
          const thisRank = planRanks[p.nombre] || 0;
          const isUpgrade = subscription && thisRank > currentRank;
          const stage = ['PARA CONOCER TU PUNTO DE PARTIDA', 'PARA CONSTRUIR HÁBITO', 'PARA UNA RUTA PERSONALIZADA', 'PARA AVANZAR CON TU FAMILIA'][i] || 'PREPARACIÓN UNT';

          return (
            <article
              className={`premium-plan-card ${p.nombre === 'Meta UNT' && !isCurrent ? 'recommended' : ''} ${
                isCurrent ? 'current-plan-card' : ''
              }`}
              key={p.id}
            >
              {p.nombre === 'Meta UNT' && !isCurrent && <span className="tag">RECOMENDADO</span>}
              {p.nombre === 'Meta UNT Plus' && !isCurrent && <span className="tag tag-plus">MÁXIMA COBERTURA</span>}
              {isCurrent && <span className="tag tag-current">TU PLAN ACTUAL</span>}
              <span className="plan-stage">{stage}</span>
              <h2>{p.nombre}</h2>
              <p className="plan-summary">{p.descripcion}</p>
              <div className="plan-price-block">
                <strong>
                  {money(price)}
                  {price > 0 && <small>{actualSemi ? '/ 6 meses' : '/ mes'}</small>}
                </strong>
                <span>{p.diasPrueba ? `${p.diasPrueba} días para explorar sin costo` : actualSemi ? 'Pago único por seis meses' : 'Facturación mensual'}</span>
              </div>
              <div className="plan-divider" />
              <p className="plan-includes">INCLUYE</p>
              <ul className="plan-benefits">
                {benefitsFor(p.nombre).map(x => (
                  <li key={x}>
                    <Check size={16} />
                    {x}
                  </li>
                ))}
              </ul>
              <p className="plan-cta-hint">{isCurrent ? 'Estás disfrutando este nivel de acceso.' : p.diasPrueba ? 'Conoce la plataforma antes de decidir.' : 'Activa tu acceso y empieza tu ruta.'}</p>
              {isCurrent ? (
                <button disabled className="btn-plan-active">
                  <CheckCircle2 size={16} /> Plan en uso
                </button>
              ) : (
                <button
                  className={isUpgrade ? 'btn-plan-upgrade' : ''}
                  onClick={() => select(p, actualSemi)}
                >
                  {p.diasPrueba
                    ? 'Activar prueba gratis'
                    : isUpgrade
                    ? 'Mejorar a este plan'
                    : 'Elegir este plan'}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );

  if (user) {
    return (
      <div className="dash">
        <AppSidebar active="plans" go={go} user={user} />
        <main className="plans-page-main">
          {subscription && (
            <section className="service-hero" style={{ marginBottom: 36 }}>
              <p className="label">MI SERVICIO ACTIVO</p>
              <div>
                <div>
                  <h1>{subscription.plan.nombre}</h1>
                  <p>{subscription.plan.descripcion}</p>
                  <span className="service-status">✓ Acceso activo</span>
                </div>
                <div className="service-date">
                  <small>Válido hasta</small>
                  <b>
                    {new Date(subscription.fechaFin).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </b>
                </div>
              </div>
              <div className="service-benefits">
                {benefitsFor(subscription.plan.nombre).map(item => (
                  <span key={item}>
                    <Check size={18} />
                    {item}
                  </span>
                ))}
              </div>
              <button onClick={() => go('learning')}>
                Entrar a mi aula <ArrowRight size={17} />
              </button>
            </section>
          )}

          {catalogContent}
        </main>
      </div>
    );
  }

  return (
    <>
      <Header go={go} />
      {catalogContent}
    </>
  );
}

function Onboarding({ user, onDone }: { user: any; onDone: (user: any) => void }) {
  const sub = getActiveSubscription(user);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const eligible = sub?.plan?.nombre === 'Meta UNT' || sub?.plan?.nombre === 'Meta UNT Plus';
  if (!eligible || sub?.estadoOnboarding === 'COMPLETADO') return null;

  const submit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      const form = new FormData(e.target);
      await api('/onboarding/complete', 'POST', {
        carreraInteres: form.get('carreraInteres'),
        areaRefuerzo: form.get('areaRefuerzo'),
        nivelEducativo: form.get('nivelEducativo'),
        fechaExamen: new Date(String(form.get('fechaExamen'))).toISOString(),
        horasSemanales: Number(form.get('horasSemanales'))
      });
      onDone(await api('/auth/me'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onboarding-layer">
      <form className="onboarding-card" onSubmit={submit}>
        <div className="onboarding-badge">
          <Sparkles size={21} />
        </div>
        <p className="label">PERSONALIZACIÓN META UNT</p>
        <h1>
          Construyamos tu
          <br />
          <em>ruta ideal.</em>
        </h1>
        <p>Antes de empezar, cuéntanos un poco más. Ajustaremos recomendaciones, simulacros y prioridades a tu meta.</p>
        <div className="onboarding-grid">
          <label>
            Carrera objetivo
            <input
              name="carreraInteres"
              defaultValue={user.studentProfile?.carreraInteres || ''}
              placeholder="Ej. Medicina"
              required
            />
          </label>
          <label>
            Área a reforzar
            <select name="areaRefuerzo" defaultValue={user.studentProfile?.areaRefuerzo || 'Razonamiento matemático'}>
              <option>Razonamiento matemático</option>
              <option>Razonamiento verbal</option>
              <option>Ciencias</option>
              <option>Matemática</option>
            </select>
          </label>
          <label>
            Nivel actual
            <select name="nivelEducativo" defaultValue={user.studentProfile?.nivelEducativo || '5to de secundaria'}>
              <option>5to de secundaria</option>
              <option>Egresado</option>
              <option>Repaso intensivo</option>
            </select>
          </label>
          <label>
            Fecha estimada del examen
            <input name="fechaExamen" type="date" required />
          </label>
          <label>
            Horas disponibles por semana
            <select name="horasSemanales" defaultValue="8">
              <option value="4">4 horas</option>
              <option value="8">8 horas</option>
              <option value="12">12 horas</option>
              <option value="16">16 horas</option>
            </select>
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <button disabled={saving}>
          {saving ? 'Creando tu ruta...' : 'Crear mi ruta personalizada'} <ArrowRight size={17} />
        </button>
      </form>
    </div>
  );
}

function Dashboard({ user, go }: { user: any; go: (x: string) => void }) {
  const [trial, setTrial] = useState(false);
  const subscription = getActiveSubscription(user);
  const active = trial || subscription?.estadoAcceso === 'ACTIVADO';
  const planName = active ? subscription?.plan?.nombre || 'Explora UNT' : 'Sin plan activo';
  const carrera = user.studentProfile?.carreraInteres || 'UNT General';

  const activate = async () => {
    try {
      await api('/trials/activate', 'POST');
      setTrial(true);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="dash">
      <AppSidebar active="dashboard" go={go} />
      <main>
        {/* Banner de Bienvenida y Metas */}
        <section className="dash-student-hero">
          <div className="dash-student-greetings">
            <span className="student-eyebrow">
              <Sparkles size={15} /> POSTULANTE UNT · {user.etapaComercial || 'ASPIRANTE'}
            </span>
            <h1>
              Hola, {user.nombres}. <em>Vamos por esa vacante.</em>
            </h1>
            <p>
              Tu preparación estructurada para ingresar a la UNT. Hoy tienes una sesión estratégica de Razonamiento
              Matemático programada.
            </p>
            <div className="student-badges-row">
              <span className="student-target-badge">
                <Target size={14} /> Meta UNT: {carrera}
              </span>
              <span className="student-streak-badge">
                <Flame size={14} /> 4 días seguidos de racha
              </span>
            </div>
          </div>

          <div className="student-countdown-card">
            <span className="countdown-label">Tiempo para Admisión</span>
            <div className="countdown-num">48</div>
            <span className="countdown-sub">DÍAS RESTANTES UNT</span>
          </div>
        </section>

        {/* Rejilla de Módulos de Estudio */}
        <div className="dash-grid-v2">
          {/* Tarjeta de Ruta Actual y Credencial */}
          <section className="route-credential-card">
            <div className="credential-info">
              <div className="credential-kicker">
                <span className="kicker-text">RUTA DE PREPARACIÓN</span>
                {active ? (
                  <span className="credential-badge">
                    <CheckCircle2 size={13} /> ACCESO ACTIVO
                  </span>
                ) : (
                  <span className="credential-badge" style={{ background: '#f59e0b', color: '#0b1f38' }}>
                    PENDIENTE DE ACTIVACIÓN
                  </span>
                )}
              </div>
              <h2>{planName}</h2>
              <p>
                {active
                  ? subscription?.plan?.descripcion ||
                    'Materiales oficiales, simulacros cronometrados y ruta adaptativa guiada por IA para la UNT.'
                  : 'Desbloquea tu ruta de estudio completa con simulacros y asesoría continua.'}
              </p>
              {active && (
                <div className="credential-benefits-row">
                  {benefitsFor(planName).slice(0, 3).map(b => (
                    <span key={b}>
                      <Check size={15} /> {b}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="credential-action-side">
              {active ? (
                <>
                  <div className="credential-validity">
                    <span>Válido hasta</span>
                    <b>
                      {subscription?.fechaFin
                        ? new Date(subscription.fechaFin).toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'Acceso continuo'}
                    </b>
                  </div>
                  <button className="btn-enter-aula" onClick={() => go('learning')}>
                    Entrar a mi aula <ArrowRight size={17} />
                  </button>
                </>
              ) : (
                <button className="btn-enter-aula" onClick={activate}>
                  Activar 14 días gratis <Sparkles size={17} />
                </button>
              )}
            </div>
          </section>

          {/* Próxima Actividad con Payoff */}
          <section className="dash-next-card">
            <div>
              <div className="dash-next-top">
                <span className="top-label">PRÓXIMA ACTIVIDAD CLAVE</span>
                <span className="schedule-pill">HOY · 7:00 PM</span>
              </div>
              <div className="dash-next-body">
                <span className="subject-tag">RAZONAMIENTO MATEMÁTICO</span>
                <h2>Patrones y sucesiones numéricas</h2>
                <p>Sesión guiada · Deducción de términos enésimos y progresiones frecuentes en exámenes UNT.</p>

                <div className="dash-payoff-badge">
                  <Award size={20} color="#15803d" />
                  <div>
                    <b>+25 pts en Simulación UNT</b>
                    <span style={{ display: 'block', fontSize: '11.5px', color: '#166534' }}>
                      Refuerzo de 4 tipos clásicos de preguntas de admisión
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="dash-next-footer">
              <div className="dash-next-specs">
                <span>
                  <Clock size={14} /> 35 min
                </span>
                <span>
                  <TrendingUp size={14} /> Intermedio
                </span>
              </div>
              <button className="btn-enter-aula" style={{ padding: '10px 18px', fontSize: '13px' }} onClick={() => go('learning')}>
                Comenzar ahora <ArrowRight size={15} />
              </button>
            </div>
          </section>

          {/* Rendimiento Semanal y Gráfico de Barras */}
          <section className="dash-stats-card">
            <div className="dash-stats-top">
              <h3>Rendimiento Semanal</h3>
              <span>+12% vs. meta</span>
            </div>

            <div className="dash-stats-kpis-grid">
              <div className="dash-mini-kpi">
                <span>AVANCE RUTA</span>
                <strong>68%</strong>
              </div>
              <div className="dash-mini-kpi">
                <span>HORAS TOTALES</span>
                <strong>6.5 h</strong>
              </div>
              <div className="dash-mini-kpi">
                <span>TAREAS LISTAS</span>
                <strong>12</strong>
              </div>
            </div>

            <div className="dash-bar-chart-container">
              <span className="chart-caption">Horas dedicadas por día esta semana</span>
              <div className="dash-weekly-bars">
                <div className="bar-day-col active">
                  <div className="bar-day-pillar" style={{ height: '45px' }} title="1.2 horas"></div>
                  <span>Lun</span>
                </div>
                <div className="bar-day-col active">
                  <div className="bar-day-pillar" style={{ height: '60px' }} title="1.6 horas"></div>
                  <span>Mar</span>
                </div>
                <div className="bar-day-col today">
                  <div className="bar-day-pillar" style={{ height: '75px' }} title="2.0 horas hoy"></div>
                  <span>Mié</span>
                </div>
                <div className="bar-day-col">
                  <div className="bar-day-pillar" style={{ height: '10px' }}></div>
                  <span>Jue</span>
                </div>
                <div className="bar-day-col">
                  <div className="bar-day-pillar" style={{ height: '10px' }}></div>
                  <span>Vie</span>
                </div>
                <div className="bar-day-col">
                  <div className="bar-day-pillar" style={{ height: '10px' }}></div>
                  <span>Sáb</span>
                </div>
                <div className="bar-day-col">
                  <div className="bar-day-pillar" style={{ height: '10px' }}></div>
                  <span>Dom</span>
                </div>
              </div>
            </div>
          </section>

          {/* Camino de Preparación UNT */}
          <section className="dash-path-card">
            <h3>Tu Trayectoria de Ingreso</h3>
            <div className="path-stepper-grid">
              <div className="path-step-card done">
                <div className="path-step-icon">✓</div>
                <div className="path-step-text">
                  <strong>01. Diagnóstico Inicial</strong>
                  <span>Completado · Nivel intermedio detectado</span>
                </div>
              </div>

              <div className="path-step-card active">
                <div className="path-step-icon">2</div>
                <div className="path-step-text">
                  <strong>02. Fundamentos y Práctica</strong>
                  <span>En curso · Módulo 4 de 8 en progreso</span>
                </div>
              </div>

              <div className="path-step-card">
                <div className="path-step-icon">3</div>
                <div className="path-step-text">
                  <strong>03. Simulacro General UNT</strong>
                  <span>Programado · Sábado 9:00 AM (Área {carrera ? 'A' : 'General'})</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Checkout({
  plan,
  user,
  semestral,
  done
}: {
  plan: Plan;
  user: any;
  semestral: boolean;
  done: () => void;
}) {
  const [channel, setChannel] = useState('CARD');
  const [modal, setModal] = useState(false);
  const [msg, setMsg] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const [linkedStudents, setLinkedStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState('');
  const amount = semestral && plan.precioSemestral ? plan.precioSemestral : plan.precioMensual;

  useEffect(() => {
    if (new URLSearchParams(location.hash.split('?')[1] || '').get('stripe') === 'cancelled') {
      setMsg('El pago con Stripe fue cancelado. Tu acceso todavía no cambió.');
    }
  }, []);

  useEffect(() => {
    if (user.rol === 'GUARDIAN') {
      api('/guardians/students')
        .then(result => {
          const students = result.students || [];
          setLinkedStudents(students);
          setStudentId(students[0]?.id || '');
        })
        .catch(error => setMsg(error.message));
    }
  }, [user.rol]);

  const pay = async (e: any) => {
    e.preventDefault();
    setMsg('');
    try {
      if (channel === 'CARD') {
        if (user.rol === 'GUARDIAN' && !studentId) throw Error('Primero vincula al estudiante que recibirá el plan.');
        setRedirecting(true);
        const session = await api('/payments/stripe/checkout-session', 'POST', {
          planId: plan.id,
          modalidad: semestral ? 'semestral' : 'mensual',
          ...(studentId ? { studentId } : {})
        });
        window.location.assign(session.url);
        return;
      }
      if (channel === 'YAPE' && String(new FormData(e.target).get('code')).length !== 6)
        throw Error('Ingresa el código Yape de 6 dígitos');
      const p = await api('/payments/create', 'POST', {
        planId: plan.id,
        canalPago: channel,
        monto: amount,
        recurrencia: true,
        ...(studentId ? { studentId } : {})
      });
      await api('/payments/' + p.id + '/confirm', 'POST', {
        modalidad: semestral ? 'semestral' : 'mensual',
        ...(studentId ? { studentId } : {})
      });
      setModal(true);
    } catch (e: any) {
      setMsg(e.message);
      setRedirecting(false);
    }
  };

  return (
    <>
      <Header go={() => {}} />
      <div className="checkout">
        <section>
          <p className="label">FINALIZA TU INSCRIPCIÓN</p>
          <h1>
            Estás a un paso
            <br />
            de tu <em>meta.</em>
          </h1>
          <div className="summary">
            <span>PLAN ELEGIDO · {semestral ? 'SEMESTRAL' : 'MENSUAL'}</span>
            <h2>{plan.nombre}</h2>
            <p>
              Para {user.nombres} {user.apellidos}
            </p>
            <strong>
              {money(amount)}
              <small>{semestral ? '/ 6 meses' : '/mes'}</small>
            </strong>
          </div>
        </section>
        <form onSubmit={pay}>
          <div className="channels">
            {[
              ['CARD', 'Tarjeta'],
              ['YAPE', 'Yape'],
              ['PLIN', 'Plin']
            ].map(x => (
              <button
                type="button"
                key={x[0]}
                className={channel === x[0] ? 'selected' : ''}
                onClick={() => setChannel(x[0])}
              >
                {x[1]}
              </button>
            ))}
          </div>
          {user.rol === 'GUARDIAN' && (
            <label className="checkout-student-select">
              Estudiante que recibirá el acceso
              <select value={studentId} onChange={event => setStudentId(event.target.value)} required>
                <option value="">Selecciona un estudiante vinculado</option>
                {linkedStudents.map(student => (
                  <option key={student.id} value={student.id}>{student.nombres} {student.apellidos}</option>
                ))}
              </select>
              {!linkedStudents.length && <small>Vincula un estudiante desde el Portal del apoderado antes de pagar.</small>}
            </label>
          )}
          {channel === 'CARD' && (
            <div className="stripe-demo-panel">
              <div className="stripe-demo-brand">
                <span>S</span>
                <div>
                  <b>Checkout seguro de Stripe</b>
                  <p>Serás redirigido para completar el pago.</p>
                </div>
                <small>MODO PRUEBA</small>
              </div>
              <div className="stripe-test-card">
                <span>Tarjeta de prueba</span>
                <strong>4242 4242 4242 4242</strong>
                <p>Usa cualquier fecha futura y cualquier CVC.</p>
              </div>
            </div>
          )}
          {channel === 'YAPE' && (
            <div className="pay-info">
              <b>Yapea al 987 654 321</b>
              <p>La PRE Digital · Demo</p>
              <input name="code" placeholder="Código de aprobación (6 dígitos)" required />
            </div>
          )}
          {channel === 'PLIN' && (
            <div className="pay-info">
              <div className="qr">▦</div>
              <b>Escanea el QR de demostración</b>
              <input name="code" placeholder="Código de operación" required />
            </div>
          )}
          <label className="check">
            <input type="checkbox" defaultChecked />{' '}
            {channel === 'CARD' ? 'Acepto continuar con el pago de prueba procesado por Stripe' : 'Autorizo pagos recurrentes para futuras renovaciones'}
          </label>
          {msg && <p className="error">{msg}</p>}
          <button disabled={redirecting}>
            <ShieldCheck size={18} /> {redirecting ? 'Redirigiendo a Stripe...' : channel === 'CARD' ? `Pagar con Stripe · ${money(amount)}` : `Pagar ahora · ${money(amount)}`}
          </button>
          <small className="secure">{channel === 'CARD' ? 'Stripe en modo prueba · No se realizará un cobro real' : 'Pago simulado · Tus datos no se almacenan'}</small>
        </form>
      </div>
      {modal && (
        <div className="modal">
          <div>
            <span>✓</span>
            <p className="label">PAGO CONFIRMADO</p>
            <h1>
              Ya estás en
              <br />
              <em>camino.</em>
            </h1>
            <p>Tu acceso a {plan.nombre} está activo.</p>
            <button onClick={done}>
              Ir a mi preparación <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function StripeSuccess({ go, done }: { go: (page: string) => void; done: () => void }) {
  const [state, setState] = useState<'loading' | 'success' | 'pending' | 'error'>('loading');
  const [message, setMessage] = useState('Estamos verificando tu pago seguro con Stripe.');
  const [planName, setPlanName] = useState('tu plan');

  useEffect(() => {
    const sessionId = new URLSearchParams(location.hash.split('?')[1] || '').get('session_id');
    if (!sessionId) {
      setState('error');
      setMessage('No encontramos una sesión de pago para validar.');
      return;
    }
    api('/payments/stripe/session/' + encodeURIComponent(sessionId))
      .then(result => {
        if (result.paid) {
          setPlanName(result.payment?.plan?.nombre || 'tu plan');
          setState('success');
          setMessage('Tu pago de prueba fue confirmado y ya activamos tu acceso.');
        } else {
          setState('pending');
          setMessage('Stripe todavía no confirma el pago. Espera unos segundos y vuelve a intentarlo.');
        }
      })
      .catch(error => {
        setState('error');
        setMessage(error.message || 'No pudimos validar el pago.');
      });
  }, []);

  return (
    <>
      <Header go={go} />
      <main className="stripe-return-page">
        <section className={`stripe-return-card ${state}`}>
          <div className="stripe-return-icon">{state === 'loading' ? '…' : state === 'success' ? '✓' : state === 'pending' ? '!' : '×'}</div>
          <p className="label">PAGO SEGURO · STRIPE</p>
          <h1>{state === 'success' ? <>Tu acceso está <em>listo.</em></> : state === 'loading' ? <>Verificando tu <em>pago.</em></> : <>Revisemos tu <em>pago.</em></>}</h1>
          <p>{message}</p>
          {state === 'success' && <div className="stripe-plan-confirmed">Acceso activado: <b>{planName}</b></div>}
          <div className="stripe-return-actions">
            {state === 'success' && <button onClick={done}>Ir a mi preparación <ArrowRight size={17} /></button>}
            {state === 'pending' && <button onClick={() => location.reload()}>Verificar otra vez</button>}
            {(state === 'pending' || state === 'error') && <button className="ghost-stripe" onClick={() => go('plans')}>Volver a planes</button>}
          </div>
        </section>
      </main>
    </>
  );
}

type ActivityQuestion = [string, string[], string, string?];
type ActivityType = 'lesson' | 'exercise' | 'simulation' | 'diagnostic';

const activityData: Record<ActivityType, { title: string; questions: ActivityQuestion[] }> = {
  lesson: {
    title: 'Sesión 04 · Patrones y sucesiones',
    questions: [
      ['¿Qué número continúa la serie 2, 5, 10, 17, ...?', ['24', '26', '28', '30'], '26', 'Raz. Matemático'],
      ['Si una secuencia aumenta +3, +5, +7, ¿cuál es el siguiente incremento?', ['+8', '+9', '+10', '+11'], '+9', 'Raz. Matemático']
    ]
  },
  exercise: {
    title: 'Práctica Adaptativa · Razonamiento Cuantitativo',
    questions: [
      ['Completa la serie geométrica: 4, 8, 16, 32, ...', ['48', '56', '64', '72'], '64', 'Raz. Matemático'],
      ['¿Cuál es el 5to término de la sucesión 3, 6, 12, ...?', ['18', '21', '24', '48'], '48', 'Raz. Matemático']
    ]
  },
  simulation: {
    title: 'Simulacro Oficial UNT · Área Razonamiento',
    questions: [
      ['Un postulante responde 18 de 24 preguntas correctamente. ¿Qué porcentaje de efectividad logró?', ['65%', '70%', '75%', '80%'], '75%', 'Raz. Matemático'],
      ['La razón simplificada entre 40 y 60 preguntas es:', ['1:2', '2:3', '3:4', '4:5'], '2:3', 'Raz. Matemático']
    ]
  },
  diagnostic: {
    title: 'Evaluación Diagnóstica Multidisciplinaria UNT (15 Preguntas)',
    questions: [
      // Razonamiento Matemático (1-3)
      [
        'En la sucesión: 3, 7, 13, 21, 31, ... ¿cuál es el término que ocupa la posición 10?',
        ['91', '101', '111', '121'],
        '111',
        'Raz. Matemático'
      ],
      [
        'Se define el operador matemático: a * b = 2a + 3b - 5. Calcule el valor de (4 * 2) * 3.',
        ['18', '20', '22', '25'],
        '22',
        'Raz. Matemático'
      ],
      [
        'La suma de las edades de dos hermanos es 36 años. Si el mayor excede al menor en 8 años, ¿cuál es la edad del menor?',
        ['12 años', '14 años', '16 años', '18 años'],
        '14 años',
        'Raz. Matemático'
      ],

      // Razonamiento Verbal (4-6)
      [
        'Identifique el par análogo que completa: EPÍLOGO : LIBRO ::',
        ['Prólogo : Lectura', 'Desenlace : Novela', 'Partitura : Ópera', 'Corolario : Teorema'],
        'Desenlace : Novela',
        'Raz. Verbal'
      ],
      [
        'Precisión léxica: El abogado intentó _______ los testimonios presentados por los peritos para favorecer a su defendido.',
        ['adulterar', 'tergiversar', 'estropear', 'falsear'],
        'tergiversar',
        'Raz. Verbal'
      ],
      [
        'Comprensión lectora: En un texto científico, señalar que un ecosistema exhibe "resiliencia ecológica" alude a:',
        [
          'Su total inmunidad ante cualquier perturbación externa',
          'Su capacidad de absorber perturbaciones y recuperar su estructura',
          'La ausencia de especies invasoras en su bioma',
          'El crecimiento demográfico descontrolado de sus poblaciones'
        ],
        'Su capacidad de absorber perturbaciones y recuperar su estructura',
        'Raz. Verbal'
      ],

      // Biología y Anatomía (7-9)
      [
        '¿Cuál de las siguientes biomoléculas cumple principalmente una función estructural en la pared celular vegetal?',
        ['Glucógeno', 'Celulosa', 'Almidón', 'Quitina'],
        'Celulosa',
        'Biología'
      ],
      [
        'Al cruzar dos individuos heterocigotos (Aa × Aa) para un carácter con dominancia completa, ¿cuál es la probabilidad de obtener descendencia homocigota dominante (AA)?',
        ['25% (1/4)', '50% (1/2)', '75% (3/4)', '100%'],
        '25% (1/4)',
        'Biología'
      ],
      [
        '¿Qué glándula endocrina es responsable de segregar las hormonas insulina y glucagón para regular la concentración de glucosa en sangre?',
        ['Tiroides', 'Páncreas', 'Hipófisis', 'Glándula suprarrenal'],
        'Páncreas',
        'Biología'
      ],

      // Física Preuniversitaria (10-12)
      [
        'Un móvil que parte del reposo acelera a razón constante de 4 m/s². ¿Qué distancia recorre al cabo de 5 segundos?',
        ['40 m', '50 m', '60 m', '80 m'],
        '50 m',
        'Física'
      ],
      [
        'Un bloque de 8 kg reposa sobre una superficie horizontal lisa. Si se le aplica una fuerza horizontal neta de 24 N, ¿cuál es su aceleración?',
        ['2 m/s²', '3 m/s²', '4 m/s²', '6 m/s²'],
        '3 m/s²',
        'Física'
      ],
      [
        '¿Cuál es la energía cinética de un cuerpo de 4 kg que se desplaza a una velocidad constante de 6 m/s?',
        ['36 J', '48 J', '72 J', '144 J'],
        '72 J',
        'Física'
      ],

      // Química General (13-15)
      [
        'El número atómico Z de un elemento es 17 (Cloro). ¿Cuántos electrones de valencia posee en su última capa?',
        ['5', '6', '7', '8'],
        '7',
        'Química'
      ],
      [
        '¿Qué tipo de enlace químico se produce fundamentalmente por transferencia de electrones entre un metal reactivo (Sodio, Na) y un no metal electronegativo (Cloro, Cl)?',
        ['Enlace Covalente Apolar', 'Enlace Covalente Polar', 'Enlace Iónico o Electrovalente', 'Enlace Metálico'],
        'Enlace Iónico o Electrovalente',
        'Química'
      ],
      [
        'En la combustión completa de cualquier hidrocarburo con oxígeno en exceso, los productos principales generados son:',
        ['CO y H2', 'CO2 y H2O', 'C (hollín) y H2O', 'CH4 y O2'],
        'CO2 y H2O',
        'Química'
      ]
    ]
  }
};

function Runner({
  type,
  finish,
  close
}: {
  type: ActivityType;
  finish: () => void;
  close: () => void;
}) {
  const data = activityData[type];
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState('');
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<
    Array<{ preguntaId: string; materia: string; esCorrecto: boolean; elegida: string }>
  >([]);
  const [completed, setCompleted] = useState(false);
  const [submittingDiag, setSubmittingDiag] = useState(false);
  const [diagResult, setDiagResult] = useState<any>(null);
  const q = data.questions[index];

  const next = async () => {
    if (!choice) return;
    const isCorrect = choice === q[2];
    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    const updatedAnswers = [
      ...userAnswers,
      {
        preguntaId: `d-${index + 1}`,
        materia: q[3] || 'Raz. Matemático',
        esCorrecto: isCorrect,
        elegida: choice
      }
    ];
    setUserAnswers(updatedAnswers);

    if (index === data.questions.length - 1) {
      setCompleted(true);
      finish();
      if (type === 'diagnostic') {
        setSubmittingDiag(true);
        try {
          const res = await api('/diagnostic/submit', 'POST', {
            respuestas: updatedAnswers
          });
          setDiagResult(res);
        } catch {
          // fallback graceful
        } finally {
          setSubmittingDiag(false);
        }
      }
    } else {
      setIndex(i => i + 1);
      setChoice('');
    }
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="modal">
      <div className={`runner ${type === 'diagnostic' && completed ? 'runner-diagnostic-wide' : ''}`}>
        <div className="runner-top-bar">
          <span className="runner-step-badge">
            <Sparkles size={14} />
            {type === 'simulation'
              ? 'SIMULACRO UNT'
              : type === 'exercise'
              ? 'PRÁCTICA ADAPTATIVA'
              : type === 'diagnostic'
              ? 'DIAGNÓSTICO INICIAL UNT'
              : 'SESIÓN GUIADA'}
          </span>
          <span className="runner-timer">
            <Clock size={14} /> {type === 'diagnostic' ? '15:00' : '25:00'}
          </span>
        </div>

        {/* Barra de Progreso Superior */}
        <div className="runner-progress-track">
          <div
            className="runner-progress-fill"
            style={{ width: `${Math.min(100, Math.round(((index + (completed ? 1 : 0)) / data.questions.length) * 100))}%` }}
          ></div>
        </div>

        <h2>{data.title}</h2>

        {completed ? (
          type === 'diagnostic' ? (
            <div className="diagnostic-complete-panel">
              <div className="diag-kpi-banner">
                <div className="diag-score-block">
                  <span className="diag-score-label">PUNTAJE PROYECTADO UNT</span>
                  <div className="diag-score-number">
                    {diagResult?.puntajeProyectado ?? Math.round((score / data.questions.length) * 1000)}{' '}
                    <small>/ 1000 pts</small>
                  </div>
                  <span className="diag-score-sub">{score} de {data.questions.length} respuestas correctas</span>
                </div>
                <div className="diag-level-block">
                  <span className="diag-score-label">NIVEL CALIBRADO</span>
                  <div className="diag-level-tag">
                    {diagResult?.nivelCalibrado || (score >= 12 ? 'Avanzado / Zona de Ingreso' : score >= 9 ? 'Intermedio Competitivo' : 'Básico / Refuerzo')}
                  </div>
                  <small style={{ color: '#cbd5e1' }}>Calibración basada en baremos UNT</small>
                </div>
              </div>

              {submittingDiag ? (
                <div className="materials-loading">Calibrando tu perfil en base de datos...</div>
              ) : (
                <>
                  {diagResult?.desglose && (
                    <div className="diag-areas-breakdown">
                      <h4>Desglose por Áreas Evaluadas de Admisión UNT</h4>
                      <div className="diag-areas-grid">
                        {diagResult.desglose.map((areaItem: any) => (
                          <div key={areaItem.area} className="diag-area-card">
                            <div className="diag-area-header">
                              <span className="diag-area-name">{areaItem.area}</span>
                              <strong className="diag-area-pct">{areaItem.porcentaje}%</strong>
                            </div>
                            <div className="diag-area-track">
                              <div
                                className={`diag-area-fill ${
                                  areaItem.porcentaje >= 80 ? 'green' : areaItem.porcentaje >= 60 ? 'blue' : 'amber'
                                }`}
                                style={{ width: `${areaItem.porcentaje}%` }}
                              ></div>
                            </div>
                            <small className="diag-area-detail">
                              {areaItem.aciertos} de {areaItem.total} correctas
                            </small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="diag-insights-row">
                    <div className="diag-insight-box priority">
                      <span className="insight-badge-red">PRIORIDAD DE REFUERZO</span>
                      <strong>{diagResult?.prioridadRefuerzo || 'Raz. Verbal'}</strong>
                      <p>
                        Esta área presenta la mayor oportunidad de ganancia de puntos para alcanzar el puntaje de corte de tu carrera meta.
                      </p>
                    </div>
                    <div className="diag-insight-box strength">
                      <span className="insight-badge-green">MAYOR FORTALEZA</span>
                      <strong>{diagResult?.mayorFortaleza || 'Raz. Matemático'}</strong>
                      <p>
                        Muestras solvencia y base conceptual consolidada. Mantén la velocidad para asegurar estos puntos en el examen.
                      </p>
                    </div>
                  </div>

                  <div className="diag-persisted-note">
                    <CheckCircle2 size={18} color="#10b981" />
                    <div>
                      <b>Calibración Guardada en Base de Datos</b>
                      <p>
                        Tu nivel de entrada y materia de refuerzo se han actualizado en tu perfil académico para orientar tu ruta personalizada de estudio.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="runner-result-box">
              <div className="runner-result-score">{Math.round((score / data.questions.length) * 100)}%</div>
              <h3>¡Actividad completada con éxito!</h3>
              <p>Tu avance se ha registrado en tu ruta de preparación para la UNT.</p>
            </div>
          )
        ) : (
          <>
            {q[3] && (
              <div className="runner-area-pill">
                <span>ÁREA UNT:</span> <strong>{q[3]}</strong>
              </div>
            )}

            <div className="runner-question">
              <p>{q[0]}</p>
              <div className="runner-options">
                {q[1].map((option: string, idx: number) => (
                  <button
                    key={option}
                    type="button"
                    className={`runner-option-btn ${choice === option ? 'chosen' : ''}`}
                    onClick={() => setChoice(option)}
                  >
                    <span className="option-letter">{optionLetters[idx]}</span>
                    <span className="option-text">{option}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="runner-footer">
              <small>
                Pregunta {index + 1} de {data.questions.length}
              </small>
              <button className="runner-btn-next" onClick={next}>
                {index === data.questions.length - 1 ? 'Finalizar sesión' : 'Siguiente pregunta'} <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}

        <button className="runner-btn-close" onClick={close}>
          {completed ? 'Volver a mi aula' : 'Salir de la actividad'}
        </button>
      </div>
    </div>
  );
}

const FORMULAS_DATA = [
  // Raz. Matemático
  {
    materia: 'Raz. Matemático',
    tema: 'Sucesiones y Progresiones',
    nombre: 'Término enésimo de una P.A.',
    formula: 'Tn = T1 + (n - 1) × r',
    uso: 'Para hallar cualquier término en una progresión aritmética lineal conociendo el primer término y la razón constante.'
  },
  {
    materia: 'Raz. Matemático',
    tema: 'Series y Sumatorias',
    nombre: 'Suma de términos de una P.A.',
    formula: 'S = [(T1 + Tn) / 2] × n',
    uso: 'Suma de los n términos de una progresión aritmética multiplicando el promedio de extremos por el número de términos.'
  },
  {
    materia: 'Raz. Matemático',
    tema: 'Series Notables',
    nombre: 'Suma de los n primeros enteros positivos',
    formula: 'S = [n(n + 1)] / 2',
    uso: 'Aplica para 1 + 2 + 3 + ... + n. Es una de las identidades más recurrentes en preguntas cuantitativas UNT.'
  },
  {
    materia: 'Raz. Matemático',
    tema: 'Sucesiones Geométricas',
    nombre: 'Término enésimo de una P.G.',
    formula: 'Tn = T1 × q^(n - 1)',
    uso: 'Donde q es la razón geométrica constante multiplicativa entre términos consecutivos.'
  },

  // Álgebra y Aritmética
  {
    materia: 'Álgebra y Aritmética',
    tema: 'Ecuaciones Cuadráticas',
    nombre: 'Fórmula General de Bhaskara',
    formula: 'x = [-b ± √(b² - 4ac)] / (2a)',
    uso: 'Resolución de ax² + bx + c = 0. Discriminante Δ = b² - 4ac determina la naturaleza real o compleja de las raíces.'
  },
  {
    materia: 'Álgebra y Aritmética',
    tema: 'Productos Notables',
    nombre: 'Diferencia de Cuadrados y Binomio',
    formula: 'a² - b² = (a + b)(a - b)  |  (a ± b)² = a² ± 2ab + b²',
    uso: 'Factorización y simplificación inmediata en expresiones algebraicas y límites de admisión.'
  },
  {
    materia: 'Álgebra y Aritmética',
    tema: 'Aritmética Comercial',
    nombre: 'Interés Simple Anual',
    formula: 'I = (C × r% × t) / 100',
    uso: 'Para tiempo t en años. Si el tiempo está en meses dividir entre 1200; si está en días dividir entre 36000.'
  },

  // Geometría y Trigonometría
  {
    materia: 'Geometría y Trigonometría',
    tema: 'Triángulos Rectángulos',
    nombre: 'Teorema de Pitágoras',
    formula: 'a² + b² = c²',
    uso: 'En todo triángulo rectángulo, la suma de los cuadrados de los catetos es igual al cuadrado de la hipotenusa.'
  },
  {
    materia: 'Geometría y Trigonometría',
    tema: 'Triángulos Notables',
    nombre: 'Triángulo Notable 37° y 53°',
    formula: 'Cateto opuesto 37°: 3k  |  Cateto opuesto 53°: 4k  |  Hipotenusa: 5k',
    uso: 'Aproximación de ángulos más empleada en problemas de geometría plana, vectores y dinámica UNT.'
  },
  {
    materia: 'Geometría y Trigonometría',
    tema: 'Identidades Fundamentales',
    nombre: 'Identidad Pitagórica Fundamental',
    formula: 'sen²(x) + cos²(x) = 1',
    uso: 'Base de simplificación trigonométrica: se derivan sec²(x) - tan²(x) = 1 y csc²(x) - cot²(x) = 1.'
  },
  {
    materia: 'Geometría y Trigonometría',
    tema: 'Áreas de Figuras Planas',
    nombre: 'Fórmula Trigonométrica del Área',
    formula: 'Área = [a × b × sen(θ)] / 2',
    uso: 'Área de cualquier triángulo conociendo dos lados continuos y el ángulo que forman entre ellos.'
  },

  // Física Preuniversitaria
  {
    materia: 'Física',
    tema: 'Cinemática MRUV',
    nombre: 'Ecuaciones Horarias del MRUV',
    formula: 'Vf = Vi ± a·t   |   d = Vi·t ± ½a·t²   |   Vf² = Vi² ± 2·a·d',
    uso: 'Usar signo (+) si el móvil acelera y (-) si desacelera o frena hasta detenerse.'
  },
  {
    materia: 'Física',
    tema: 'Dinámica Lineal',
    nombre: 'Segunda Ley de Newton',
    formula: 'F_resultante = m × a',
    uso: 'La aceleración de un cuerpo es directamente proporcional a la fuerza neta e inversamente proporcional a su masa.'
  },
  {
    materia: 'Física',
    tema: 'Trabajo y Energía',
    nombre: 'Conservación de Energía Mecánica',
    formula: 'Ec = ½ · m · v²   |   Ep = m · g · h   |   Em = Ec + Ep',
    uso: 'En ausencia de rozamiento (fuerzas no conservativas), la energía mecánica total permanece constante.'
  },

  // Química General
  {
    materia: 'Química',
    tema: 'Gases Ideales',
    nombre: 'Ecuación de Estado de Gases Ideales',
    formula: 'P × V = n × R × T',
    uso: 'Donde P es presión en atm, V volumen en litros, n moles, T temperatura absoluta en Kelvin (K = °C + 273).'
  },
  {
    materia: 'Química',
    tema: 'Estructura Atómica',
    nombre: 'Relación de Núcleo Atómico',
    formula: 'A = Z + n   (Número de Masa = Protones + Neutrones)',
    uso: 'Para determinar la composición atómica, cantidad de nucleones fundamentales y carga nuclear.'
  },
  {
    materia: 'Química',
    tema: 'Soluciones Acuosas',
    nombre: 'Molaridad de una Disolución',
    formula: 'M = moles de soluto / Volumen de solución (Litros)',
    uso: 'Concentración molar indispensable para problemas de estequiometría de soluciones y titulación ácido-base.'
  },

  // Biología y Anatomía
  {
    materia: 'Biología',
    tema: 'Genética Mendeliana',
    nombre: 'Segunda Ley de Mendel (Segregación)',
    formula: 'Cruce Aa × Aa => Proporción Fenotípica 3 Dominantes : 1 Recesivo (75% : 25%)',
    uso: 'Probabilidades de herencia monohíbrida clásica con dominancia completa en problemas de admisión.'
  },
  {
    materia: 'Biología',
    tema: 'Ácidos Nucleicos',
    nombre: 'Regla de Chargaff (ADN)',
    formula: '% Adenina = % Timina   |   % Guanina = % Citosina   (A + G = T + C)',
    uso: 'La suma de purinas siempre equivale al 50% y las pirimidinas al 50% en toda doble hélice de ADN.'
  }
];

function MaterialPreviewModal({
  material,
  onClose,
  onDownload
}: {
  material: any;
  onClose: () => void;
  onDownload: (mat: any) => void;
}) {
  if (!material) return null;

  return (
    <div className="upgrade-prompt-backdrop" onClick={onClose}>
      <div className="material-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="preview-modal-head">
          <div className="preview-modal-badges">
            <span className="material-subject-badge">{material.materia}</span>
            <span className="material-week-pill">{material.semana}</span>
            <span className="pdf-tag">{material.formato || 'PDF Oficial'}</span>
          </div>
          <button className="upgrade-prompt-close" onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        <h2 className="preview-modal-title">{material.titulo}</h2>
        <p className="preview-modal-desc">{material.descripcion}</p>

        <div className="preview-meta-chips">
          <span><FileText size={14} /> {material.paginas} páginas de contenido</span>
          <span><Download size={14} /> Peso: {material.tamano}</span>
          <span><Award size={14} /> Elaborado por especialistas UNT</span>
        </div>

        {/* 1. Síntesis Teórica */}
        {material.sintesis && (
          <div className="preview-section">
            <div className="preview-section-title">
              <BookOpen size={16} color="#1e5ee5" />
              <h4>Síntesis Teórica UNT</h4>
            </div>
            <div className="preview-sintesis-box">
              <p>{material.sintesis}</p>
            </div>
          </div>
        )}

        {/* 2. Fórmulas y Conceptos Clave */}
        {material.formulas && material.formulas.length > 0 && (
          <div className="preview-section">
            <div className="preview-section-title">
              <Lightbulb size={16} color="#f59e0b" />
              <h4>Fórmulas y Propiedades Fundamentales</h4>
            </div>
            <div className="preview-formulas-grid">
              {material.formulas.map((f: string, i: number) => (
                <div key={i} className="preview-formula-item">
                  <span className="formula-bullet">✦</span>
                  <code>{f}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Ejercicio Modelo Resuelto */}
        {material.ejercicioModelo && (
          <div className="preview-section">
            <div className="preview-section-title">
              <CheckCircle2 size={16} color="#10b981" />
              <h4>Problema Modelo Tipo Examen de Admisión UNT</h4>
            </div>
            <div className="preview-exercise-box">
              <div className="exercise-enunciado">
                <span className="enunciado-tag">ENUNCIADO TIPO UNT</span>
                <p>{material.ejercicioModelo.enunciado}</p>
              </div>
              <div className="exercise-solucion">
                <span className="solucion-tag">RESOLUCIÓN METODOLÓGICA PASO A PASO</span>
                <p>{material.ejercicioModelo.solucion}</p>
              </div>
            </div>
          </div>
        )}

        {/* Acciones del pie */}
        <div className="preview-modal-footer">
          <button
            className="btn-download-preview-full"
            onClick={() => {
              onDownload(material);
              onClose();
            }}
          >
            <Download size={16} /> Descargar Guía Teórica Completa ({material.tamano})
          </button>
          <button className="btn-close-preview" onClick={onClose}>
            Cerrar previsualización
          </button>
        </div>
      </div>
    </div>
  );
}

function FormulaBookModal({ onClose }: { onClose: () => void }) {
  const [filterMateria, setFilterMateria] = useState('Todas');
  const [search, setSearch] = useState('');

  const materias = [
    'Todas',
    'Raz. Matemático',
    'Álgebra y Aritmética',
    'Geometría y Trigonometría',
    'Física',
    'Química',
    'Biología'
  ];

  const filtered = FORMULAS_DATA.filter(f => {
    const matchMateria = filterMateria === 'Todas' || f.materia === filterMateria;
    const term = search.toLowerCase();
    const matchSearch =
      !term ||
      f.nombre.toLowerCase().includes(term) ||
      f.formula.toLowerCase().includes(term) ||
      f.tema.toLowerCase().includes(term) ||
      f.materia.toLowerCase().includes(term);
    return matchMateria && matchSearch;
  });

  return (
    <div className="upgrade-prompt-backdrop" onClick={onClose}>
      <div className="formula-book-modal" onClick={e => e.stopPropagation()}>
        <div className="formula-book-head">
          <div>
            <span className="formula-badge-top">
              <Sparkles size={14} /> COMPENDIO OFICIAL PREUNIVERSITARIO UNT
            </span>
            <h2>Formulario Esencial de Admisión</h2>
            <p>Fórmulas, leyes científicas y teoremas de alta frecuencia en el examen ordinario UNT.</p>
          </div>
          <button className="upgrade-prompt-close" onClick={onClose} aria-label="Cerrar formulario">
            <X size={20} />
          </button>
        </div>

        <div className="formula-controls-bar">
          <div className="formula-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por tema, teorema, ley o fórmula..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="formula-tabs-scroll">
            {materias.map(m => (
              <button
                key={m}
                className={`formula-tab-chip ${filterMateria === m ? 'active' : ''}`}
                onClick={() => setFilterMateria(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="formula-cards-grid">
          {filtered.length === 0 ? (
            <div className="formula-empty-state">
              No se encontraron fórmulas que coincidan con "{search}".
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div className="formula-card-item" key={idx}>
                <div className="formula-card-top">
                  <span className="formula-subject-tag">{item.materia}</span>
                  <span className="formula-topic-tag">{item.tema}</span>
                </div>
                <h4>{item.nombre}</h4>
                <div className="formula-display-box">
                  <code>{item.formula}</code>
                </div>
                <p className="formula-usage-tip">
                  <b>Aplicación UNT:</b> {item.uso}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="formula-book-foot">
          <small>Total de fórmulas catalogadas: {filtered.length} de {FORMULAS_DATA.length}</small>
          <button className="btn-close-formula-book" onClick={onClose}>
            Entendido, volver a mi estudio
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportModal({ reportData, onClose }: { reportData: any; onClose: () => void }) {
  if (!reportData) return null;
  return (
    <div className="report-modal-backdrop" onClick={onClose}>
      <div className="report-modal-card" onClick={e => e.stopPropagation()}>
        <div className="report-modal-actions-top">
          <button
            className="btn-print-report"
            onClick={() => window.print()}
          >
            <Printer size={16} /> Imprimir / Guardar en PDF
          </button>
          <button
            className="report-modal-close"
            onClick={onClose}
            aria-label="Cerrar reporte"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido del Documento Oficial */}
        <div className="printable-report-sheet">
          <header className="report-sheet-header">
            <div className="report-brand">
              <h2>LA PRE <i>Digital</i></h2>
              <span>ACADEMIA DE ALTO RENDIMIENTO PREUNIVERSITARIO</span>
            </div>
            <div className="report-header-meta">
              <span className="doc-type">INFORME DE RENDIMIENTO ACADÉMICO</span>
              <b>Emisión: {reportData.fechaEmision}</b>
              <small>Programa: {reportData.estudiante.plan}</small>
            </div>
          </header>

          <div className="report-divider"></div>

          <div className="report-meta-grid">
            <div>
              <span className="meta-label">POSTULANTE</span>
              <strong>{reportData.estudiante.nombres}</strong>
              <small>{reportData.estudiante.email}</small>
            </div>
            <div>
              <span className="meta-label">CARRERA DE INTERÉS</span>
              <strong style={{ color: '#1e5ee5' }}>{reportData.estudiante.carrera}</strong>
              <small>Meta: Examen Ordinario UNT</small>
            </div>
            <div>
              <span className="meta-label">APODERADO REGISTRADO</span>
              <strong>{reportData.apoderado ? reportData.apoderado.nombres : 'No vinculado'}</strong>
              <small>{reportData.apoderado ? `${reportData.apoderado.relacion} · ${reportData.apoderado.telefono}` : 'Sin contacto registrado'}</small>
            </div>
            <div>
              <span className="meta-label">PERIODO ACADÉMICO</span>
              <strong>Ciclo Intensivo 2026</strong>
              <small>Acceso vigente hasta: {reportData.estudiante.validoHasta}</small>
            </div>
          </div>

          <h4 className="report-subheading">1. Resumen Ejecutivo de Desempeño</h4>
          <div className="report-kpi-row">
            <div className="kpi-box">
              <span>PUNTAJE ACTUAL</span>
              <b>{reportData.metricas.puntajeActual} pts</b>
              <small>Meta de corte: {reportData.metricas.puntajeCorte} pts</small>
            </div>
            <div className="kpi-box">
              <span>CONSTANCIA DE ESTUDIO</span>
              <b style={{ color: '#10b981' }}>{reportData.metricas.asistencia}%</b>
              <small>{reportData.metricas.sesionesCompletadas} de {reportData.metricas.sesionesTotales || 14} sesiones</small>
            </div>
            <div className="kpi-box">
              <span>HORAS SEMANALES</span>
              <b>{reportData.metricas.horasEstudio} h</b>
              <small>Ritmo recomendado: 6.0 h</small>
            </div>
            <div className="kpi-box">
              <span>PERCENTIL COMPARATIVO</span>
              <b style={{ color: '#1e5ee5' }}>{reportData.metricas.percentil}</b>
              <small>Entre todos los postulantes</small>
            </div>
          </div>

          <h4 className="report-subheading">2. Diagnóstico por Áreas de Examen UNT</h4>
          <table className="report-table">
            <thead>
              <tr>
                <th>Área Académica</th>
                <th>Efectividad</th>
                <th>Nivel de Preparación</th>
                <th>Diagnóstico Pedagógico</th>
              </tr>
            </thead>
            <tbody>
              {reportData.desgloseAreas.map((d: any) => (
                <tr key={d.area}>
                  <td><b>{d.area}</b></td>
                  <td><strong>{d.efectividad}%</strong></td>
                  <td>
                    <span className={`status-tag ${d.efectividad >= 80 ? 'green' : d.efectividad >= 70 ? 'blue' : 'amber'}`}>
                      {d.nivel}
                    </span>
                  </td>
                  <td>
                    {d.efectividad >= 80
                      ? 'Dominio consolidado de fórmulas y velocidad de resolución.'
                      : d.efectividad >= 70
                      ? 'Buen fundamento conceptual, fortalecer práctica cronometrada.'
                      : 'Área prioritaria de refuerzo guiado para alcanzar el corte de admisión.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 className="report-subheading">3. Observación y Recomendación Psicopedagógica</h4>
          <div className="report-observation-box">
            <p>{reportData.observacionPedagogica}</p>
          </div>

          <footer className="report-sheet-footer">
            <div className="signature-box">
              <div className="sig-line"></div>
              <b>Dirección Pedagógica y Tutoría</b>
              <span>La PRE Digital · Academia Preuniversitaria</span>
            </div>
            <div className="stamp-box">
              <div className="stamp-seal">✓ CERTIFICADO DIGITAL</div>
              <small>Código de Validación: PRE-DOC-UNT-2026</small>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function Learning({ user, go }: { user: any; go: (page: string) => void }) {
  const sub = getActiveSubscription(user);
  const plan = sub?.plan;
  const learningStorageKey = `learning-progress:${user?.id || 'anonymous'}`;
  const recommendationStorageKey = `learning-recommendations:${user?.id || 'anonymous'}`;
  const [tab, setTab] = useState('ruta');
  const [done, setDone] = useState(() => localStorage.getItem(learningStorageKey) === 'completed');
  const [runner, setRunner] = useState<null | ActivityType>(null);
  const [upgradeModal, setUpgradeModal] = useState<null | {
    feature: string;
    minPlan: string;
    description: string;
    bullets: string[];
  }>(null);
  const [guardianInfo, setGuardianInfo] = useState<any>(null);
  const [editingGuardian, setEditingGuardian] = useState(false);
  const [guardianForm, setGuardianForm] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    relacion: 'Padre'
  });
  const [savingGuardian, setSavingGuardian] = useState(false);
  const [guardianMsg, setGuardianMsg] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [simulatedCareer, setSimulatedCareer] = useState(
    user?.studentProfile?.carreraInteres || 'Ingeniería de Sistemas'
  );
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [selectedWeekFilter, setSelectedWeekFilter] = useState('Todas');
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<any | null>(null);
  const [showFormulaBook, setShowFormulaBook] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');
  const [activeRecommendation, setActiveRecommendation] = useState<number | null>(null);
  const [completedRecommendations, setCompletedRecommendations] = useState<number[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(recommendationStorageKey) || '[]');
      return Array.isArray(saved) ? saved.filter(item => Number.isInteger(item)) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(learningStorageKey, done ? 'completed' : 'pending');
  }, [done, learningStorageKey]);

  useEffect(() => {
    localStorage.setItem(recommendationStorageKey, JSON.stringify(completedRecommendations));
  }, [completedRecommendations, recommendationStorageKey]);

  useEffect(() => {
    if (tab === 'analisis') {
      setLoadingAnalytics(true);
      api(`/student/academic-analytics?carrera=${encodeURIComponent(simulatedCareer)}`)
        .then(setAnalytics)
        .catch(() => {})
        .finally(() => setLoadingAnalytics(false));
    }
  }, [tab, simulatedCareer]);

  useEffect(() => {
    if (tab === 'materiales') {
      setLoadingMaterials(true);
      api('/materials')
        .then(setMaterials)
        .catch(() => {})
        .finally(() => setLoadingMaterials(false));
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'familia') {
      api('/student/guardian')
        .then(data => {
          if (data.linked && data.guardian) {
            setGuardianInfo(data.guardian);
            setGuardianForm({
              nombres: data.guardian.nombres,
              apellidos: data.guardian.apellidos,
              email: data.guardian.email,
              telefono: data.guardian.telefono || '',
              relacion: data.guardian.relacion || 'Padre'
            });
          }
        })
        .catch(() => {});

      api('/student/report-data')
        .then(setReportData)
        .catch(() => {});
    }
  }, [tab]);

  const saveGuardian = async (e: any) => {
    e.preventDefault();
    setSavingGuardian(true);
    setGuardianMsg('');
    try {
      const res = await api('/student/guardian', 'POST', guardianForm);
      setGuardianInfo(res.guardian);
      setEditingGuardian(false);
      setGuardianMsg('¡Datos de apoderado vinculados correctamente!');
    } catch (err: any) {
      alert(err.message || 'Error al vincular apoderado');
    } finally {
      setSavingGuardian(false);
    }
  };

  const lockInfo: Record<string, { feature: string; minPlan: string; description: string; bullets: string[] }> = {
    materiales: {
      feature: 'Separatas y Biblioteca UNT',
      minPlan: 'Ruta UNT',
      description: 'Descarga compendios teóricos, formularios esenciales y bancos de preguntas resueltos semana a semana.',
      bullets: [
        'Compendios teóricos completos elaborados por docentes especialistas UNT',
        'Formularios clave de matemáticas, ciencias naturales y razonamiento',
        'Ejercicios modelo resueltos paso a paso y descargables en PDF'
      ]
    },
    ejercicios: {
      feature: 'Ejercicios Adaptativos UNT',
      minPlan: 'Ruta UNT',
      description: 'Accede al banco clasificado de preguntas por tema con retroalimentación instantánea y resolución paso a paso.',
      bullets: [
        'Más de 1,200 preguntas tipo examen UNT clasificadas por área temática',
        'Explicación metodológica paso a paso para dominar patrones de preguntas',
        'Algoritmo adaptativo que refuerza tus temas con menor precisión'
      ]
    },
    analisis: {
      feature: 'Mi Análisis y Diagnóstico IA',
      minPlan: 'Meta UNT',
      description: 'Diagnóstico predictivo de puntaje para tu carrera de interés, radar de competencias y recomendaciones semanales.',
      bullets: [
        'Cálculo de puntaje estimado actual vs. puntaje de corte de tu carrera',
        'Radar de competencias por área (Matemática, Verbal, Ciencias)',
        'Plan de acción personalizado e inteligente semana a semana'
      ]
    },
    familia: {
      feature: 'Acompañamiento Familiar y Tutoría',
      minPlan: 'Meta UNT Plus',
      description: 'Vincula a tus padres o apoderados con reportes de constancia, avance y alertas tempranas de rendimiento.',
      bullets: [
        'Informes periódicos de avance descargables en PDF para apoderados',
        'Alertas tempranas de constancia y cumplimiento de metas de estudio',
        'Acompañamiento académico prioritario para asegurar el ingreso'
      ]
    }
  };

  if (!plan)
    return (
      <div className="dash">
        <AppSidebar active="learning" go={go} />
        <main>
          <section className="empty-learning-card">
            <div className="empty-learning-icon">
              <Lock size={34} />
            </div>
            <p className="label">MI AULA · ACCESO REQUERIDO</p>
            <h1>
              Tu aula preuniversitaria
              <br />
              está lista para ti.
            </h1>
            <p>
              Elige el plan ideal para desbloquear materiales completos, ejercicios resueltos, simulacros cronometrados y
              el seguimiento personalizado para tu ingreso a la UNT.
            </p>
            <button className="btn-enter-aula" onClick={() => go('plans')}>
              Explorar planes de estudio <ArrowRight size={17} />
            </button>
          </section>
        </main>
      </div>
    );

  const name = plan.nombre;
  const route = name !== 'Explora UNT';
  const meta = name.includes('Meta');
  const plus = name.includes('Plus');

  const tabs = [
    ['ruta', 'Ruta de estudio', BookOpen, true],
    ['materiales', 'Separatas y Guías', BookMarked, route],
    ['ejercicios', 'Ejercicios adaptativos', ClipboardList, route],
    ['simulacros', 'Simulacros UNT', Target, true],
    ['analisis', 'Mi análisis', BarChart3, meta],
    ['familia', 'Acompañamiento familiar', Users, plus]
  ];

  return (
    <div className="dash">
      <AppSidebar active="learning" go={go} />
      <main>
        {/* Encabezado del Aula */}
        <section className="aula-header">
          <div className="aula-title-group">
            <p className="label">MI AULA · PLAN {name.toUpperCase()}</p>
            <h1>
              Tu preparación,
              <br />
              <em>en movimiento continuo.</em>
            </h1>
            <p>Todo el contenido estructurado y cronometrado para asegurar tu vacante en la UNT.</p>
          </div>

          <div className="aula-kpis">
            <div className="aula-kpi-card">
              <span className="kpi-label">AVANCE DE RUTA</span>
              <div className="kpi-value">
                {done ? '76%' : '68%'}
                <small>{done ? '+8% hoy' : '+12% sem'}</small>
              </div>
              <div className="aula-kpi-bar">
                <div className="aula-kpi-bar-fill" style={{ width: done ? '76%' : '68%' }}></div>
              </div>
            </div>

            <div className="aula-kpi-card">
              <span className="kpi-label">HORAS DE ESTUDIO</span>
              <div className="kpi-value">
                6.5 <small style={{ color: '#64748b' }}>h</small>
              </div>
              <div className="aula-kpi-bar">
                <div className="aula-kpi-bar-fill" style={{ width: '65%', background: '#f59e0b' }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Pestañas de Navegación del Aula */}
        <div className="aula-tabs">
          {tabs.map(([id, label, Icon, allowed]: any) => (
            <button
              key={id}
              className={`aula-tab-btn ${tab === id ? 'selected' : ''} ${!allowed ? 'tab-locked' : ''}`}
              onClick={() => {
                if (!allowed) {
                  setUpgradeModal(lockInfo[id] || {
                    feature: label,
                    minPlan: 'un plan superior',
                    description: 'Esta función requiere una suscripción avanzada.',
                    bullets: ['Desbloquea contenido avanzado y simulaciones oficiales UNT']
                  });
                } else {
                  setTab(id);
                }
              }}
            >
              <Icon size={17} />
              {label}
              {!allowed && <Lock size={12} className="lock-tag-icon" />}
            </button>
          ))}
        </div>

        {/* PESTAÑA: RUTA DE ESTUDIO */}
        {tab === 'ruta' && (
          <section className="lesson-layout">
            <div className="lesson-main-card">
              <div>
                <div className="lesson-tag-row">
                  <span className="badge-pill orange">SESIÓN EN CURSO</span>
                  <span className="badge-pill blue">RAZONAMIENTO MATEMÁTICO</span>
                  <span className="badge-pill green">MÓDULO 04</span>
                </div>

                <h2>Patrones y sucesiones numéricas</h2>
                <p className="lesson-desc">
                  Aprende a identificar razones aritméticas, leyes de recurrencia y fórmulas de término enésimo
                  aplicadas a preguntas reales del examen de admisión de la UNT.
                </p>

                <div className="lesson-payoff-box">
                  <div className="lesson-payoff-icon">★</div>
                  <div className="lesson-payoff-text">
                    <b>Payoff de Puntaje: +25 pts en prueba cuantitativa</b>
                    <span>Dominarás las 4 variantes de series con mayor frecuencia histórica en el examen UNT.</span>
                  </div>
                </div>
              </div>

              <div className="lesson-meta-bar">
                <div className="lesson-specs">
                  <span>
                    <Clock size={14} /> 35 minutos
                  </span>
                  <span>
                    <TrendingUp size={14} /> Nivel intermedio
                  </span>
                  <span>
                    <CheckCircle2 size={14} /> 2 problemas tipo
                  </span>
                </div>

                <button
                  className={`lesson-cta-btn ${done ? 'completed' : ''}`}
                  onClick={() => setRunner('lesson')}
                >
                  {done ? 'Sesión completada ✓' : 'Empezar sesión guiada'} <Play size={15} />
                </button>
              </div>
            </div>

            {/* Columna Lateral */}
            <div className="lesson-side-column">
              <div className="module-progress-card">
                <div className="card-header-row">
                  <h3>Progreso del Módulo</h3>
                  <span className="card-tag">3 de 4 listos</span>
                </div>

                <div className="module-steps-list">
                  {[
                    { title: 'Diagnóstico inicial de patrones', sub: 'Evaluación de 5 preguntas multidisciplinarias', isDiag: true, done: true },
                    { title: 'Series aritméticas y lineales', sub: 'Leyes de formación básicas', done: true },
                    { title: 'Sucesiones numéricas y geométricas', sub: 'Término enésimo y sumatorias', current: true },
                    { title: 'Práctica cronometrada UNT', sub: '10 preguntas en 15 minutos', locked: true }
                  ].map((step, i) => (
                    <div
                      key={step.title}
                      className={`module-step-item ${
                        step.done || (done && step.current) ? 'complete' : step.current ? 'current' : ''
                      }`}
                      style={step.isDiag ? { cursor: 'pointer' } : {}}
                      onClick={() => {
                        if (step.isDiag) setRunner('diagnostic');
                      }}
                      title={step.isDiag ? 'Haz clic para rendir el diagnóstico inicial UNT' : undefined}
                    >
                      <div className="step-indicator">{step.done || (done && step.current) ? '✓' : i + 1}</div>
                      <div className="step-details">
                        <div className="step-name">{step.title}</div>
                        <div className="step-subtext">{step.sub}</div>
                      </div>
                      <div className="step-status-pill">
                        {step.isDiag ? (
                          <span style={{ color: '#1e5ee5', fontWeight: 800 }}>Rendir test →</span>
                        ) : step.done || (done && step.current) ? (
                          'Completado'
                        ) : step.current ? (
                          'Ahora'
                        ) : (
                          'Pendiente'
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="quick-notes-card">
                <h4>
                  <Lightbulb size={16} /> Fórmulas y Apuntes Clave UNT
                </h4>
                <p>Para progresiones aritméticas con razón constante r:</p>
                <div className="formula-chip">Tn = T1 + (n - 1) × r</div>
              </div>
            </div>
          </section>
        )}

        {/* PESTAÑA: SEPARATAS Y GUÍAS (RUTA UNT EN ADELANTE) */}
        {tab === 'materiales' && (
          <section className="materials-catalog-panel">
            <div className="materials-heading-row">
              <div className="materials-heading">
                <div className="materials-badge-top">
                  <BookMarked size={16} /> BIBLIOTECA DE MATERIALES Y SEPARATAS UNT
                </div>
                <h2>Compendios Teóricos y Formularios por Semana</h2>
                <p>
                  Descarga las separatas teóricas oficiales estructuradas por el equipo docente de La PRE Digital,
                  con resúmenes de fórmulas, teoría condensada y ejercicios modelo resueltos paso a paso.
                </p>
              </div>
              <button
                className="btn-open-formulary"
                onClick={() => setShowFormulaBook(true)}
              >
                <Sparkles size={16} /> Ver Formulario Preuniversitario UNT
              </button>
            </div>

            {/* Filtro por Semana y Búsqueda Rápida */}
            <div className="materials-filter-bar">
              <div className="materials-week-chips">
                <span className="filter-label">Semana:</span>
                {['Todas', 'Semana 01', 'Semana 02', 'Semana 03'].map(week => (
                  <button
                    key={week}
                    className={`materials-filter-chip ${selectedWeekFilter === week ? 'active' : ''}`}
                    onClick={() => setSelectedWeekFilter(week)}
                  >
                    {week === 'Todas' ? 'Todas las semanas' : week}
                  </button>
                ))}
              </div>

              <div className="materials-search-wrap">
                <Search size={15} className="materials-search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por tema o materia..."
                  value={materialSearch}
                  onChange={e => setMaterialSearch(e.target.value)}
                  className="materials-search-input"
                />
              </div>
            </div>

            {downloadToast && (
              <div className="material-download-toast">
                <CheckCircle2 size={16} color="#10b981" />
                <span>{downloadToast}</span>
              </div>
            )}

            {/* Grid de Materiales */}
            {loadingMaterials ? (
              <div className="materials-loading">Cargando catálogo de materiales oficiales...</div>
            ) : (
              <div className="materials-grid">
                {(materials.length > 0 ? materials : [
                  { id: 'mat-01', semana: 'Semana 01', materia: 'Razonamiento Matemático', titulo: 'Sucesiones, Progresiones Aritméticas y Series UNT', descripcion: 'Compendio teórico completo con fórmulas de término enésimo y 35 ejercicios resueltos.', paginas: 18, tamano: '2.4 MB', formato: 'PDF Oficial' },
                  { id: 'mat-02', semana: 'Semana 01', materia: 'Razonamiento Verbal', titulo: 'Comprensión Lectora y Analogías Semánticas', descripcion: 'Estrategias de análisis de textos científicos DECO de la UNT y relaciones lógicas.', paginas: 14, tamano: '1.8 MB', formato: 'PDF Oficial' },
                  { id: 'mat-03', semana: 'Semana 02', materia: 'Biología y Anatomía', titulo: 'Biomoléculas Orgánicas y Estructura Celular', descripcion: 'Resumen gráfico de glúcidos, lípidos, proteínas y organelas celulares.', paginas: 22, tamano: '3.1 MB', formato: 'PDF Oficial' },
                  { id: 'mat-04', semana: 'Semana 02', materia: 'Geometría y Trigonometría', titulo: 'Triángulos, Congruencia y Líneas Notables', descripcion: 'Formulario esencial de teoremas de ángulos interiores, medianas y bisectrices.', paginas: 16, tamano: '2.0 MB', formato: 'PDF Oficial' },
                  { id: 'mat-05', semana: 'Semana 03', materia: 'Física Preuniversitaria', titulo: 'Cinemática: MRU, MRUV y Caída Libre', descripcion: 'Guía metodológica de vectores de posición, velocidad instantánea y gráficos.', paginas: 20, tamano: '2.7 MB', formato: 'PDF Oficial' },
                  { id: 'mat-06', semana: 'Semana 03', materia: 'Química General', titulo: 'Estructura Atómica y Configuración Electrónica', descripcion: 'Números cuánticos, principio de Aufbau y distribución por niveles y subniveles.', paginas: 15, tamano: '1.9 MB', formato: 'PDF Oficial' }
                ])
                  .filter(m => {
                    const matchWeek = selectedWeekFilter === 'Todas' || m.semana === selectedWeekFilter;
                    const term = materialSearch.toLowerCase();
                    const matchTerm =
                      !term ||
                      m.titulo.toLowerCase().includes(term) ||
                      m.materia.toLowerCase().includes(term) ||
                      m.descripcion.toLowerCase().includes(term);
                    return matchWeek && matchTerm;
                  })
                  .map(mat => (
                    <div className="material-card" key={mat.id}>
                      <div className="material-card-head">
                        <span className="material-subject-badge">{mat.materia}</span>
                        <span className="material-week-pill">{mat.semana}</span>
                      </div>
                      <h3>{mat.titulo}</h3>
                      <p className="material-desc">{mat.descripcion}</p>
                      
                      <div className="material-card-meta">
                        <div className="material-specs">
                          <span><FileText size={13} /> {mat.paginas} págs</span>
                          <span><Download size={13} /> {mat.tamano}</span>
                          <span className="pdf-tag">{mat.formato}</span>
                        </div>
                        <div className="material-actions-row">
                          <button
                            className="btn-preview-material"
                            onClick={() => setPreviewMaterial(mat)}
                          >
                            <Eye size={14} /> Vista Rápida
                          </button>
                          <button
                            className="btn-download-material"
                            onClick={() => {
                              setDownloadToast(`Descarga iniciada: ${mat.titulo} (${mat.formato})`);
                              setTimeout(() => setDownloadToast(null), 4000);
                            }}
                          >
                            <Download size={14} /> Descargar PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {/* PESTAÑA: EJERCICIOS ADAPTATIVOS */}
        {tab === 'ejercicios' && (
          <section className="exercise-panel-v2">
            <div className="exercise-heading">
              <p className="label">PRÁCTICA ADAPTATIVA UNT</p>
              <h2>Ejercicios para Fortalecer tu Puntuación</h2>
              <p>Resuelve bloques de 10 ejercicios con dificultad gradual para consolidar velocidad y precisión.</p>
            </div>

            <div className="exercise-grid-v2">
              {[
                {
                  num: '01',
                  subject: 'Raz. Matemático',
                  title: 'Patrones y Progresiones Numéricas',
                  desc: 'Ejercicios de series alfanuméricas, analogías numéricas y término desconocido.',
                  time: '15 min',
                  diff: 'Intermedio'
                },
                {
                  num: '02',
                  subject: 'Raz. Verbal',
                  title: 'Analogías y Relaciones Semánticas',
                  desc: 'Ejercicios de relaciones lógicas y comprensión léxica de admisión UNT.',
                  time: '12 min',
                  diff: 'Básico'
                },
                {
                  num: '03',
                  subject: 'Geometría',
                  title: 'Triángulos y Líneas Notables',
                  desc: 'Cálculo de ángulos, congruencia y semejanza de triángulos con figuras.',
                  time: '20 min',
                  diff: 'Avanzado'
                },
                {
                  num: '04',
                  subject: 'Biología UNT',
                  title: 'Biomoléculas y Estructura Celular',
                  desc: 'Preguntas tipo DECO sobre lípidos, proteínas y organelas celulares.',
                  time: '15 min',
                  diff: 'Intermedio'
                }
              ].map(ex => (
                <div className="exercise-card-item" key={ex.title}>
                  <div>
                    <div className="exercise-card-header">
                      <span className="exercise-number-pill">{ex.num}</span>
                      <span className="exercise-subject-tag">{ex.subject}</span>
                    </div>
                    <h3>{ex.title}</h3>
                    <p className="exercise-topic">{ex.desc}</p>
                  </div>

                  <div className="exercise-card-meta">
                    <span>
                      <Clock size={13} /> {ex.time} · {ex.diff}
                    </span>
                    <button onClick={() => setRunner('exercise')}>
                      Resolver <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PESTAÑA: SIMULACROS UNT */}
        {tab === 'simulacros' && (
          <section className="simulation-hub">
            <div className="simulation-hero-card">
              <div>
                <p className="label" style={{ color: '#fbbf24' }}>
                  SIMULADOR OFICIAL DE ADMISIÓN
                </p>
                <h2>Simulacro Integral · Semana 3</h2>
                <p>
                  Mide tu rendimiento en condiciones idénticas al examen presencial de la UNT: 60 preguntas cronometradas,
                  puntuación con penalidad por respuesta errónea y cálculo de percentil inmediato.
                </p>

                <div className="sim-specs-row">
                  <span>
                    <Clock size={15} /> 120 minutos
                  </span>
                  <span>
                    <Target size={15} /> 60 preguntas
                  </span>
                  <span>
                    <Award size={15} /> Puntaje sobre 1000 pts
                  </span>
                </div>

                <button className="btn-enter-aula" onClick={() => setRunner('simulation')}>
                  Iniciar simulacro ahora <Play size={16} />
                </button>
              </div>

              <div className="sim-orbit-container">
                <div className="sim-orbit-circle">
                  <b>60</b>
                  <span>PREGUNTAS</span>
                </div>
                <small style={{ color: '#cbd5e1' }}>Formato Oficial UNT</small>
              </div>
            </div>

            {/* Historial de Simulacros Previos */}
            <div className="sim-history-grid">
              <div className="sim-history-item">
                <span className="label">SIMULACRO SEMANA 2</span>
                <h4>Diagnóstico Cuantitativo</h4>
                <div className="sim-history-stats">
                  <strong>740 pts</strong>
                  <small>Percentil 82% (Top 18%)</small>
                </div>
              </div>

              <div className="sim-history-item">
                <span className="label">SIMULACRO SEMANA 1</span>
                <h4>Razonamiento Integral</h4>
                <div className="sim-history-stats">
                  <strong>680 pts</strong>
                  <small>Percentil 74% (Top 26%)</small>
                </div>
              </div>

              <div className="sim-history-item">
                <span className="label">PRÓXIMO SIMULACRO</span>
                <h4>Simulacro General Mensual</h4>
                <div className="sim-history-stats">
                  <strong style={{ color: '#f59e0b' }}>Sábado 9 AM</strong>
                  <small>En vivo para todos los alumnos</small>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PESTAÑA: MI ANÁLISIS PREDICTIVO CON IA */}
        {tab === 'analisis' && (
          <section className="analysis-container">
            <div className="analysis-main-card">
              <div className="analysis-header-row">
                <div>
                  <p className="label">DIAGNÓSTICO PREDICTIVO CON IA · META UNT</p>
                  <h2>Tu Desempeño y Proyección de Vacante</h2>
                  <p className="analysis-intro">
                    Comparamos tus tiempos, aciertos y percentil con la base histórica de cortes de la UNT
                    para proyectar tus probabilidades de ingreso.
                  </p>
                </div>
              </div>

              {/* Barra de Simulación de Corte por Carrera */}
              <div className="analytics-sim-bar">
                <div className="sim-bar-label">
                  <Sliders size={16} />
                  <span>SIMULADOR DE CORTE UNT:</span>
                </div>
                <div className="sim-bar-select-wrap">
                  <select
                    value={simulatedCareer}
                    onChange={e => setSimulatedCareer(e.target.value)}
                    className="sim-career-select"
                  >
                    {analytics?.carrerasDisponibles?.map((c: any) => (
                      <option key={c.nombre} value={c.nombre}>
                        {c.nombre} · Corte UNT: {c.corte} pts ({c.area})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sim-bar-status">
                  <span className="sim-badge-area">{analytics?.resumen?.areaGeneral}</span>
                </div>
              </div>

              {/* Banner de Puntaje Proyectado vs Corte */}
              <div className="score-projection-banner">
                <div className="score-stat-col">
                  <span className="score-label">PUNTAJE PROYECTADO ACTUAL</span>
                  <strong>
                    {analytics?.resumen?.puntajeActual || 740} <small>/ 1000 pts</small>
                  </strong>
                  <span className="score-sub">Percentil: Top 18% general</span>
                </div>

                <div className="score-gap-col">
                  <div
                    className="gap-indicator-pill"
                    style={{
                      borderColor: analytics?.resumen?.probabilidadColor,
                      color: analytics?.resumen?.probabilidadColor
                    }}
                  >
                    <Sparkles size={14} color={analytics?.resumen?.probabilidadColor} />
                    <b>{analytics?.resumen?.estadoVacante}</b>
                  </div>
                  <div className="gap-bar-wrap">
                    <div className="gap-bar-track">
                      <div
                        className="gap-bar-fill"
                        style={{
                          width: `${analytics?.resumen?.probabilidadPorcentaje || 80}%`,
                          background: analytics?.resumen?.probabilidadColor
                        }}
                      ></div>
                    </div>
                    <div className="gap-bar-marks">
                      <span>0 pts</span>
                      <span style={{ color: analytics?.resumen?.probabilidadColor, fontWeight: 700 }}>
                        {analytics?.resumen?.probabilidadPorcentaje}% alcanzado
                      </span>
                      <span>{analytics?.resumen?.puntajeCorte} pts</span>
                    </div>
                  </div>
                </div>

                <div className="score-stat-col cutoff-col">
                  <span className="score-label">CORTE ({analytics?.carreraSeleccionada})</span>
                  <strong style={{ color: '#1e5ee5' }}>
                    {analytics?.resumen?.puntajeCorte || 790} <small>pts</small>
                  </strong>
                  <span className="score-sub">
                    {analytics?.resumen?.brecha > 0
                      ? `Faltan ${analytics?.resumen?.brecha} pts para vacante`
                      : '¡Por encima del corte!'}
                  </span>
                </div>
              </div>

              {/* Indicador de Velocidad y Ritmo */}
              <div className="speed-rhythm-banner">
                <div className="speed-icon-box">
                  <Zap size={22} color="#f59e0b" />
                </div>
                <div className="speed-text-group">
                  <div className="speed-title-row">
                    <b>Ritmo de Respuesta: {analytics?.velocidad?.tiempoPromedioSegundos}s / pregunta</b>
                    <span className="speed-pill">Óptimo UNT: {analytics?.velocidad?.tiempoOptimoSegundos}s</span>
                  </div>
                  <p>{analytics?.velocidad?.recomendacionVelocidad}</p>
                </div>
              </div>

              {/* Barras de Desglose por Áreas */}
              <div className="analysis-bars-v2">
                <h4 className="analysis-section-title">Efectividad y Tiempos por Área de Examen</h4>
                {(analytics?.radarAreas || [
                  { area: 'Razonamiento Matemático', pct: 82, color: 'blue', aciertos: '29 / 35', tiempoMedio: '1m 45s', estado: 'Dominio fuerte' },
                  { area: 'Razonamiento Verbal', pct: 65, color: 'amber', aciertos: '20 / 30', tiempoMedio: '1m 15s', estado: 'Prioridad alta de refuerzo' },
                  { area: 'Ciencias y Biología', pct: 78, color: 'emerald', aciertos: '23 / 30', tiempoMedio: '1m 30s', estado: 'Zona competitiva' },
                  { area: 'Física y Química', pct: 70, color: 'indigo', aciertos: '18 / 25', tiempoMedio: '2m 05s', estado: 'Progresión favorable' }
                ]).map((item: any) => (
                  <div className="analysis-bar-row" key={item.area}>
                    <div className="bar-labels">
                      <span>
                        <b>{item.area}</b> <small>· {item.aciertos}</small>
                      </span>
                      <div className="bar-meta-right">
                        <span className="time-tag">
                          <Clock size={12} /> {item.tiempoMedio}
                        </span>
                        <span>
                          <b>{item.pct}%</b> ({item.estado})
                        </span>
                      </div>
                    </div>
                    <div className="bar-track">
                      <div className={`bar-fill ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Temas Prioritarios de Refuerzo con Payoff */}
              <div className="priority-topics-section">
                <h4 className="analysis-section-title">Temas Prioritarios con Mayor Payoff de Puntos</h4>
                <div className="priority-topics-grid">
                  {(analytics?.temasPrioritarios || [
                    { materia: 'Raz. Verbal', tema: 'Analogías y Relaciones Semánticas', payoff: '+18 pts en prueba general', dificultad: 'Intermedio', efectividadActual: '58%', runnerType: 'exercise', accion: 'Resolver bloque' },
                    { materia: 'Física UNT', tema: 'Cinemática y Dinámica Lineal', payoff: '+15 pts en ciencias', dificultad: 'Avanzado', efectividadActual: '62%', runnerType: 'exercise', accion: 'Resolver bloque' },
                    { materia: 'Raz. Matemático', tema: 'Sucesiones y Sumatorias Notables', payoff: '+12 pts cuantitativos', dificultad: 'Intermedio', efectividadActual: '74%', runnerType: 'lesson', accion: 'Repasar teoría' }
                  ]).map((t: any) => (
                    <div className="priority-topic-card" key={t.tema}>
                      <div className="priority-topic-top">
                        <span className="topic-subject-badge">{t.materia}</span>
                        <span className="topic-payoff-badge">{t.payoff}</span>
                      </div>
                      <h5>{t.tema}</h5>
                      <div className="priority-topic-meta">
                        <span>Efectividad: <b>{t.efectividadActual}</b></span>
                        <span>{t.dificultad}</span>
                      </div>
                      <button
                        className="btn-practice-topic"
                        onClick={() => setRunner(t.runnerType || 'exercise')}
                      >
                        {t.accion} <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Plan de acción semanal generado por IA */}
            <aside className="analysis-sidebar ai-action-sidebar">
              <section className="recommendations-card ai-action-card">
                <div className="ai-action-card-head">
                  <div className="ai-action-icon"><Sparkles size={19} /></div>
                  <div>
                    <p>RECOMENDACIÓN PERSONALIZADA</p>
                    <h3>Plan de acción<br />con IA</h3>
                  </div>
                  <span>{completedRecommendations.length}/3</span>
                </div>
                <p className="ai-action-intro">Priorizamos las acciones que hoy pueden mover más tu preparación.</p>
                <div className="ai-plan-progress" aria-label="Progreso del plan semanal">
                  <i style={{ width: `${(completedRecommendations.length / 3) * 100}%` }} />
                </div>
                <div className="recommendation-list ai-recommendation-list">
                  {(analytics?.planEstrategicoSemanal || [
                    'Dedica un bloque de 25 min diarios a razonamiento verbal (comprensión de textos DECO y analogías semánticas).',
                    'Realiza una prueba corta de 10 ejercicios de física con cronómetro para calibrar el tiempo medio a menos de 1m 50s.',
                    'Rinde el simulacro general programado para este sábado para validar el avance del percentil.'
                  ]).map((rec: string, i: number) => {
                    const completed = completedRecommendations.includes(i);
                    const meta = [
                      { when: 'HOY', time: '25 MIN', type: 'exercise' as ActivityType, action: 'Practicar ahora' },
                      { when: 'MAÑANA', time: '20 MIN', type: 'exercise' as ActivityType, action: 'Resolver ejercicios' },
                      { when: 'SÁBADO', time: 'SIMULACRO', type: 'simulation' as ActivityType, action: 'Iniciar simulacro' }
                    ][i] || { when: 'ESTA SEMANA', time: '25 MIN', type: 'exercise' as ActivityType, action: 'Empezar tarea' };
                    return (
                      <article className={`ai-recommendation ${completed ? 'completed' : ''}`} key={i}>
                        <div className="ai-recommendation-meta">
                          <span>{completed ? <CheckCircle2 size={15} /> : `0${i + 1}`}</span>
                          <b>{meta.when} · {meta.time}</b>
                        </div>
                        <p>{rec}</p>
                        <button
                          disabled={completed}
                          onClick={() => {
                            setActiveRecommendation(i);
                            setRunner(meta.type);
                          }}
                        >
                          {completed ? 'Tarea completada' : <>{meta.action} <ArrowRight size={14} /></>}
                        </button>
                      </article>
                    );
                  })}
                </div>
                <div className="ai-action-footer"><Lightbulb size={15} /> Se actualiza cuando completas una actividad.</div>
              </section>
            </aside>
          </section>
        )}

        {/* PESTAÑA: ACOMPAÑAMIENTO FAMILIAR Y TUTORÍA (META UNT PLUS) */}
        {tab === 'familia' && (
          <section className="family-panel-v2">
            {/* Encabezado del Módulo Familiar */}
            <div className="family-header">
              <div className="family-icon-wrap">
                <Users size={28} />
              </div>
              <div className="family-header-text">
                <p className="label">ACOMPAÑAMIENTO FAMILIAR Y TUTORÍA · META UNT PLUS</p>
                <h2>Monitoreo Académico para Padres y Apoderados</h2>
                <p>
                  Facilitamos el seguimiento del avance, asistencia a simulacros y constancia de estudio
                  para que la familia sea el principal aliado en tu ingreso a la UNT.
                </p>
              </div>
            </div>

            {/* Tarjeta de Vinculación de Apoderado */}
            <div className="guardian-link-card">
              <div className="guardian-card-head">
                <div className="guardian-card-title">
                  <div className="guardian-status-icon">
                    {guardianInfo ? <UserCheck size={22} color="#10b981" /> : <Users size={22} color="#f59e0b" />}
                  </div>
                  <div>
                    <h3>{guardianInfo ? 'Apoderado Vinculado' : 'Sin Apoderado Registrado'}</h3>
                    <p>
                      {guardianInfo
                        ? 'Este contacto recibe el reporte semanal oficial y alertas directas.'
                        : 'Registra los datos de tu padre, madre o tutor para activar el envío de reportes.'}
                    </p>
                  </div>
                </div>
                <button
                  className="btn-guardian-edit"
                  onClick={() => setEditingGuardian(!editingGuardian)}
                >
                  <Edit3 size={15} />
                  {guardianInfo ? (editingGuardian ? 'Cancelar edición' : 'Modificar datos') : (editingGuardian ? 'Cancelar' : 'Vincular apoderado')}
                </button>
              </div>

              {guardianMsg && <div className="guardian-msg-success">{guardianMsg}</div>}

              {/* Formulario de Registro / Edición */}
              {editingGuardian ? (
                <form className="guardian-edit-form" onSubmit={saveGuardian}>
                  <div className="guardian-form-grid">
                    <div>
                      <label>Nombres del Apoderado</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Carlos Alberto"
                        value={guardianForm.nombres}
                        onChange={e => setGuardianForm({ ...guardianForm, nombres: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Apellidos del Apoderado</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Rodríguez Vega"
                        value={guardianForm.apellidos}
                        onChange={e => setGuardianForm({ ...guardianForm, apellidos: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Parentesco / Relación</label>
                      <select
                        value={guardianForm.relacion}
                        onChange={e => setGuardianForm({ ...guardianForm, relacion: e.target.value })}
                      >
                        <option value="Padre">Padre</option>
                        <option value="Madre">Madre</option>
                        <option value="Tutor Legal">Tutor Legal</option>
                        <option value="Familiar">Familiar / Apoderado</option>
                      </select>
                    </div>
                    <div>
                      <label>Teléfono para Alertas WhatsApp</label>
                      <input
                        type="tel"
                        required
                        placeholder="Ej. 948123456"
                        value={guardianForm.telefono}
                        onChange={e => setGuardianForm({ ...guardianForm, telefono: e.target.value })}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label>Correo Electrónico para Informes</label>
                      <input
                        type="email"
                        required
                        placeholder="apoderado@gmail.com"
                        value={guardianForm.email}
                        onChange={e => setGuardianForm({ ...guardianForm, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="guardian-form-actions">
                    <button type="submit" className="btn-save-guardian" disabled={savingGuardian}>
                      {savingGuardian ? 'Guardando...' : 'Guardar y Vincular Apoderado'}
                    </button>
                  </div>
                </form>
              ) : guardianInfo ? (
                <div className="guardian-info-details">
                  <div className="guardian-detail-pill">
                    <span className="detail-tag">APODERADO</span>
                    <strong>{guardianInfo.nombres} {guardianInfo.apellidos}</strong>
                  </div>
                  <div className="guardian-detail-pill">
                    <span className="detail-tag">RELACIÓN</span>
                    <strong>{guardianInfo.relacion}</strong>
                  </div>
                  <div className="guardian-detail-pill">
                    <span className="detail-tag">WHATSAPP</span>
                    <strong><Phone size={13} /> {guardianInfo.telefono || 'No registrado'}</strong>
                  </div>
                  <div className="guardian-detail-pill">
                    <span className="detail-tag">CORREO</span>
                    <strong><Mail size={13} /> {guardianInfo.email}</strong>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Cuadrícula de Indicadores Académicos para la Familia */}
            <div className="family-grid">
              <div className="family-stat-box">
                <span className="stat-badge-top">CONSTANCIA</span>
                <strong style={{ color: '#10b981' }}>94% Asistencia</strong>
                <p>12 de 14 sesiones y prácticas semanales completadas puntualmente.</p>
              </div>
              <div className="family-stat-box">
                <span className="stat-badge-top">SIMULACRO UNT</span>
                <strong style={{ color: '#1e5ee5' }}>740 / 1000 pts</strong>
                <p>Percentil 82% (Top 18%). En trayectoria competitiva hacia la vacante.</p>
              </div>
              <div className="family-stat-box">
                <span className="stat-badge-top">SEGUIMIENTO</span>
                <strong style={{ color: '#f59e0b' }}>Alertas Activas</strong>
                <p>Canal de reporte directo habilitado para coordinaciones académicas.</p>
              </div>
            </div>

            {/* Banner de Descarga de Informe Oficial */}
            <div className="report-cta-card">
              <div>
                <span className="report-pill">INFORME SEMANAL INSTITUCIONAL</span>
                <h3>Reporte de Avance Académico Preuniversitario</h3>
                <p>
                  Genera el informe oficial en formato membretado con el rendimiento en simulacros, radar por áreas
                  y observaciones psicopedagógicas listo para imprimir o guardar en PDF.
                </p>
              </div>
              <button
                className="btn-open-report"
                onClick={() => setShowReportModal(true)}
              >
                <FileText size={17} />
                Ver y descargar informe en PDF
              </button>
            </div>

            {/* Canal de Atención Prioritaria y Tutoría Personalizada (Meta UNT Plus) */}
            <div className="priority-support-card">
              <div className="priority-support-badge">
                <Sparkles size={14} /> BENEFICIO EXCLUSIVO META UNT PLUS
              </div>
              <div className="priority-support-content">
                <div className="priority-support-icon">
                  <Zap size={26} color="#10b981" />
                </div>
                <div>
                  <h3>Canal de Atención Prioritaria y Tutoría Personalizada</h3>
                  <p>
                    Como postulante y familia del plan Meta UNT Plus, cuentas con línea prioritaria directa con la Dirección Pedagógica y
                    orientación psicopedagógica vía WhatsApp institucional para coordinar refuerzos o resolver dudas vocacionales.
                  </p>
                  <div className="priority-support-tags">
                    <span>✓ Respuesta en menos de 2 horas</span>
                    <span>✓ Agendamiento de sesión 1 a 1</span>
                    <span>✓ Orientación psicopedagógica</span>
                  </div>
                </div>
              </div>
              <a
                href="https://wa.me/51948123456?text=Hola%20La%20PRE%20Digital,%20soy%20estudiante%20del%20plan%20Meta%20UNT%20Plus%20y%20deseo%20coordinar%20mi%20tutor%C3%ADa%20personalizada."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp-priority"
              >
                <Phone size={16} /> Contactar Tutoría vía WhatsApp
              </a>
            </div>
          </section>
        )}

        {/* Runner Interactivo */}
        {runner && <Runner type={runner} finish={() => {
          setDone(true);
          if (activeRecommendation !== null) {
            setCompletedRecommendations(items => items.includes(activeRecommendation) ? items : [...items, activeRecommendation]);
            setActiveRecommendation(null);
          }
        }} close={() => setRunner(null)} />}

        {/* Modal de Desbloqueo y Mejora de Plan */}
        {upgradeModal && (
          <div className="upgrade-prompt-backdrop" onClick={() => setUpgradeModal(null)}>
            <div className="upgrade-prompt-modal" onClick={e => e.stopPropagation()}>
              <button
                className="upgrade-prompt-close"
                onClick={() => setUpgradeModal(null)}
                aria-label="Cerrar modal"
              >
                <X size={19} />
              </button>

              <div className="upgrade-prompt-badge">
                <Sparkles size={14} /> FUNCIÓN EXCLUSIVA
              </div>

              <div className="upgrade-prompt-icon-wrap">
                <Lock size={30} />
              </div>

              <h2>Desbloquea {upgradeModal.feature}</h2>
              <p className="upgrade-prompt-desc">{upgradeModal.description}</p>

              <div className="upgrade-prompt-pill-plan">
                Disponible a partir del plan <strong>{upgradeModal.minPlan}</strong>
              </div>

              <ul className="upgrade-prompt-list">
                {upgradeModal.bullets.map((b, i) => (
                  <li key={i}>
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="upgrade-prompt-actions">
                <button
                  className="btn-modal-upgrade"
                  onClick={() => {
                    setUpgradeModal(null);
                    go('plans');
                  }}
                >
                  Ver planes y mejorar suscripción <ArrowRight size={16} />
                </button>
                <button className="btn-modal-cancel" onClick={() => setUpgradeModal(null)}>
                  Continuar en mi plan actual
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Informe Académico Oficial Imprimible */}
        {showReportModal && reportData && (
          <ReportModal reportData={reportData} onClose={() => setShowReportModal(false)} />
        )}

        {/* Modal de Previsualización de Material Oficial */}
        {previewMaterial && (
          <MaterialPreviewModal
            material={previewMaterial}
            onClose={() => setPreviewMaterial(null)}
            onDownload={(mat: any) => {
              setDownloadToast(`Descarga iniciada: ${mat.titulo} (${mat.formato})`);
              setTimeout(() => setDownloadToast(null), 4000);
            }}
          />
        )}

        {/* Modal de Formulario Preuniversitario UNT */}
        {showFormulaBook && (
          <FormulaBookModal onClose={() => setShowFormulaBook(false)} />
        )}
      </main>
    </div>
  );
}

function GuardianPortal({ user, go }: { user: any; go: (page: string) => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkRelation, setLinkRelation] = useState('Padre');
  const [linking, setLinking] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);

  const loadData = () => {
    setLoading(true);
    api('/guardians/students')
      .then(d => setStudents(d.students || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLink = async (e: any) => {
    e.preventDefault();
    setLinking(true);
    try {
      await api('/guardians/link', 'POST', {
        studentEmail: linkEmail,
        relacionConEstudiante: linkRelation,
        autorizadoContacto: true
      });
      setShowLinkModal(false);
      setLinkEmail('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al asociar estudiante');
    } finally {
      setLinking(false);
    }
  };

  const openStudentReport = (st: any) => {
    setReportData({
      fechaEmision: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }),
      estudiante: {
        nombres: `${st.nombres} ${st.apellidos}`,
        email: st.email,
        carrera: st.carrera,
        plan: st.plan,
        validoHasta: 'Vigente Ciclo 2026'
      },
      apoderado: {
        nombres: `${user.nombres} ${user.apellidos}`,
        telefono: user.telefono || 'Registrado',
        relacion: 'Apoderado / Tutor'
      },
      metricas: st.metricas,
      desgloseAreas: [
        { area: 'Razonamiento Matemático', efectividad: 82, nivel: 'Sobresaliente' },
        { area: 'Razonamiento Verbal', efectividad: 65, nivel: 'Requiere refuerzo' },
        { area: 'Ciencias y Biología', efectividad: 78, nivel: 'Competitivo' },
        { area: 'Física y Química', efectividad: 70, nivel: 'En progresión' }
      ],
      observacionPedagogica:
        'El postulante mantiene una disciplina destacada en razonamiento cuantitativo y ciencias. Se recomienda sostener el ritmo diario de práctica y reforzar la resolución de textos en razonamiento verbal.'
    });
    setShowReport(true);
  };

  return (
    <div className="dash">
      <AppSidebar active="dashboard" go={go} user={user} />
      <main>
        <div className="guardian-portal-container">
          <div className="guardian-portal-hero">
            <div className="guardian-hero-content">
              <span className="guardian-badge-top">
                <Users size={16} /> PORTAL DEL APODERADO Y FAMILIA UNT
              </span>
              <h1>
                Acompañamiento Académico
                <br />
                <em>para el Éxito de tus Hijos</em>
              </h1>
              <p>
                Supervisa el avance, asistencia y rendimiento en simulacros en tiempo real para asegurar el ingreso a la Universidad Nacional de Trujillo.
              </p>
            </div>
            <button className="btn-link-new-student" onClick={() => setShowLinkModal(true)}>
              <UserCheck size={16} /> Vincular estudiante
            </button>
          </div>

          {loading ? (
            <div className="materials-loading">Cargando información de estudiantes...</div>
          ) : students.length === 0 ? (
            <div className="empty-learning-card">
              <div className="empty-learning-icon">
                <Users size={34} />
              </div>
              <p className="label">PORTAL DE FAMILIA</p>
              <h1>Aún no tienes estudiantes vinculados</h1>
              <p>Vincula a tu hijo/a ingresando su correo institucional registrado en La PRE Digital.</p>
              <button className="btn-enter-aula" onClick={() => setShowLinkModal(true)}>
                Vincular a mi hijo/a ahora <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <div className="guardian-students-list">
              {students.map(st => (
                <div className="guardian-student-card" key={st.id}>
                  <div className="st-card-header">
                    <div className="st-avatar">{st.nombres[0]}{st.apellidos[0]}</div>
                    <div className="st-title-info">
                      <h3>{st.nombres} {st.apellidos}</h3>
                      <p>
                        <span>Meta UNT: <b>{st.carrera}</b></span> · 
                        <span className="st-plan-pill">{st.plan}</span>
                      </p>
                    </div>
                    <div className="st-status-tag">
                      <CheckCircle2 size={15} color="#10b981" /> Activo en preparación
                    </div>
                  </div>

                  <div className="st-metrics-grid">
                    <div className="st-metric-box">
                      <span className="label">CONSTANCIA</span>
                      <strong>{st.metricas.asistencia}%</strong>
                      <small>12 de 14 sesiones completadas</small>
                    </div>
                    <div className="st-metric-box">
                      <span className="label">HORAS DE ESTUDIO</span>
                      <strong>{st.metricas.horasEstudio} h</strong>
                      <small>Dedicadas esta semana</small>
                    </div>
                    <div className="st-metric-box">
                      <span className="label">PUNTAJE SIMULACRO</span>
                      <strong style={{ color: '#1e5ee5' }}>{st.metricas.puntajeActual} pts</strong>
                      <small>Corte meta: {st.metricas.puntajeCorte} pts ({st.metricas.percentil})</small>
                    </div>
                    <div className="st-metric-box">
                      <span className="label">NIVEL CALIBRADO</span>
                      <strong style={{ color: '#10b981' }}>{st.areaRefuerzo}</strong>
                      <small>Evaluación continua UNT</small>
                    </div>
                  </div>

                  <div className="st-actions-bar">
                    <button className="btn-view-st-report" onClick={() => openStudentReport(st)}>
                      <FileText size={16} /> Ver y Descargar Informe Oficial en PDF
                    </button>
                    <a
                      href={`https://wa.me/51948123456?text=Hola%20La%20PRE%20Digital,%20soy%20apoderado%20de%20${encodeURIComponent(st.nombres)}%20y%20deseo%20coordinar%20orientaci%C3%B3n%20acad%C3%A9mica.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp-guardian"
                    >
                      <Phone size={15} /> Canal Prioritario WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showLinkModal && (
            <div className="upgrade-prompt-backdrop" onClick={() => setShowLinkModal(false)}>
              <div className="upgrade-prompt-modal" onClick={e => e.stopPropagation()}>
                <button className="upgrade-prompt-close" onClick={() => setShowLinkModal(false)}><X size={19} /></button>
                <div className="upgrade-prompt-badge"><Users size={14} /> VINCULAR ALUMNO</div>
                <h2>Asociar Estudiante</h2>
                <p className="upgrade-prompt-desc">Introduce el correo electrónico con el que tu hijo/a está registrado.</p>
                <form onSubmit={handleLink} style={{ width: '100%', marginTop: '16px' }}>
                  <div style={{ marginBottom: '14px', textAlign: 'left' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#0b1f38' }}>Correo del Estudiante</label>
                    <input
                      type="email"
                      required
                      placeholder="estudiante@ejemplo.com"
                      value={linkEmail}
                      onChange={e => setLinkEmail(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#0b1f38' }}>Parentesco</label>
                    <select
                      value={linkRelation}
                      onChange={e => setLinkRelation(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    >
                      <option value="Padre">Padre</option>
                      <option value="Madre">Madre</option>
                      <option value="Tutor Legal">Tutor Legal</option>
                      <option value="Familiar">Familiar / Apoderado</option>
                    </select>
                  </div>
                  <div className="upgrade-prompt-actions">
                    <button type="submit" className="btn-modal-upgrade" disabled={linking}>
                      {linking ? 'Vinculando...' : 'Asociar Estudiante'} <ArrowRight size={16} />
                    </button>
                    <button type="button" className="btn-modal-cancel" onClick={() => setShowLinkModal(false)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showReport && reportData && (
            <ReportModal reportData={reportData} onClose={() => setShowReport(false)} />
          )}
        </div>
      </main>
    </div>
  );
}

function Profile({
  user,
  go,
  updated
}: {
  user: any;
  go: (page: string) => void;
  updated: (user: any) => void;
}) {
  const [message, setMessage] = useState('');

  const save = async (e: any) => {
    e.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(e.target));
      const result = await api('/auth/me', 'PATCH', data);
      updated(result);
      setMessage('Tu perfil fue actualizado correctamente.');
    } catch (e: any) {
      setMessage(e.message);
    }
  };

  const p = user.studentProfile || {};

  return (
    <div className="dash">
      <AppSidebar active="profile" go={go} user={user} />
      <main>
        <p className="label">MI PERFIL</p>
        <h1>
          Tu información,
          <br />
          <em>siempre al día.</em>
        </h1>
        <form className="profile-form" onSubmit={save}>
          <div className="profile-head">
            <div className="profile-avatar">
              {user.nombres?.slice(0, 1)}
              {user.apellidos?.slice(0, 1)}
            </div>
            <div>
              <h2>
                {user.nombres} {user.apellidos}
              </h2>
              <p>{user.email}</p>
            </div>
          </div>
          <div className="profile-grid">
            <label>
              Nombres
              <input name="nombres" defaultValue={user.nombres} required />
            </label>
            <label>
              Apellidos
              <input name="apellidos" defaultValue={user.apellidos} required />
            </label>
            <label>
              Teléfono
              <input name="telefono" defaultValue={user.telefono || ''} />
            </label>
            <label>
              Carrera de interés
              <input name="carreraInteres" defaultValue={p.carreraInteres || ''} />
            </label>
            <label>
              Área a reforzar
              <input name="areaRefuerzo" defaultValue={p.areaRefuerzo || ''} placeholder="Ej. Matemática" />
            </label>
            <label>
              Nivel educativo
              <input name="nivelEducativo" defaultValue={p.nivelEducativo || ''} placeholder="Ej. 5to de secundaria" />
            </label>
          </div>
          {message && <p className={message.includes('correctamente') ? 'success' : 'error'}>{message}</p>}
          <button>
            Guardar cambios <ArrowRight size={16} />
          </button>
        </form>
      </main>
    </div>
  );
}

function Payments({ go, user }: { go: (page: string) => void; user: any }) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api('/payments/my-payments')
      .then(setItems)
      .catch(() => {});
  }, []);

  return (
    <div className="dash">
      <AppSidebar active="payments" go={go} user={user} />
      <main>
        <p className="label">MI HISTORIAL</p>
        <h1>
          Pagos con
          <br />
          <em>total claridad.</em>
        </h1>
        <section className="admin-table">
          <div className="table-head">
            <h2>Transacciones</h2>
            <button onClick={() => go('plans')}>Ver planes</button>
          </div>
          {items.length === 0 ? (
            <p className="empty">Aún no registras pagos. Elige un plan para iniciar tu preparación.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Canal</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Código</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {items.map(p => (
                  <tr key={p.id}>
                    <td>{p.plan.nombre}</td>
                    <td>{p.canalPago}</td>
                    <td>{money(p.monto)}</td>
                    <td>
                      <span className="status">{p.estadoTransaccion}</span>
                    </td>
                    <td>{p.codigoOperacion}</td>
                    <td>{new Date(p.fechaInicio).toLocaleDateString('es-PE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

function Admin({ section = 'overview' }: { section?: 'overview' | 'users' | 'transactions' }) {
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    api('/admin/users').then(setUsers);
    api('/admin/payments').then(setPayments);
  }, []);

  const go = (page: string) => (location.hash = '/' + page);
  const active = section === 'users' ? 'admin-users' : section === 'transactions' ? 'admin-transactions' : 'admin';
  const visible = payments.filter(p => !filter || p.canalPago === filter || p.estadoTransaccion === filter);

  const openProgress = async (id: string) => {
    try {
      setProgress(await api('/admin/users/' + id + '/progress'));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const usersTable = (
    <section className="admin-table">
      <div className="table-head">
        <h2>Estudiantes y avance</h2>
        <span className="table-note">Selecciona un estudiante para ver su detalle</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Estudiante</th>
            <th>Correo</th>
            <th>Etapa</th>
            <th>Registrado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users
            .filter(u => u.rol === 'STUDENT')
            .map(u => (
              <tr key={u.id}>
                <td>
                  {u.nombres} {u.apellidos}
                </td>
                <td>{u.email}</td>
                <td>
                  <span className="status">{u.etapaComercial}</span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString('es-PE')}</td>
                <td>
                  <button className="detail" onClick={() => openProgress(u.id)}>
                    Ver avance
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </section>
  );

  const paymentsTable = (
    <section className="admin-table">
      <div className="table-head">
        <h2>Transacciones</h2>
        <select aria-label="Filtrar pagos" onChange={e => setFilter(e.target.value)}>
          <option value="">Todos</option>
          <option value="CARD">Tarjeta</option>
          <option value="YAPE">Yape</option>
          <option value="PLIN">Plin</option>
          <option value="CONFIRMADA">Confirmados</option>
          <option value="INICIADA">Iniciados</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Responsable</th>
            <th>Plan</th>
            <th>Canal</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visible.map(p => (
            <tr key={p.id}>
              <td>
                {p.user.nombres} {p.user.apellidos}
              </td>
              <td>{p.plan.nombre}</td>
              <td>{p.canalPago}</td>
              <td>{money(p.monto)}</td>
              <td>
                <span className="status">{p.estadoTransaccion}</span>
              </td>
              <td>{new Date(p.fechaInicio).toLocaleDateString('es-PE')}</td>
              <td>
                <button className="detail" onClick={() => setDetail(p)}>
                  Detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  return (
    <div className="dash">
      <AppSidebar active={active} go={go} />
      <main>
        <p className="label">PANEL ADMINISTRATIVO</p>
        <h1>
          {section === 'users' ? 'Avance de' : 'Control de'}
          <br />
          <em>{section === 'users' ? 'estudiantes.' : section === 'transactions' ? 'transacciones.' : 'la academia.'}</em>
        </h1>
        {section === 'overview' && (
          <div className="admin-overview">
            <article>
              <b>{users.filter(u => u.rol === 'STUDENT').length}</b>
              <span>estudiantes registrados</span>
            </article>
            <article>
              <b>{payments.filter(p => p.estadoTransaccion === 'CONFIRMADA').length}</b>
              <span>pagos confirmados</span>
            </article>
            <article>
              <b>{users.filter(u => u.etapaComercial === 'PAYER').length}</b>
              <span>servicios activos</span>
            </article>
          </div>
        )}
        {section !== 'transactions' && usersTable}
        {section !== 'users' && paymentsTable}
        {detail && (
          <div className="modal">
            <div>
              <span>i</span>
              <p className="label">DETALLE DEL PAGO</p>
              <h2>{detail.plan.nombre}</h2>
              <p>
                {detail.codigoOperacion}
                <br />
                {detail.canalPago} · {money(detail.monto)}
                <br />
                {detail.estadoTransaccion}
              </p>
              <button onClick={() => setDetail(null)}>Cerrar</button>
            </div>
          </div>
        )}
        {progress && (
          <div className="modal">
            <div className="progress-modal">
              <span>✓</span>
              <p className="label">AVANCE DEL ESTUDIANTE</p>
              <h2>
                {progress.student.nombres} {progress.student.apellidos}
              </h2>
              <p>
                {progress.student.carreraInteres || 'Carrera aún no definida'} · {progress.student.etapaComercial}
              </p>
              <div className="progress-kpis">
                <div>
                  <b>{progress.academic.avanceSemanal}%</b>
                  <small>avance semanal</small>
                </div>
                <div>
                  <b>{progress.academic.horasEstudiadas} h</b>
                  <small>horas estudiadas</small>
                </div>
                <div>
                  <b>{progress.academic.actividadesCompletadas}</b>
                  <small>actividades listas</small>
                </div>
              </div>
              <div className="student-plan">
                <b>{progress.subscription?.plan?.nombre || 'Sin plan activo'}</b>
                <span>{progress.academic.proximaActividad || 'Aún no tiene actividades'}</span>
              </div>
              <button onClick={() => setProgress(null)}>Cerrar detalle</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  const routeFromHash = () => location.hash.slice(2).split('?')[0] || '';
  const [page, setPage] = useState(routeFromHash());
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(!!localStorage.token);
  const pendingSelection = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('pendingPlan') || 'null');
    } catch {
      return null;
    }
  })();
  const [plan, setPlan] = useState<Plan | null>(pendingSelection?.plan || null);
  const [semestral, setSemestral] = useState(!!pendingSelection?.semestral);

  const rememberPlan = (selectedPlan: Plan, selectedSemestral: boolean) => {
    setPlan(selectedPlan);
    setSemestral(selectedSemestral);
    sessionStorage.setItem('pendingPlan', JSON.stringify({ plan: selectedPlan, semestral: selectedSemestral }));
  };

  const clearPendingPlan = () => {
    setPlan(null);
    setSemestral(false);
    sessionStorage.removeItem('pendingPlan');
  };

  useEffect(() => {
    const on = () => setPage(routeFromHash());
    window.addEventListener('hashchange', on);

    if (localStorage.token) {
      setAuthLoading(true);
      api('/auth/me')
        .then(u => {
          setUser(u);
        })
        .catch(() => {
          localStorage.clear();
          setUser(null);
        })
        .finally(() => {
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }

    return () => window.removeEventListener('hashchange', on);
  }, []);

  const go = (p: string) => (location.hash = '/' + p);

  // Pantalla de carga suave mientras valida el token existente
  if (authLoading) {
    return (
      <div className="pre-loader-container">
        <div className="pre-spinner"></div>
        <div className="pre-loader-text">Cargando tu preparación UNT...</div>
      </div>
    );
  }

  if (page === 'login' || page === 'register') {
    return (
      <Auth
        mode={page as any}
        done={async u => {
          setUser(u);
          if (u.rol === 'ADMIN') return go('admin');
          if (u.rol === 'STUDENT' && plan?.diasPrueba) {
            try {
              await api('/trials/activate', 'POST');
              setUser(await api('/auth/me'));
            } catch (error: any) {
              alert(error.message);
            } finally {
              clearPendingPlan();
            }
            return go('dashboard');
          }
          if (u.rol === 'STUDENT' && plan) return go('checkout');
          go('dashboard');
        }}
      />
    );
  }

  if (page === 'plans') {
    return (
      <Plans
        user={user}
        go={go}
        select={async (p, semi) => {
          if (!user) {
            rememberPlan(p, semi);
            go('register');
            return;
          }
          if (p.diasPrueba) {
            try {
              await api('/trials/activate', 'POST');
              const refreshed = await api('/auth/me');
              setUser(refreshed);
              go('dashboard');
            } catch (e: any) {
              alert(e.message);
            }
            return;
          }
          rememberPlan(p, semi);
          go('checkout');
        }}
      />
    );
  }

  if (page === 'checkout' && plan && user) {
    return (
      <Checkout
        plan={plan}
        user={user}
        semestral={semestral}
        done={async () => {
          clearPendingPlan();
          setUser(await api('/auth/me'));
          go('dashboard');
        }}
      />
    );
  }

  if (page === 'stripe-success' && user) {
    return (
      <StripeSuccess
        go={go}
        done={async () => {
          clearPendingPlan();
          setUser(await api('/auth/me'));
          go('dashboard');
        }}
      />
    );
  }

  if (user?.rol === 'GUARDIAN') {
    if (page === 'payments') return <Payments go={go} user={user} />;
    if (page === 'profile') return <Profile user={user} go={go} updated={setUser} />;
    return <GuardianPortal user={user} go={go} />;
  }

  if (page === 'learning' && user) return <Learning user={user} go={go} />;
  if (page === 'payments' && user) return <Payments go={go} user={user} />;
  if (page === 'profile' && user) return <Profile user={user} go={go} updated={setUser} />;
  if (page === 'admin' && user?.rol === 'ADMIN') return <Admin section="overview" />;
  if (page === 'admin-users' && user?.rol === 'ADMIN') return <Admin section="users" />;
  if (page === 'admin-transactions' && user?.rol === 'ADMIN') return <Admin section="transactions" />;
  if (page === 'dashboard' && user) return <Dashboard user={user} go={go} />;

  return <Landing go={go} />;
}

createRoot(document.getElementById('root')!).render(<App />);
