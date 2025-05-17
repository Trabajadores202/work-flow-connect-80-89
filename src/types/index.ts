
/**
 * Definición de tipos para toda la aplicación.
 * Este archivo centraliza todos los tipos usados en el proyecto.
 */

/**
 * Tipo de datos para usuarios
 */
export interface UserType {
  id: string;
  name: string;
  email?: string;
  role?: 'client' | 'freelancer' | 'admin';
  photoURL?: string;
  joinedAt?: number;
  skills?: string[];
  bio?: string;
  location?: string; // Agregado para resolver error de tipado
}

/**
 * Estado de autenticación
 */
export interface AuthState {
  loading: boolean;
  error: string | null;
  user: UserType | null;
}

/**
 * Tipo de datos para trabajos
 */
export interface JobType {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  skills: string[];
  status: 'open' | 'in progress' | 'completed';
  userId: string;
  userName?: string;
  userPhoto?: string;
  createdAt: string | number | Date; // Agregado para resolver error de tipado
  updatedAt: string | number | Date; // Agregado para resolver error de tipado
  timestamp?: number; // Agregado para resolver error de tipado
}

/**
 * Tipo de datos para comentarios
 */
export interface CommentType {
  id: string;
  content: string;
  userId: string;
  jobId: string;
  createdAt: string | number | Date;
  replies?: ReplyType[];
}

/**
 * Tipo de datos para respuestas a comentarios
 */
export interface ReplyType {
  id: string;
  content: string;
  userId: string;
  commentId: string;
  createdAt: string | number | Date;
}

/**
 * Tipo de datos para chats
 */
export interface ChatType {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: string[];
  lastMessage?: MessageType;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

/**
 * Tipo de datos para mensajes
 */
export interface MessageType {
  id: string;
  content: string;
  chatId: string;
  userId: string;
  read: boolean;
  deleted: boolean;
  edited: boolean;
  fileId?: string;
  fileName?: string;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

/**
 * Tipo de datos para notificaciones
 */
export interface NotificationType {
  id: string;
  type: 'message' | 'job' | 'comment' | 'system';
  content: string;
  read: boolean;
  userId: string;
  relatedId?: string;
  createdAt: string | number | Date;
}
