
/**
 * Contexto de Chat
 * 
 * Gestiona la funcionalidad del sistema de chat en tiempo real.
 * Se encarga de la conexión con Socket.IO, gestión de chats,
 * envío y recepción de mensajes, archivos y notificaciones.
 */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ChatType, MessageType, UserType } from '@/types';
import { chatService, messageService, fileService } from '@/services/api';

// URL del servidor de backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Definición del contexto de chat
interface ChatContextType {
  chats: ChatType[];
  activeChat: ChatType | null;
  activeChatMessages: MessageType[];
  loading: boolean;
  error: string | null;
  unreadMessagesCount: number;
  isConnected: boolean;
  // Funciones para gestionar chats
  setActiveChat: (chatId: string) => void;
  createPrivateChat: (userId: string) => Promise<ChatType | null>;
  createGroupChat: (name: string, participants: string[]) => Promise<ChatType | null>;
  leaveChat: (chatId: string) => Promise<void>;
  // Funciones para gestionar mensajes
  sendMessage: (chatId: string, content: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  // Funciones para archivos
  sendFile: (chatId: string, file: File) => Promise<void>;
  // Funciones utilitarias
  findExistingPrivateChat: (userId: string) => ChatType | undefined;
  getUserChats: () => ChatType[];
  markChatAsRead: (chatId: string) => Promise<void>;
  resetUnreadCount: () => void;
}

// Crear el contexto
const ChatContext = createContext<ChatContextType | null>(null);

// Hook personalizado para usar el contexto
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat debe ser usado dentro de un ChatProvider');
  }
  return context;
};

