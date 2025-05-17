
/**
 * Controlador de Autenticación
 * 
 * Gestiona todas las operaciones relacionadas con la autenticación de usuarios:
 * registro, inicio de sesión y verificación de tokens.
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/userModel');

/**
 * Registra un nuevo usuario
 * 
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Validar datos requeridos
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, contraseña y nombre son obligatorios' });
    }
    
    // Verificar si el correo ya está registrado
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Este correo ya está registrado' });
    }
    
    // Crear hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear usuario
    const userId = uuidv4();
    const newUser = {
      id: userId,
      email,
      password: hashedPassword,
      username: name,
      role: role || 'freelancer',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await userModel.createUser(newUser);
    
    // Generar token JWT
    const token = jwt.sign(
      { id: userId, email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );
    
    // Responder con usuario (sin contraseña) y token
    const userResponse = {
      id: userId,
      email,
      name,
      role: newUser.role
    };
    
    res.status(201).json({
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Inicia sesión de un usuario existente
 * 
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar datos
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    }
    
    // Buscar usuario por email
    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );
    
    // Responder con usuario (sin contraseña) y token
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.username,
      role: user.role,
      photoURL: user.avatar
    };
    
    res.json({
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Verifica un token JWT y devuelve información del usuario
 * 
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
exports.verify = async (req, res) => {
  try {
    // El middleware de autenticación ya verificó el token
    // y agregó el usuario a req.user
    const userId = req.user.id;
    
    // Obtener datos completos del usuario
    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Responder con el usuario (sin contraseña)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.username,
      role: user.role,
      photoURL: user.avatar
    };
    
    res.json(userResponse);
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
