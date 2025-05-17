
# Implementación del sistema de Socket.IO

## Arquitectura de Comunicación en Tiempo Real

### Configuración del Servidor (Backend)

La implementación de Socket.IO en el servidor se encuentra en el archivo `backend/socket/socketHandler.js`. Este módulo maneja todas las operaciones en tiempo real del sistema de chat y notificaciones.

### Inicialización

```javascript
// En backend/server.js
const socketIo = require('socket.io');
const socketHandler = require('./socket/socketHandler');

// Crear servidor HTTP y Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: corsOptions
});

// Autenticación de socket
io.use(authenticateSocketToken);

// Inicializar manejador de socket
const socketService = socketHandler(io);

// Guardar referencia para usar en controladores
app.set('socketService', socketService);
```

### Autenticación de Sockets

La autenticación se implementa mediante un middleware personalizado:

```javascript
// En backend/middleware/auth.js
const authenticateSocketToken = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Autenticación requerida'));

    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Token inválido'));
  }
};
```

## Gestión de Usuarios Conectados

```javascript
// En backend/socket/socketHandler.js
const connectedUsers = new Map(); // userId -> socketId

io.on('connection', async (socket) => {
  const userId = socket.user.id;
  connectedUsers.set(userId, socket.id);
  
  // Notificar a contactos que el usuario está en línea
  // ...
  
  socket.on('disconnect', () => {
    connectedUsers.delete(userId);
    // Notificar a contactos que el usuario está desconectado
    // ...
  });
});
```

## Eventos Principales del Sistema

### Envío de Mensajes

```javascript
socket.on('sendMessage', async (data) => {
  // Validar datos
  // Verificar permisos
  // Guardar mensaje en base de datos
  // Notificar a todos los participantes del chat
});
```

### Edición de Mensajes

```javascript
socket.on('editMessage', async (data) => {
  // Validar datos
  // Verificar propiedad del mensaje
  // Actualizar mensaje en base de datos
  // Notificar a todos los participantes del chat
});
```

### Eliminación de Mensajes

```javascript
socket.on('deleteMessage', async (data) => {
  // Validar datos
  // Verificar propiedad del mensaje
  // Marcar mensaje como eliminado en base de datos
  // Notificar a todos los participantes del chat
});
```

### Envío de Archivos

```javascript
socket.on('sendFile', async (data) => {
  // Validar datos
  // Extraer contenido del archivo (base64)
  // Guardar archivo en base de datos
  // Crear mensaje asociado al archivo
  // Notificar a todos los participantes del chat
});
```

## Implementación en el Cliente (Frontend)

La implementación en el cliente se encuentra en `src/contexts/ChatContext.tsx`, que proporciona un contexto de React para gestionar todas las operaciones de chat.

### Conexión del Socket

```typescript
// En src/contexts/ChatContext.tsx
useEffect(() => {
  if (!currentUser) return;
  
  const token = localStorage.getItem('token');
  if (!token) return;
  
  const socket = io(BACKEND_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000
  });
  
  socket.on('connect', () => {
    setIsConnected(true);
  });
  
  socket.on('connect_error', (err) => {
    setIsConnected(false);
    setError('Error de conexión al servidor de chat');
  });
  
  // Configurar listeners para eventos
  socket.on('chat:message', handleNewMessage);
  socket.on('chat:message:update', handleMessageUpdate);
  socket.on('chat:message:delete', handleMessageDelete);
  socket.on('chat:new', handleNewChat);
  
  socketRef.current = socket;
  
  return () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };
}, [currentUser]);
```

### Manejadores de Eventos

```typescript
// En src/contexts/ChatContext.tsx
const handleNewMessage = (message: MessageType) => {
  // Actualizar lista de mensajes si corresponde al chat activo
  // Actualizar contador de no leídos si es necesario
  // Mostrar notificación si corresponde
  // Actualizar último mensaje en lista de chats
};

const handleMessageUpdate = (updatedMessage: MessageType) => {
  // Actualizar mensaje en lista de mensajes activos
  // Actualizar en lista de chats si es el último mensaje
};

const handleMessageDelete = (messageId: string) => {
  // Eliminar mensaje de lista de mensajes activos
  // Actualizar lista de chats si era el último mensaje
};
```

### Envío de Mensajes y Archivos

```typescript
// En src/contexts/ChatContext.tsx
const sendMessage = async (chatId: string, content: string): Promise<void> => {
  // Si el socket está conectado, usar socket.io
  if (socketRef.current && socketRef.current.connected) {
    socketRef.current.emit('sendMessage', { chatId, content });
  } else {
    // Fallback a API REST
    await messageService.sendMessage(chatId, content);
    // Refrescar mensajes
    loadMessages(chatId);
  }
};

const sendFile = async (chatId: string, file: File): Promise<void> => {
  // Leer archivo y convertir a base64
  // Enviar mediante socket.io o fallback a API REST
};
```

## Optimizaciones

### Manejo de Reconexiones

Socket.IO maneja automáticamente los intentos de reconexión cuando se pierde la conexión:

```typescript
const socket = io(BACKEND_URL, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
```

### Fallback a API REST

Para garantizar que los mensajes siempre se envíen, incluso si la conexión Socket.IO falla:

```typescript
if (socketRef.current && socketRef.current.connected) {
  // Usar socket para envío en tiempo real
  socketRef.current.emit('sendMessage', { chatId, content });
} else {
  // Fallback a API HTTP tradicional
  await messageService.sendMessage(chatId, content);
}
```

## Seguridad

### Autenticación de Sockets

Cada conexión de socket requiere un token JWT válido:

```typescript
// Cliente
const socket = io(BACKEND_URL, {
  auth: { token: localStorage.getItem('token') }
});

// Servidor
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verificar token...
});
```

### Verificación de Permisos

Antes de cada operación se verifica que el usuario tenga los permisos necesarios:

```javascript
// Ejemplo: Verificar si es participante del chat
const isParticipant = await chatModel.isParticipant(chatId, userId);
if (!isParticipant) {
  socket.emit('error', { message: 'No eres participante de este chat' });
  return;
}

// Ejemplo: Verificar propiedad del mensaje
if (message.userId !== userId) {
  socket.emit('error', { message: 'No tienes permiso para editar este mensaje' });
  return;
}
```

## Integración con el Resto de la Aplicación

El sistema Socket.IO está completamente integrado con la aplicación:

- Los componentes de React usan el contexto `ChatContext` para acceder a todas las funcionalidades
- Los controladores de API pueden enviar notificaciones usando el servicio de socket
- El sistema de autenticación comparte el mismo mecanismo JWT

Esta arquitectura proporciona una experiencia en tiempo real fluida mientras mantiene la compatibilidad con enfoques tradicionales cuando es necesario.
