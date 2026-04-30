# Shalom App

Aplicación web para la comunidad Shalom con herramientas de gestión organizadas por roles.

## Tecnologías

| Capa | Stack |
|------|-------|
| **Framework** | Next.js 16 (App Router) |
| **Lenguaje** | TypeScript |
| **UI** | React 19 + Tailwind CSS 4 + Framer Motion |
| **Base de datos** | PostgreSQL (Neon Serverless) |
| **Autenticación** | JWT + bcryptjs |
| **Iconos** | Lucide React |
| **PDF** | jsPDF + jspdf-autotable |

## Características

### Autenticación

- Login con email y contraseña
- Tres roles de usuario: **Admin**, **Líder** y **Miembro**
- Protección de rutas según rol
- Sesión persistente con cookies HTTP-only (7 días)

### Checklist

- Crear listas personalizadas con título y emoji
- Agregar, completar y eliminar elementos
- Barra de progreso por lista
- Vista general con tarjetas y porcentaje de avance

### Retiro

- **Presupuesto**: calculadora de costos para retiros con materiales predefinidos
- Edición de unidades y precio por unidad
- Cálculo automático del total general
- Exportación a PDF
- Persistencia en `localStorage`

### Administración (solo Admin)

- Gestión completa de usuarios
- Crear, editar roles, activar/desactivar y eliminar cuentas
- Panel con estadísticas por rol

## Estructura del proyecto

```
app/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout root + navegación inferior
│   │   ├── page.tsx                # Redirect a /checklist
│   │   ├── globals.css             # Tema dark + Tailwind config
│   │   ├── login/page.tsx          # Página de login
│   │   ├── checklist/page.tsx      # Módulo de checklists
│   │   ├── retiro/
│   │   │   ├── page.tsx            # Hub de herramientas de retiro
│   │   │   └── presupuesto/page.tsx # Calculadora de presupuesto
│   │   ├── admin/page.tsx          # Panel de administración
│   │   └── api/
│   │       ├── auth/               # Login, registro, logout, me
│   │       ├── checklists/         # CRUD checklists + items
│   │       └── users/              # Gestión de usuarios
│   └── lib/
│       ├── auth.ts                 # Lógica de autenticación (server)
│       ├── auth-context.tsx        # Contexto de auth (client)
│       └── db.ts                   # Cliente Neon serverless
├── public/                         # Assets estáticos
├── package.json
└── tsconfig.json
```

## Instalación

1. Clonar el repositorio

```bash
git clone <repo-url>
cd shalom/app
```

2. Instalar dependencias

```bash
npm install
```

3. Configurar variables de entorno

Crear un archivo `.env.local` con:

```
DATABASE_URL=postgres://...
JWT_SECRET=tu-secret-aqui
```

4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con Turbopack |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Ejecutar ESLint |

## Control de acceso

| Ruta | Miembro | Líder | Admin |
|---------|---------|-------|-------|
| `/checklist` | ✅ | ✅ | ✅ |
| `/retiro` | ❌ | ✅ | ✅ |
| `/admin` | ❌ | ❌ | ✅ |

## Diseño

- Tema dark con paleta personalizada
- Mobile-first con navegación inferior tipo app nativa
- Animaciones con Framer Motion
- Tipografía Inter
