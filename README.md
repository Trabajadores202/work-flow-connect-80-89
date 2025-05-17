
# WorkFlowConnect - Documentación del Proyecto

## Descripción General
WorkFlowConnect es una plataforma que conecta freelancers con clientes, permitiéndoles encontrar oportunidades de trabajo, comunicarse a través de un sistema de chat en tiempo real, y gestionar perfiles profesionales.

## Estructura del Backend

### Organización y Evolución

El backend se desarrolló siguiendo una arquitectura modular, con las siguientes etapas:

1. **Configuración Inicial**: Creación del servidor Express, conexión a la base de datos PostgreSQL y configuración de middleware.
2. **Implementación de Autenticación**: Sistema de registro e inicio de sesión con tokens JWT.
3. **Desarrollo de Modelos de Datos**: Definición de las tablas en la base de datos y funciones CRUD.
4. **Implementación de API REST**: Desarrollo de controladores y rutas HTTP.
5. **Integración de Socket.IO**: Adición de funcionalidades en tiempo real para el chat.
6. **Manejo de Archivos**: Implementación del sistema de subida y descarga de archivos.

### Estructura de Carpetas

- **`/backend/config`**: Configuración de la base de datos y conexiones.
  - `database.js`: Establece la conexión con PostgreSQL.

- **`/backend/controllers`**: Controladores que manejan la lógica de negocio.
  - `authController.js`: Gestiona registro, login y verificación de usuarios.
  - `chatController.js`: Maneja la creación y gestión de conversaciones.
  - `messageController.js`: Controla el envío, edición y eliminación de mensajes.
  - `fileController.js`: Gestiona la subida y descarga de archivos.
  - `userController.js`: Maneja operaciones relacionadas con perfiles de usuario.
  - `jobController.js`: Gestiona publicaciones de trabajos y aplicaciones.

- **`/backend/models`**: Interacción con la base de datos.
  - `userModel.js`: Operaciones CRUD para usuarios.
  - `chatModel.js`: Operaciones para chats y participantes.
  - `messageModel.js`: Operaciones para mensajes.
  - `fileModel.js`: Operaciones para archivos.
  - `jobModel.js`: Operaciones para trabajos.
  - `db.sql`: Definición del esquema de la base de datos.

- **`/backend/middleware`**: Middleware de la aplicación.
  - `auth.js`: Autenticación de JWT para rutas API y sockets.

- **`/backend/routes`**: Definición de rutas HTTP.
  - `authRoutes.js`: Rutas de autenticación.
  - `chatRoutes.js`: Rutas de gestión de chats.
  - `messageRoutes.js`: Rutas para mensajes.
  - `fileRoutes.js`: Rutas para archivos.
  - `userRoutes.js`: Rutas para usuarios.
  - `jobRoutes.js`: Rutas para trabajos.

- **`/backend/socket`**: Implementación de WebSockets.
  - `socketHandler.js`: Gestiona conexiones y eventos en tiempo real.

- **`/backend/scripts`**: Scripts de utilidad.
  - `checkDbSchema.js`: Verifica y actualiza el esquema de la base de datos.
  - `initDb.js`: Inicializa la base de datos con datos de prueba.

### Implementación de Socket.IO

El sistema de comunicación en tiempo real se implementa a través de Socket.IO:

1. **Conexión y Autenticación**:
   - Los usuarios se autentican mediante un token JWT.
   - Al conectarse, se registra su estado online y se actualiza en la base de datos.

2. **Eventos Principales**:
   - `connection/disconnect`: Maneja conexiones y desconexiones de usuarios.
   - `sendMessage`: Envía mensajes en tiempo real.
   - `editMessage`: Permite editar mensajes existentes.
   - `deleteMessage`: Elimina mensajes.
   - `sendFile`: Maneja la transferencia de archivos.

3. **Gestión de Usuarios Conectados**:
   - Se mantiene un mapa (`connectedUsers`) que relaciona IDs de usuario con IDs de socket.
   - Permite enviar notificaciones específicas a los usuarios correctos.

4. **Integración con API REST**:
   - Los eventos de socket y las operaciones REST comparten modelos y lógica.
   - El servicio de socket se expone a través del objeto de aplicación Express para notificaciones desde rutas API.

## Estructura del Frontend

### Organización

