# API de Fabrimasa

API para el sistema de capacitaciones de Fabrimasa, desarrollada con Node.js, Express y MySQL.

## Descripción

Esta API permite gestionar un sistema de capacitaciones por Zoom donde los usuarios de empresas pueden ver videos y documentos relacionados con certificaciones específicas.

## Características

- Autenticación con JWT para usuarios administradores, revisores y clientes
- Gestión de roles y permisos
- Gestión de empresas
- Gestión de certificaciones (formaciones)
- Gestión de videos y documentos
- Gestión de clientes y sus relaciones con empresas y certificaciones

## Requisitos

- Node.js 14.x o superior
- MySQL 5.7 o superior

## Instalación

1. Clonar el repositorio:
```
git clone <url-del-repositorio>
cd api-fabrima
```

2. Instalar dependencias:
```
npm install
```

3. Configurar variables de entorno:
Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:
```
DB_HOST=162.241.62.48
DB_USER=fpaviega
DB_PASSWORD=*$S8TNhGEi,R
DB_NAME=driedfru_bd_fabrimasa
DB_PORT=3036
PORT=3000
NODE_ENV=development
JWT_SECRET=secreto_jwt_para_fabrimasa_2024
JWT_EXPIRES_IN=24h
```

4. Iniciar el servidor:
```
npm start
```

Para desarrollo:
```
npm run dev
```

## Estructura del Proyecto

```
api-fabrima/
├── src/
│   ├── config/         # Configuración de la base de datos
│   ├── controllers/    # Controladores
│   ├── middleware/     # Middleware (autenticación, etc.)
│   ├── models/         # Modelos
│   ├── routes/         # Rutas
│   ├── utils/          # Utilidades
│   └── app.js          # Aplicación Express
├── .env                # Variables de entorno
├── index.js            # Punto de entrada
└── package.json        # Dependencias y scripts
```

## Endpoints

### Autenticación

- `POST /api/auth/login` - Login para usuarios (admin/revisor)
- `POST /api/auth/login/cliente` - Login para clientes

### Roles

- `GET /api/roles` - Obtener todos los roles
- `GET /api/roles/:id` - Obtener un rol por ID
- `POST /api/roles` - Crear un nuevo rol (admin)
- `PUT /api/roles/:id` - Actualizar un rol (admin)
- `DELETE /api/roles/:id` - Eliminar un rol (admin)

### Usuarios

- `GET /api/usuarios` - Obtener todos los usuarios (admin)
- `GET /api/usuarios/:id` - Obtener un usuario por ID (admin)
- `POST /api/usuarios` - Crear un nuevo usuario (admin)
- `PUT /api/usuarios/:id` - Actualizar un usuario (admin)
- `DELETE /api/usuarios/:id` - Eliminar un usuario (admin)

## Licencia

Este proyecto es privado y de uso exclusivo para Fabrimasa.
# backend-eduardo
