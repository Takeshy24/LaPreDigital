# La PRE Digital

Plataforma full-stack de preparación para la UNT con React, Vite, Express, Prisma y PostgreSQL. Incluye estudiantes, apoderados y administradores; planes con control de acceso; aula interactiva; perfil; pagos; Stripe Checkout; panel administrativo y reportes.

## Requisitos

- Node.js 20 o 22.
- PostgreSQL 14 o superior.
- Una cuenta de Stripe para probar pagos con tarjeta.

## Desarrollo local

1. Crea la base de datos `lapredigital` en PostgreSQL.
2. Copia `backend/.env.example` como `backend/.env` y completa sus valores.
3. Copia `frontend/.env.example` como `frontend/.env`.
4. Instala y prepara el proyecto:

   ```bash
   npm install
   npm run db:deploy
   npm run db:seed
   ```

5. Inicia frontend y backend:

   ```bash
   npm run dev
   ```

Frontend: `http://localhost:5173`. API: `http://localhost:4000`. En desarrollo, si no defines otras credenciales, el seed crea `admin@lapredigital.pe` con `Admin123!`. No uses esa clave en producción.

## Verificación antes de publicar

```bash
npm ci
npm run build
npm run db:deploy
npm run db:seed
npm start
```

Comprueba `http://localhost:4000/api/health`. En producción, Express sirve también el frontend compilado; `VITE_API_URL` debe ser `/api`.

## Deploy recomendado en Render, sin Docker

El repositorio incluye `render.yaml`, que crea un Web Service Node y PostgreSQL, ejecuta migraciones, carga los planes y publica frontend y API desde el mismo dominio.

### 1. Subir el proyecto a GitHub

Desde la raíz del proyecto:

```bash
git init
git add .
git commit -m "Preparar La PRE Digital para producción"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

Antes de `git add`, confirma con `git status` que `backend/.env` no aparezca. Las claves y contraseñas nunca deben subirse al repositorio.

### 2. Crear la aplicación en Render

1. Entra a [Render](https://dashboard.render.com/) e inicia sesión.
2. Selecciona **New > Blueprint**.
3. Conecta GitHub y elige este repositorio.
4. Render detectará `render.yaml`. Pulsa **Apply**.
5. Cuando solicite secretos, completa:
   - `ADMIN_EMAIL`: correo del administrador.
   - `ADMIN_PASSWORD`: clave única de al menos 10 caracteres.
   - `STRIPE_SECRET_KEY`: una clave `sk_test_...` mientras estés en pruebas.
   - `STRIPE_WEBHOOK_SECRET`: puedes dejarlo vacío en el primer despliegue y completarlo en el paso siguiente.
6. Espera a que la base de datos y el servicio `la-pre-digital` queden en estado **Live**.
7. Abre la URL `https://la-pre-digital...onrender.com` asignada por Render.

El Blueprint configura automáticamente `DATABASE_URL`, genera un `JWT_SECRET`, compila con `VITE_API_URL=/api`, ejecuta `prisma migrate deploy`, carga el seed y verifica `/api/health`.

### 3. Configurar el webhook de Stripe

1. En Stripe, mantén activado **Test mode**.
2. Abre **Developers/Workbench > Webhooks** y crea un endpoint.
3. Usa esta URL, reemplazando el dominio:

   ```text
   https://TU-DOMINIO.onrender.com/api/payments/stripe/webhook
   ```

4. Suscribe los eventos `checkout.session.completed` y `checkout.session.expired`.
5. Copia el secreto `whsec_...`.
6. En Render abre el servicio > **Environment**, asigna ese valor a `STRIPE_WEBHOOK_SECRET` y guarda. Render desplegará nuevamente.

Para la prueba de Checkout usa la tarjeta `4242 4242 4242 4242`, una fecha futura y cualquier CVC. La activación definitiva del servicio se procesa en el backend y el webhook es idempotente.

### 4. Verificación del deploy

1. Abre `https://TU-DOMINIO/api/health`; debe responder `{"ok":true,"database":"connected"}`.
2. Registra un estudiante nuevo.
3. Activa la prueba gratuita y confirma que aparezca en **Planes y servicios**.
4. Compra un plan con Stripe en modo prueba.
5. Confirma que el usuario entre a su aula y que el pago figure en **Mis pagos**.
6. Inicia sesión como administrador y revisa **Usuarios** y **Transacciones**.
7. Comprueba el flujo de un apoderado y la vinculación del estudiante.

### 5. Dominio propio

1. En Render abre **Settings > Custom Domains** y agrega tu dominio.
2. Crea los registros DNS que Render indique.
3. En **Environment** agrega `FRONTEND_URL=https://tu-dominio.com`.
4. Cambia el endpoint del webhook en Stripe al nuevo dominio.
5. Vuelve a desplegar y repite la verificación anterior.

## Paso de demo a producción real

- Cambia `STRIPE_SECRET_KEY` de `sk_test_...` a `sk_live_...` solamente cuando la cuenta Stripe esté verificada y hayas probado todo.
- Crea un webhook separado en modo Live y reemplaza `STRIPE_WEBHOOK_SECRET` por su nuevo `whsec_...`.
- Yape y Plin continúan siendo flujos demostrativos; no deben aceptar dinero real hasta integrar un proveedor que confirme pagos mediante webhooks firmados.
- Usa un plan PostgreSQL persistente para datos reales. El plan gratuito de Render es solo para demostración y caduca.
- Configura copias de seguridad, monitoreo, correo transaccional y políticas legales antes de recibir usuarios reales.

## Variables de producción

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Conexión PostgreSQL; Render la enlaza automáticamente. |
| `JWT_SECRET` | Firma de sesiones; obligatoria en producción. |
| `NODE_ENV` | Debe ser `production`. |
| `VITE_API_URL` | Debe ser `/api` para el despliegue unificado. |
| `FRONTEND_URL` | Solo necesaria al usar un dominio propio o frontend separado. |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe; nunca se expone al navegador. |
| `STRIPE_WEBHOOK_SECRET` | Verifica la firma de eventos de Stripe. |
| `ADMIN_EMAIL` | Correo de acceso administrativo inicial. |
| `ADMIN_PASSWORD` | Clave administrativa segura, mínimo 10 caracteres. |