- **`/src/contexts`**: Proveedores de contexto para gestión de estado.
  - `AuthContext.tsx`: Gestiona el estado de autenticación.
  - `ChatContext.tsx`: Maneja funcionalidades de chat y mensajes.
  - `JobContext.tsx`: Administra listados de trabajos.
  - `DataContext.tsx`: Gestión de datos globales.
  - `ThemeContext.tsx`: Controla el tema de la aplicación.

- **`/src/components`**: Componentes reutilizables.
  - `/ui`: Componentes de interfaz basados en shadcn/ui.
  - `Layout/MainLayout.tsx`: Estructura principal de la aplicación.
  - Componentes específicos para chat, formularios, etc.

- **`/src/pages`**: Páginas principales de la aplicación.
  - `Index.tsx`: Página de inicio.
  - `Login.tsx` y `Register.tsx`: Páginas de autenticación.
  - `Dashboard.tsx`: Panel de control del usuario.
  - `JobsPage.tsx` y `JobDetail.tsx`: Listado y detalles de trabajos.
  - `ChatsPage.tsx`: Interfaz de mensajería.
  - `ProfilePage.tsx` y `UserProfile.tsx`: Páginas de perfil.

- **`/src/services`**: Servicios para comunicación con el backend.
  - `api.ts`: Configuración de Axios y funciones para llamadas a la API.

- **`/src/hooks`**: Hooks personalizados.
  - `use-mobile.tsx`: Detecta dispositivos móviles.
  - `use-toast.ts`: Manejo de notificaciones toast.

- **`/src/lib`**: Utilidades y configuraciones.
  - `utils.ts`: Funciones de utilidad.
  - `initializeFirebase.js`: Inicialización de Firebase (alternativa/complemento).

- **`/src/types`**: Definiciones de tipos TypeScript.
  - `index.ts`: Tipos para usuarios, mensajes, trabajos, etc.

### Implementación de Comunicación con Socket.IO

El frontend implementa la comunicación en tiempo real de la siguiente manera:

1. **Conexión y Configuración**:
   - Se establece la conexión en el contexto de chat (`ChatContext.tsx`).
   - Se envía el token JWT para autenticación.

2. **Manejo de Eventos**:
   - Se configuran listeners para eventos como `chat:message`, `chat:message:update`, etc.
   - Actualización del estado de React cuando se reciben eventos.

3. **Emisión de Eventos**:
   - Envío de mensajes a través de socket en lugar de HTTP para mayor velocidad.
   - Implementación de fallback a HTTP en caso de fallos en la conexión socket.

4. **Gestión de Estado**:
   - Los mensajes recibidos vía socket se integran en el estado de React.
   - Optimistic UI: Actualización inmediata de la interfaz antes de la confirmación del servidor.

## Flujo de Datos

1. **Autenticación**:
   - El usuario se registra/inicia sesión y recibe un token JWT.
   - El token se almacena en localStorage y se usa para autenticar solicitudes HTTP y conexiones socket.

2. **Comunicación en Tiempo Real**:
   - Al enviar un mensaje, el cliente emite un evento `sendMessage` por socket.
   - El servidor procesa el mensaje, lo guarda en la base de datos y lo reenvía a todos los participantes del chat.
   - Los clientes reciben el mensaje vía evento `chat:message` y actualizan la UI.

3. **Sistema de Archivos**:
   - Los archivos se convierten a base64, se transmiten vía socket y se almacenan como BYTEA en PostgreSQL.
   - Los archivos se sirven vía endpoints HTTP con autenticación.

## Arquitectura General

WorkFlowConnect utiliza una arquitectura cliente-servidor donde:

- **Backend**: Node.js + Express + Socket.IO + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui

La comunicación se realiza a través de:
- API REST para operaciones CRUD estándar
- WebSockets para actualizaciones en tiempo real

Este enfoque híbrido permite tanto operaciones tradicionales como experiencias de usuario inmersivas y reactivas.

## Instalación y Ejecución

### Backend
```bash
cd backend
npm install
# Configurar variables de entorno en .env
npm run start
```

### Frontend
```bash
npm install
npm run dev
```

## Variables de Entorno Requeridas

Para el backend (crear archivo `.env` en carpeta `/backend`):
```
PORT=5000
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRES_IN=30d
POSTGRES_URI=postgres://usuario:contraseña@host:puerto/basededatos
```
