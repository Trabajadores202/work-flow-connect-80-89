
/**
 * Manejador de conexiones Socket.io
 * 
 * Este módulo implementa toda la funcionalidad de comunicación en tiempo real
 * Gestiona las conexiones de usuarios, mensajes, y notificaciones
 */

const { v4: uuidv4 } = require('uuid');
const chatModel = require('../models/chatModel');
const messageModel = require('../models/messageModel');
const fileModel = require('../models/fileModel');
const userModel = require('../models/userModel');

/**
 * Inicializa el servicio de WebSockets
 * @param {Object} io - Instancia de Socket.io
 * @returns {Object} Objeto con funciones del servicio socket
 */
module.exports = (io) => {
  // Mapa para rastrear usuarios conectados: userId -> socketId
  const connectedUsers = new Map();
  
  // Manejador de conexiones nuevas
  io.on('connection', async (socket) => {
    // Extraer el usuario del middleware de autenticación
    const userId = socket.user.id;
    const userName = socket.user.username || socket.user.name;
    
    console.log(`Usuario conectado: ${userName} (${userId})`);
    
    // Registrar socket en el mapa de usuarios conectados
    connectedUsers.set(userId, socket.id);
    
    /**
     * Notificar a todos los participantes de los chats del usuario
     * que el usuario está en línea
     */
    try {
      // Obtener chats del usuario
      const userChats = await chatModel.getUserChats(userId);
      
      // Para cada chat, notificar a los participantes
      for (const chat of userChats) {
        // Obtener participantes que no sean el usuario actual
        const otherParticipants = chat.participants.filter(p => p !== userId);
        
        // Para cada participante, si está conectado, notificar
        otherParticipants.forEach(participantId => {
          const participantSocketId = connectedUsers.get(participantId);
          if (participantSocketId) {
            io.to(participantSocketId).emit('user:online', { userId });
          }
        });
      }
    } catch (error) {
      console.error('Error notificando estado en línea:', error);
    }
    
    /**
     * Manejar envío de mensaje
     * Guarda el mensaje en la base de datos y lo envía a todos los participantes
     */
    socket.on('sendMessage', async (data) => {
      try {
        const { chatId, content } = data;
        
        // Validar datos requeridos
        if (!chatId || !content) {
          socket.emit('error', { message: 'Datos incompletos para enviar mensaje' });
          return;
        }
        
        // Verificar que el usuario es participante del chat
        const isParticipant = await chatModel.isParticipant(chatId, userId);
        if (!isParticipant) {
          socket.emit('error', { message: 'No eres participante de este chat' });
          return;
        }
        
        // Crear mensaje en la base de datos
        const messageId = uuidv4();
        const message = {
          id: messageId,
          content,
          chatId,
          userId,
          read: false,
          deleted: false,
          edited: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await messageModel.createMessage(message);
        
        // Actualizar la fecha del último mensaje del chat
        await chatModel.updateLastMessageTime(chatId);
        
        // Notificar a todos los participantes del chat
        const participants = await chatModel.getChatParticipants(chatId);
        
        // Enviar mensaje a todos los participantes conectados
        participants.forEach(participantId => {
          const participantSocket = connectedUsers.get(participantId);
          if (participantSocket) {
            io.to(participantSocket).emit('chat:message', message);
          }
        });
        
        console.log(`Mensaje enviado en chat ${chatId} por ${userId}`);
      } catch (error) {
        console.error('Error enviando mensaje:', error);
        socket.emit('error', { message: 'Error al enviar mensaje' });
      }
    });
    
    /**
     * Manejar edición de mensaje
     * Actualiza un mensaje existente y notifica a participantes
     */
    socket.on('editMessage', async (data) => {
      try {
        const { messageId, content } = data;
        
        // Validar datos
        if (!messageId || !content) {
          socket.emit('error', { message: 'Datos incompletos para editar mensaje' });
          return;
        }
        
        // Obtener mensaje original
        const originalMessage = await messageModel.getMessageById(messageId);
        
        // Verificar propiedad del mensaje
        if (originalMessage.userId !== userId) {
          socket.emit('error', { message: 'No tienes permiso para editar este mensaje' });
          return;
        }
        
        // Actualizar mensaje
        const updatedMessage = {
          ...originalMessage,
          content,
          edited: true,
          updatedAt: new Date()
        };
        
        await messageModel.updateMessage(messageId, { content, edited: true });
        
        // Notificar a participantes
        const participants = await chatModel.getChatParticipants(originalMessage.chatId);
        
        participants.forEach(participantId => {
          const participantSocket = connectedUsers.get(participantId);
          if (participantSocket) {
            io.to(participantSocket).emit('chat:message:update', updatedMessage);
          }
        });
        
        console.log(`Mensaje ${messageId} editado por ${userId}`);
      } catch (error) {
        console.error('Error editando mensaje:', error);
        socket.emit('error', { message: 'Error al editar mensaje' });
      }
    });
    
    /**
     * Manejar eliminación de mensaje
     * Marca un mensaje como eliminado y notifica a participantes
     */
    socket.on('deleteMessage', async (data) => {
      try {
        const { messageId } = data;
        
        // Validar datos
        if (!messageId) {
          socket.emit('error', { message: 'ID de mensaje requerido' });
          return;
        }
        
        // Obtener mensaje original
        const originalMessage = await messageModel.getMessageById(messageId);
        
        // Verificar propiedad del mensaje
        if (originalMessage.userId !== userId) {
          socket.emit('error', { message: 'No tienes permiso para eliminar este mensaje' });
          return;
        }
        
        // Marcar como eliminado
        await messageModel.updateMessage(messageId, { deleted: true });
        
        // Notificar a participantes
        const participants = await chatModel.getChatParticipants(originalMessage.chatId);
        
        participants.forEach(participantId => {
          const participantSocket = connectedUsers.get(participantId);
          if (participantSocket) {
            io.to(participantSocket).emit('chat:message:delete', messageId);
          }
        });
        
        console.log(`Mensaje ${messageId} eliminado por ${userId}`);
      } catch (error) {
        console.error('Error eliminando mensaje:', error);
        socket.emit('error', { message: 'Error al eliminar mensaje' });
      }
    });
    
    /**
     * Manejar envío de archivos
     * Guarda el archivo en la base de datos y envía notificación
     */
    socket.on('sendFile', async (data) => {
      try {
        const { chatId, filename, contentType, size, data: fileData } = data;
        
        // Validar datos
        if (!chatId || !filename || !fileData) {
          socket.emit('error', { message: 'Datos incompletos para enviar archivo' });
          return;
        }
        
        // Verificar que el usuario es participante del chat
        const isParticipant = await chatModel.isParticipant(chatId, userId);
        if (!isParticipant) {
          socket.emit('error', { message: 'No eres participante de este chat' });
          return;
        }
        
        // Extraer base64 del data URI
        const matches = fileData.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          socket.emit('error', { message: 'Formato de archivo inválido' });
          return;
        }
        
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Guardar archivo en la base de datos
        const fileId = await fileModel.saveFile({
          filename,
          content_type: contentType || 'application/octet-stream',
          size: size || buffer.length,
          data: buffer,
          uploaded_by: userId
        });
        
        // Crear mensaje asociado al archivo
        const messageId = uuidv4();
        const message = {
          id: messageId,
          content: `Archivo: ${filename}`,
          chatId,
          userId,
          read: false,
          deleted: false,
          edited: false,
          fileId,
          fileName: filename,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await messageModel.createMessage(message);
        
        // Actualizar la fecha del último mensaje del chat
        await chatModel.updateLastMessageTime(chatId);
        
        // Notificar a todos los participantes del chat
        const participants = await chatModel.getChatParticipants(chatId);
        
        participants.forEach(participantId => {
          const participantSocket = connectedUsers.get(participantId);
          if (participantSocket) {
            io.to(participantSocket).emit('chat:message', message);
          }
        });
        
        console.log(`Archivo ${filename} enviado en chat ${chatId} por ${userId}`);
      } catch (error) {
        console.error('Error enviando archivo:', error);
        socket.emit('error', { message: 'Error al enviar archivo' });
      }
    });
    
    /**
     * Manejar desconexión del usuario
     * Actualiza el estado y notifica a los contactos
     */
    socket.on('disconnect', async () => {
      console.log(`Usuario desconectado: ${userName} (${userId})`);
      
      // Eliminar del mapa de conexiones
      connectedUsers.delete(userId);
      
      try {
        // Obtener chats del usuario
        const userChats = await chatModel.getUserChats(userId);
        
        // Para cada chat, notificar a los participantes
        for (const chat of userChats) {
          // Obtener participantes que no sean el usuario actual
          const otherParticipants = chat.participants.filter(p => p !== userId);
          
          // Para cada participante, si está conectado, notificar
          otherParticipants.forEach(participantId => {
            const participantSocketId = connectedUsers.get(participantId);
            if (participantSocketId) {
              io.to(participantSocketId).emit('user:offline', { userId });
            }
          });
        }
      } catch (error) {
        console.error('Error notificando estado fuera de línea:', error);
      }
    });
  });
  
  /**
   * Expone funciones del servicio socket para uso desde controladores API
   */
  return {
    /**
     * Notifica a un usuario específico
     * @param {String} userId - ID del usuario a notificar
     * @param {String} event - Nombre del evento
     * @param {Object} data - Datos del evento
     */
    notifyUser: (userId, event, data) => {
      const socketId = connectedUsers.get(userId);
      if (socketId) {
        io.to(socketId).emit(event, data);
      }
    },
    
    /**
     * Notifica a todos los participantes de un chat
     * @param {String} chatId - ID del chat
     * @param {String} event - Nombre del evento
     * @param {Object} data - Datos del evento
     */
    notifyChat: async (chatId, event, data) => {
      try {
        const participants = await chatModel.getChatParticipants(chatId);
        
        participants.forEach(participantId => {
          const socketId = connectedUsers.get(participantId);
          if (socketId) {
            io.to(socketId).emit(event, data);
          }
        });
      } catch (error) {
        console.error(`Error notificando chat ${chatId}:`, error);
      }
    },
    
    /**
     * Verifica si un usuario está conectado
     * @param {String} userId - ID del usuario
     * @returns {Boolean} - true si está conectado
     */
    isUserConnected: (userId) => {
      return connectedUsers.has(userId);
    },
    
    /**
     * Obtiene todos los usuarios conectados
     * @returns {String[]} - Array de IDs de usuarios conectados
     */
    getConnectedUsers: () => {
      return Array.from(connectedUsers.keys());
    }
  };
};