// Componente proveedor que proporciona funcionalidad de chat
export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  // Estado para chats y mensajes
  const [chats, setChats] = useState<ChatType[]>([]);
  const [activeChat, setActiveChatState] = useState<ChatType | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Referencias para socket y conexión
  const socketRef = useRef<Socket | null>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Conectar al servidor de Socket.IO
  useEffect(() => {
    if (!currentUser) {
      // Si no hay usuario autenticado, no conectar
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Obtener token de autenticación
    const token = localStorage.getItem('token');
    if (!token) return;

    // Configurar y conectar socket
    const socket = io(BACKEND_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    // Asignar manejadores de eventos
    socket.on('connect', () => {
      console.log('Conexión de socket establecida');
      setIsConnected(true);
    });

    socket.on('connect_error', (err) => {
      console.error('Error de conexión de socket:', err.message);
      setIsConnected(false);
      setError('Error de conexión al servidor de chat');
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket desconectado:', reason);
      setIsConnected(false);
    });

    socket.on('chat:message', (message: MessageType) => {
      handleNewMessage(message);
    });

    socket.on('chat:message:update', (updatedMessage: MessageType) => {
      handleMessageUpdate(updatedMessage);
    });

    socket.on('chat:message:delete', (messageId: string) => {
      handleMessageDelete(messageId);
    });

    socket.on('chat:new', (chat: ChatType) => {
      handleNewChat(chat);
    });

    socketRef.current = socket;

    // Cargar chats iniciales
    loadChats();

    // Limpiar al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUser]);

  // Función para cargar todos los chats
  const loadChats = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Obtener chats desde el servicio
      const userChats = await chatService.getChats();
      console.log('Chats cargados:', userChats);
      
      // Calcular mensajes no leídos
      let unreadCount = 0;
      userChats.forEach(chat => {
        if (chat.lastMessage && !chat.lastMessage.read && chat.lastMessage.userId !== currentUser.id) {
          unreadCount++;
        }
      });
      
      setChats(userChats);
      setUnreadMessagesCount(unreadCount);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando chats:', error);
      setError('No se pudieron cargar los chats');
      setLoading(false);
    }
  };

  // Función para cargar mensajes de un chat específico
  const loadMessages = async (chatId: string) => {
    setLoading(true);
    try {
      const messages = await messageService.getMessages(chatId);
      console.log('Mensajes cargados para chat', chatId, ':', messages);
      setActiveChatMessages(messages);
      
      // Marcar como leídos
      if (currentUser) {
        await markChatAsRead(chatId);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      setError('No se pudieron cargar los mensajes');
      setLoading(false);
    }
  };

  // Función para establecer el chat activo
  const setActiveChat = async (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setActiveChatState(chat);
      await loadMessages(chatId);
    }
  };

  // Crear un chat privado con otro usuario
  const createPrivateChat = async (userId: string): Promise<ChatType | null> => {
    if (!currentUser) return null;
    
    // Verificar si ya existe
    const existingChat = findExistingPrivateChat(userId);
    if (existingChat) {
      setActiveChat(existingChat.id);
      return existingChat;
    }
    
    setLoading(true);
    try {
      // Crear nuevo chat privado
      const newChat = await chatService.createPrivateChat(userId);
      setChats(prev => [...prev, newChat]);
      setActiveChat(newChat.id);
      setLoading(false);
      return newChat;
    } catch (error) {
      console.error('Error creando chat privado:', error);
      setError('No se pudo crear el chat privado');
      setLoading(false);
      return null;
    }
  };

  // Crear un chat grupal
  const createGroupChat = async (name: string, participants: string[]): Promise<ChatType | null> => {
    if (!currentUser) return null;
    
    setLoading(true);
    try {
      // Crear nuevo chat grupal
      const newChat = await chatService.createGroupChat(name, participants);
      setChats(prev => [...prev, newChat]);
      setActiveChat(newChat.id);
      setLoading(false);
      return newChat;
    } catch (error) {
      console.error('Error creando chat grupal:', error);
      setError('No se pudo crear el chat grupal');
      setLoading(false);
      return null;
    }
  };

  // Salir de un chat
  const leaveChat = async (chatId: string): Promise<void> => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await chatService.leaveChat(chatId);
      
      // Actualizar estado local
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (activeChat?.id === chatId) {
        setActiveChatState(null);
        setActiveChatMessages([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error abandonando chat:', error);
      setError('No se pudo abandonar el chat');
      setLoading(false);
    }
  };

  // Enviar un mensaje de texto
  const sendMessage = async (chatId: string, content: string): Promise<void> => {
    if (!currentUser || !chatId || !content.trim()) return;
    
    try {
      // Enviar el mensaje usando Socket.IO
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('sendMessage', { chatId, content });
      } else {
        // Fallback a API REST si socket no está disponible
        await messageService.sendMessage(chatId, content);
        // Refrescar mensajes
        loadMessages(chatId);
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el mensaje",
      });
    }
  };

  // Editar un mensaje existente
  const editMessage = async (messageId: string, content: string): Promise<void> => {
    if (!currentUser || !messageId || !content.trim()) return;
    
    try {
      // Editar el mensaje usando Socket.IO
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('editMessage', { messageId, content });
      } else {
        // Fallback a API REST
        await messageService.updateMessage(messageId, content);
        // Refrescar mensajes
        if (activeChat) loadMessages(activeChat.id);
      }
    } catch (error) {
      console.error('Error editando mensaje:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo editar el mensaje",
      });
    }
  };

  // Eliminar un mensaje
  const deleteMessage = async (messageId: string): Promise<void> => {
    if (!currentUser || !messageId) return;
    
    try {
      // Eliminar el mensaje usando Socket.IO
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('deleteMessage', { messageId });
      } else {
        // Fallback a API REST
        await messageService.deleteMessage(messageId);
        // Refrescar mensajes
        if (activeChat) loadMessages(activeChat.id);
      }
    } catch (error) {
      console.error('Error eliminando mensaje:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el mensaje",
      });
    }
  };

  // Enviar un archivo
  const sendFile = async (chatId: string, file: File): Promise<void> => {
    if (!currentUser || !chatId || !file) return;
    
    try {
      // Convertir archivo a base64 para socket.io
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64File = reader.result as string;
        
        // Enviar mediante socket
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('sendFile', { 
            chatId, 
            filename: file.name, 
            contentType: file.type,
            size: file.size,
            data: base64File 
          });
        } else {
          // Fallback a API REST
          const fileData = new FormData();
          fileData.append('file', file);
          fileData.append('chatId', chatId);
          
          const fileResponse = await fileService.uploadFile(fileData);
          // Crear mensaje con el archivo
          await messageService.sendMessage(chatId, `Archivo: ${file.name}`, fileResponse.id);
          
          // Refrescar mensajes
          if (activeChat && activeChat.id === chatId) {
            loadMessages(chatId);
          }
        }
      };
    } catch (error) {
      console.error('Error enviando archivo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el archivo",
      });
    }
  };

  // Marcar un chat como leído
  const markChatAsRead = async (chatId: string): Promise<void> => {
    if (!currentUser || !chatId) return;
    
    try {
      await messageService.markAsRead(chatId);
      
      // Actualizar estado local
      setChats(prev => 
        prev.map(chat => {
          if (chat.id === chatId && chat.lastMessage) {
            return {
              ...chat,
              lastMessage: {
                ...chat.lastMessage,
                read: true
              }
            };
          }
          return chat;
        })
      );
      
      // Recalcular conteo de mensajes no leídos
      recalculateUnreadCount();
    } catch (error) {
      console.error('Error marcando chat como leído:', error);
    }
  };

  // Manejador para nuevo mensaje recibido
  const handleNewMessage = (message: MessageType) => {
    console.log('Nuevo mensaje recibido:', message);
    
    // Actualizar la lista de mensajes activos si corresponde al chat actual
    if (activeChat && message.chatId === activeChat.id) {
      setActiveChatMessages(prev => [...prev, message]);
      
      // Si el mensaje no es del usuario actual, marcarlo como leído
      if (currentUser && message.userId !== currentUser.id) {
        markChatAsRead(message.chatId);
      }
    } else if (currentUser && message.userId !== currentUser.id) {
      // Incrementar contador de no leídos si el mensaje es para el usuario
      setUnreadMessagesCount(prev => prev + 1);
      
      // Mostrar notificación
      toast({
        title: "Nuevo mensaje",
        description: `Tienes un nuevo mensaje en chat ${message.chatId}`,
      });
    }
    
    // Actualizar el último mensaje en la lista de chats
    updateChatWithLastMessage(message);
  };

  // Manejador para actualización de mensaje
  const handleMessageUpdate = (updatedMessage: MessageType) => {
    // Actualizar en la lista de mensajes activos si corresponde
    if (activeChat && updatedMessage.chatId === activeChat.id) {
      setActiveChatMessages(prev => 
        prev.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        )
      );
    }
    
    // Actualizar en la lista de chats si es el último mensaje
    updateChatWithLastMessage(updatedMessage);
  };

  // Manejador para eliminación de mensaje
  const handleMessageDelete = (messageId: string) => {
    // Eliminar de la lista de mensajes activos
    setActiveChatMessages(prev => prev.filter(msg => msg.id !== messageId));
    
    // Actualizar los chats si era el último mensaje
    setChats(prev => 
      prev.map(chat => {
        if (chat.lastMessage && chat.lastMessage.id === messageId) {
          // Buscar un nuevo último mensaje
          const newLastMessage = activeChatMessages
            .filter(msg => msg.id !== messageId && msg.chatId === chat.id)
            .sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];
          
          return {
            ...chat,
            lastMessage: newLastMessage || null
          };
        }
        return chat;
      })
    );
  };

  // Manejador para nuevo chat
  const handleNewChat = (chat: ChatType) => {
    console.log('Nuevo chat recibido:', chat);
    // Añadir a la lista de chats
    setChats(prev => [...prev, chat]);
    
    // Notificar al usuario
    toast({
      title: "Nuevo chat",
      description: `Se ha creado un nuevo chat: ${chat.name || 'Chat privado'}`,
    });
  };

  // Actualizar chat con el último mensaje
  const updateChatWithLastMessage = (message: MessageType) => {
    setChats(prev => 
      prev.map(chat => {
        if (chat.id === message.chatId) {
          // Si no hay último mensaje o este mensaje es más reciente
          if (!chat.lastMessage || 
              new Date(message.createdAt).getTime() > new Date(chat.lastMessage.createdAt).getTime()) {
            return {
              ...chat,
              lastMessage: message
            };
          }
        }
        return chat;
      })
    );
  };

  // Recalcular conteo de mensajes no leídos
  const recalculateUnreadCount = () => {
    if (!currentUser) return;
    
    let count = 0;
    chats.forEach(chat => {
      if (chat.lastMessage && 
          !chat.lastMessage.read && 
          chat.lastMessage.userId !== currentUser.id) {
        count++;
      }
    });
    
    setUnreadMessagesCount(count);
  };

  // Resetear contador de no leídos
  const resetUnreadCount = () => {
    setUnreadMessagesCount(0);
  };

  // Encontrar un chat privado existente con un usuario
  const findExistingPrivateChat = useCallback((userId: string): ChatType | undefined => {
    if (!currentUser) return undefined;
    
    return chats.find(chat => 
      !chat.isGroup && 
      chat.participants.includes(userId) && 
      chat.participants.includes(currentUser.id)
    );
  }, [chats, currentUser]);

  // Obtener todos los chats del usuario
  const getUserChats = (): ChatType[] => {
    return chats;
  };

  // Valor del contexto que se proveerá a los componentes hijos
  const value: ChatContextType = {
    chats,
    activeChat,
    activeChatMessages,
    loading,
    error,
    unreadMessagesCount,
    isConnected,
    setActiveChat,
    createPrivateChat,
    createGroupChat,
    leaveChat,
    sendMessage,
    editMessage,
    deleteMessage,
    sendFile,
    findExistingPrivateChat,
    getUserChats,
    markChatAsRead,
    resetUnreadCount
  };
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
