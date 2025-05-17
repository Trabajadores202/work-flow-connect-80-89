
/**
 * Contexto de Autenticación
 * 
 * Gestiona el estado global de autenticación en la aplicación.
 * Proporciona funciones para inicio de sesión, registro, cierre de sesión
 * y verifica el token de autenticación.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserType, AuthState } from '@/types';
import { authService } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

// Definición de la estructura del contexto de autenticación
interface AuthContextType {
  state: AuthState;
  currentUser: UserType | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { email: string; password: string; name: string; role: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<UserType>) => Promise<void>;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | null>(null);

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Componente proveedor que proporciona estado de autenticación y funciones relacionadas
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Estado inicial de autenticación
  const [state, setState] = useState<AuthState>({
    loading: true,
    error: null,
    user: null,
  });
  const { toast } = useToast();

  // Verificar el token al cargar el componente
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setState({ loading: false, error: null, user: null });
        return;
      }
      
      try {
        const userData = await authService.verifyToken();
        setState({
          user: userData,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error verificando token:', error);
        localStorage.removeItem('token');
        setState({
          user: null,
          loading: false,
          error: 'Sesión expirada o inválida'
        });
      }
    };
    
    checkAuth();
  }, []);

  // Función para iniciar sesión
  const login = async (email: string, password: string) => {
    setState({ ...state, loading: true, error: null });
    
    try {
      const { token, user } = await authService.login(email, password);
      
      localStorage.setItem('token', token);
      
      setState({
        user,
        loading: false,
        error: null,
      });
      
      toast({
        title: "Inicio de sesión exitoso",
        description: `¡Bienvenido, ${user.name}!`,
      });
    } catch (error: any) {
      console.error('Error en inicio de sesión:', error);
      
      setState({
        ...state,
        loading: false,
        error: error.message || 'Error en inicio de sesión'
      });
      
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: error.message || 'Credenciales inválidas',
      });
    }
  };

  // Función para registrar un nuevo usuario
  const register = async (userData: { email: string; password: string; name: string; role: string }) => {
    setState({ ...state, loading: true, error: null });
    
    try {
      const { token, user } = await authService.register(userData);
      
      localStorage.setItem('token', token);
      
      setState({
        user,
        loading: false,
        error: null,
      });
      
      toast({
        title: "Registro exitoso",
        description: `¡Bienvenido a WorkFlowConnect, ${user.name}!`,
      });
    } catch (error: any) {
      console.error('Error en registro:', error);
      
      setState({
        ...state,
        loading: false,
        error: error.message || 'Error en registro'
      });
      
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: error.message || 'No se pudo completar el registro',
      });
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    setState({
      user: null,
      loading: false,
      error: null,
    });
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
  };

  // Función para actualizar el perfil del usuario
  const updateProfile = async (profileData: Partial<UserType>) => {
    if (!state.user) return;
    
    setState({ ...state, loading: true });
    
    try {
      const updatedUser = await authService.updateProfile(profileData);
      
      setState({
        ...state,
        user: updatedUser,
        loading: false,
      });
      
      toast({
        title: "Perfil actualizado",
        description: "Tu perfil ha sido actualizado correctamente",
      });
    } catch (error: any) {
      console.error('Error actualizando perfil:', error);
      
      setState({
        ...state,
        loading: false,
        error: error.message || 'Error actualizando perfil'
      });
      
      toast({
        variant: "destructive",
        title: "Error de actualización",
        description: error.message || 'No se pudo actualizar el perfil',
      });
    }
  };

  // Valor del contexto que se proveerá a los componentes hijos
  const value: AuthContextType = {
    state,
    currentUser: state.user,
    isAuthenticated: !!state.user,
    login,
    register,
    logout,
    updateProfile,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
