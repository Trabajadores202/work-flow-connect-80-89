
/**
 * Utilidades generales de la aplicación
 * 
 * Contiene funciones auxiliares reutilizables en toda la aplicación
 */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina clases CSS con soporte para Tailwind CSS
 * Utiliza clsx y tailwind-merge para unificar y resolver conflictos de clases
 * 
 * @param inputs - Clases CSS a combinar
 * @returns Cadena de clases combinada y optimizada
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea una fecha a una representación legible
 * 
 * @param date - Fecha a formatear (Date, string o number)
 * @param includeTime - Si se debe incluir la hora en el formato
 * @returns Cadena formateada de la fecha
 */
export function formatDate(date: Date | string | number, includeTime = false): string {
  try {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
      return 'Fecha inválida';
    }
    
    // Formatear fecha en formato DD/MM/YYYY
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    let formattedDate = `${day}/${month}/${year}`;
    
    // Añadir hora si se solicita
    if (includeTime) {
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      formattedDate += ` ${hours}:${minutes}`;
    }
    
    return formattedDate;
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Error de formato';
  }
}

/**
 * Trunca un texto a un número máximo de caracteres
 * 
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima (por defecto 100)
 * @returns Texto truncado con puntos suspensivos si es necesario
 */
export function truncateText(text: string, maxLength = 100): string {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}

/**
 * Formatea un valor monetario a representación de divisa
 * 
 * @param amount - Monto a formatear
 * @param currency - Símbolo de divisa (por defecto '$')
 * @returns Cadena formateada como valor monetario
 */
export function formatCurrency(amount: number, currency = '$'): string {
  return `${currency}${amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formatea texto con saltos de línea a formato HTML
 * 
 * @param text - Texto con saltos de línea
 * @returns Texto con etiquetas <br> para saltos de línea
 */
export function formatWithLineBreaks(text: string): string {
  if (!text) return '';
  
  return text.replace(/\n/g, '<br>');
}

/**
 * Genera un id único aleatorio
 * 
 * @returns String con ID único
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Formatea el tamaño de un archivo a unidades legibles
 * 
 * @param bytes - Tamaño en bytes
 * @returns Tamaño formateado (ej: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Valida un correo electrónico
 * 
 * @param email - Correo a validar
 * @returns Booleano indicando si es válido
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Retorna la inicial de un nombre
 * 
 * @param name - Nombre completo
 * @returns Primera letra del nombre
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  
  return name.charAt(0).toUpperCase();
}
