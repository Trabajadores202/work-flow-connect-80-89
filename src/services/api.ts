
/**
 * Servicios de API
 * 
 * Este archivo contiene todos los servicios para comunicarse con el backend.
 * Cada servicio agrupa funciones relacionadas con una entidad específica.
 */
import axios from 'axios';

// URL base del backend
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Configurar instancia de axios con URL base
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para añadir token de autenticación a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error API:', error.response);
    
    // Si el error es 401 (no autorizado), limpiar token
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
    }
    
    // Extraer mensaje de error
    const errorMessage = 
      error.response && error.response.data.message 
        ? error.response.data.message 
        : 'Error del servidor';
    
    return Promise.reject(new Error(errorMessage));
  }
);

/**
 * Servicio de Autenticación
 * Maneja registro, inicio de sesión y verificación de usuarios
 */
export const authService = {
  /**
   * Registrar un nuevo usuario
   * @param userData Datos del usuario a registrar
   */
  async register(userData: { email: string; password: string; name: string; role: string }) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Iniciar sesión de un usuario
   * @param email Email del usuario
   * @param password Contraseña del usuario
   */
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Verificar si el token actual es válido
   */
  async verifyToken() {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  /**
   * Actualizar perfil de usuario
   * @param profileData Datos a actualizar
   */
  async updateProfile(profileData: any) {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  }
};

/**
 * Servicio de Usuarios
 * Maneja operaciones relacionadas con usuarios
 */
export const userService = {
  /**
   * Obtener todos los usuarios
   */
  async getUsers() {
    const response = await api.get('/users');
    return response.data;
  },

  /**
   * Obtener usuario por ID
   * @param userId ID del usuario
   */
  async getUserById(userId: string) {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  }
};

/**
 * Servicio de Chats
 * Maneja operaciones relacionadas con chats y conversaciones
 */
export const chatService = {
  /**
   * Obtener todos los chats del usuario actual
   */
  async getChats() {
    const response = await api.get('/chats');
    return response.data;
  },

  /**
   * Crear un chat privado con otro usuario
   * @param userId ID del usuario con quien crear el chat
   */
  async createPrivateChat(userId: string) {
    const response = await api.post('/chats/private', { userId });
    return response.data;
  },

  /**
   * Crear un chat grupal
   * @param name Nombre del grupo
   * @param participants IDs de los participantes
   */
  async createGroupChat(name: string, participants: string[]) {
    const response = await api.post('/chats/group', { name, participants });
    return response.data;
  },

  /**
   * Añadir usuarios a un chat grupal
   * @param chatId ID del chat
   * @param userIds IDs de los usuarios a añadir
   */
  async addUsersToChat(chatId: string, userIds: string[]) {
    const response = await api.post(`/chats/${chatId}/users`, { userIds });
    return response.data;
  },

  /**
   * Abandonar un chat
   * @param chatId ID del chat a abandonar
   */
  async leaveChat(chatId: string) {
    const response = await api.post(`/chats/${chatId}/leave`);
    return response.data;
  }
};

/**
 * Servicio de Mensajes
 * Maneja operaciones relacionadas con mensajes en chats
 */
export const messageService = {
  /**
   * Obtener mensajes de un chat
   * @param chatId ID del chat
   */
  async getMessages(chatId: string) {
    const response = await api.get(`/messages/${chatId}`);
    return response.data;
  },

  /**
   * Enviar un mensaje a un chat
   * @param chatId ID del chat
   * @param content Contenido del mensaje
   * @param fileId ID del archivo adjunto (opcional)
   */
  async sendMessage(chatId: string, content: string, fileId?: string) {
    const response = await api.post('/messages', { chatId, content, fileId });
    return response.data;
  },

  /**
   * Actualizar un mensaje existente
   * @param messageId ID del mensaje
   * @param content Nuevo contenido
   */
  async updateMessage(messageId: string, content: string) {
    const response = await api.put(`/messages/${messageId}`, { content });
    return response.data;
  },

  /**
   * Eliminar un mensaje
   * @param messageId ID del mensaje
   */
  async deleteMessage(messageId: string) {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  /**
   * Marcar todos los mensajes de un chat como leídos
   * @param chatId ID del chat
   */
  async markAsRead(chatId: string) {
    const response = await api.put(`/chats/${chatId}/read`);
    return response.data;
  },

  /**
   * Buscar mensajes por texto
   * @param query Texto a buscar
   */
  async searchMessages(query: string) {
    const response = await api.get(`/messages/search?q=${query}`);
    return response.data;
  }
};

/**
 * Servicio de Archivos
 * Maneja operaciones relacionadas con archivos
 */
export const fileService = {
  /**
   * Subir un archivo
   * @param fileData FormData con el archivo
   */
  async uploadFile(fileData: FormData) {
    const response = await axios.post(`${API_URL}/api/files`, fileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  /**
   * Obtener URL de un archivo
   * @param fileId ID del archivo
   */
  getFileUrl(fileId: string) {
    const token = localStorage.getItem('token');
    return `${API_URL}/api/files/${fileId}?token=${token}`;
  },

  /**
   * Eliminar un archivo
   * @param fileId ID del archivo
   */
  async deleteFile(fileId: string) {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  }
};

/**
 * Servicio de Trabajos
 * Maneja operaciones relacionadas con ofertas de trabajo
 */
export const jobService = {
  /**
   * Obtener todos los trabajos
   * @param filters Filtros a aplicar
   */
  async getJobs(filters: any = {}) {
    // Construir query string para filtros
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value as string);
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await api.get(`/jobs${query}`);
    return response.data;
  },

  /**
   * Obtener un trabajo por ID
   * @param jobId ID del trabajo
   */
  async getJobById(jobId: string) {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Crear un nuevo trabajo
   * @param jobData Datos del trabajo
   */
  async createJob(jobData: any) {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },

  /**
   * Actualizar un trabajo existente
   * @param jobId ID del trabajo
   * @param jobData Datos a actualizar
   */
  async updateJob(jobId: string, jobData: any) {
    const response = await api.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  /**
   * Eliminar un trabajo
   * @param jobId ID del trabajo
   */
  async deleteJob(jobId: string) {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Añadir comentario a un trabajo
   * @param jobId ID del trabajo
   * @param content Contenido del comentario
   */
  async addComment(jobId: string, content: string) {
    const response = await api.post(`/jobs/${jobId}/comments`, { content });
    return response.data;
  },

  /**
   * Actualizar un comentario
   * @param commentId ID del comentario
   * @param content Nuevo contenido
   */
  async updateComment(commentId: string, content: string) {
    const response = await api.put(`/jobs/comments/${commentId}`, { content });
    return response.data;
  },

  /**
   * Eliminar un comentario
   * @param commentId ID del comentario
   */
  async deleteComment(commentId: string) {
    const response = await api.delete(`/jobs/comments/${commentId}`);
    return response.data;
  }
};
