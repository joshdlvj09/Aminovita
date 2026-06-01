# AMINOVITA 🧪

Plataforma web para la distribución y catálogo de productos químicos de alta pureza.

## Tecnologías

**Frontend:** HTML5 · CSS3 · Bootstrap 5 · Vanilla JS  
**Backend:** Node.js · Express · MongoDB (Atlas) · JWT · Nodemailer

---

## Estructura del Proyecto

```
AMINOVITA/
├── html/               # Páginas del sitio
│   ├── index.html
│   ├── nosotros.html
│   ├── productos.html
│   ├── contacto.html
│   ├── login.html
│   ├── registro.html
│   ├── perfil.html
│   ├── favoritos.html
│   ├── detalles.html   # Panel de admin por producto
│   └── reset.html
├── css/                # Estilos por página / globales
│   ├── style.css       ← estilos globales
│   ├── auth.css        ← login y registro
│   ├── perfil.css
│   ├── favoritos.css
│   ├── productos.css
│   └── reset.css
├── assets/
│   ├── js/             # Scripts por página
│   │   ├── auth.js     ← sesión global (se carga en todas las páginas)
│   │   ├── login.js
│   │   ├── registro.js
│   │   ├── productos.js
│   │   ├── favoritos.js
│   │   ├── perfil.js
│   │   ├── detalles.js
│   │   ├── contacto.js
│   │   └── reset.js
│   └── img/
│       ├── iconos/
│       └── productos/
└── backend/
    ├── server.js
    ├── .env.example    ← plantilla de variables de entorno
    ├── controllers/
    ├── models/
    ├── routes/
    └── middleware/
```

---

## Instalación y uso

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/aminovita.git
cd aminovita
```

### 2. Configurar el backend

```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tus credenciales reales
```

### 3. Iniciar el servidor

```bash
npm start
# El servidor corre en http://localhost:4000
```

### 4. Abrir el frontend

Abre `html/index.html` directamente en el navegador o usa Live Server en VS Code.

---

## Variables de entorno

Copia `backend/.env.example` a `backend/.env` y llena los valores:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (por defecto 4000) |
| `MONGO_URI` | URI de conexión a MongoDB Atlas |
| `JWT_SECRET` | Clave secreta para firmar tokens |
| `EMAIL_USER` | Correo de Gmail para envío de notificaciones |
| `EMAIL_PASS` | App Password de Gmail (no la contraseña normal) |

> ⚠️ **Nunca subas el archivo `.env` a GitHub.** Ya está protegido en `.gitignore`.

---

## Funcionalidades

- Catálogo de productos con búsqueda y paginación
- Registro con verificación por código de correo
- Inicio de sesión con JWT
- Recuperación de contraseña por email
- Panel de administración de productos (agregar, editar, eliminar)
- Lista de favoritos por usuario
- Perfil de usuario

---

&copy; 2026 Aminovita y Químicos.
