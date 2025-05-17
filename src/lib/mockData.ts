
/**
 * Datos de prueba y constantes para la aplicación
 * 
 * Este archivo contiene constantes y datos de ejemplo utilizados
 * durante el desarrollo y como datos iniciales.
 */

import { JobType, UserType } from '@/types';

/**
 * Usuarios de ejemplo para pruebas
 */
export const USERS: UserType[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    role: 'freelancer',
    photoURL: 'https://i.pravatar.cc/150?img=1',
    joinedAt: Date.now(),
    skills: ['React', 'Node.js', 'JavaScript'],
    bio: 'Desarrollador web con experiencia en aplicaciones fullstack.',
    location: 'Madrid, España'
  },
  {
    id: '2',
    name: 'María Rodríguez',
    email: 'maria@example.com',
    role: 'client',
    photoURL: 'https://i.pravatar.cc/150?img=2',
    joinedAt: Date.now() - 8640000, // 1 día antes
    bio: 'Empresaria buscando desarrolladores para proyectos web.',
    location: 'Barcelona, España'
  },
  {
    id: '3',
    name: 'Luis Sánchez',
    email: 'luis@example.com',
    role: 'freelancer',
    photoURL: 'https://i.pravatar.cc/150?img=3',
    joinedAt: Date.now() - 86400000 * 3, // 3 días antes
    skills: ['Python', 'Django', 'Machine Learning'],
    bio: 'Entusiasta del machine learning y desarrollo backend.',
    location: 'Valencia, España'
  },
  {
    id: '4',
    name: 'Ana Torres',
    email: 'ana@example.com',
    role: 'client',
    photoURL: 'https://i.pravatar.cc/150?img=4',
    joinedAt: Date.now() - 86400000 * 5, // 5 días antes
    bio: 'Directora de startup tecnológica.',
    location: 'Sevilla, España'
  },
  {
    id: '5',
    name: 'Carlos Martín',
    email: 'carlos@example.com',
    role: 'freelancer',
    photoURL: 'https://i.pravatar.cc/150?img=5',
    joinedAt: Date.now() - 86400000 * 10, // 10 días antes
    skills: ['UI/UX', 'Figma', 'Adobe XD'],
    bio: 'Diseñador UI/UX con experiencia en proyectos internacionales.',
    location: 'Bilbao, España'
  }
];

/**
 * Trabajos de ejemplo para pruebas
 */
export const JOBS: JobType[] = [
  {
    id: '1',
    title: 'Desarrollo de landing page',
    description: 'Se necesita programador para desarrollar una landing page de presentación de producto.',
    budget: 500,
    category: 'Desarrollo Web',
    skills: ['HTML', 'CSS', 'JavaScript'],
    status: 'open',
    userId: '2',
    createdAt: Date.now() - 86400000 * 2, // 2 días antes
    updatedAt: Date.now() - 86400000 * 2,
    timestamp: Date.now() - 86400000 * 2
  },
  {
    id: '2',
    title: 'App para gestión de inventario',
    description: 'Desarrollo de aplicación móvil para gestionar inventario de un pequeño negocio.',
    budget: 1200,
    category: 'Desarrollo Móvil',
    skills: ['React Native', 'Firebase'],
    status: 'in progress',
    userId: '4',
    createdAt: Date.now() - 86400000 * 5, // 5 días antes
    updatedAt: Date.now() - 86400000 * 3,
    timestamp: Date.now() - 86400000 * 5
  },
  {
    id: '3',
    title: 'Diseño de logo para empresa',
    description: 'Se busca diseñador para crear logo corporativo y guía de identidad visual.',
    budget: 300,
    category: 'Diseño Gráfico',
    skills: ['Photoshop', 'Illustrator'],
    status: 'completed',
    userId: '2',
    createdAt: Date.now() - 86400000 * 10, // 10 días antes
    updatedAt: Date.now() - 86400000 * 8,
    timestamp: Date.now() - 86400000 * 10
  },
  {
    id: '4',
    title: 'Desarrollo de API para ecommerce',
    description: 'Necesitamos un desarrollador backend para crear una API RESTful para nuestra tienda online.',
    budget: 800,
    category: 'Desarrollo Backend',
    skills: ['Node.js', 'Express', 'MongoDB'],
    status: 'open',
    userId: '4',
    createdAt: Date.now() - 86400000 * 3, // 3 días antes
    updatedAt: Date.now() - 86400000 * 3,
    timestamp: Date.now() - 86400000 * 3
  },
  {
    id: '5',
    title: 'Migración de base de datos',
    description: 'Proyecto de migración de base de datos relacional a MongoDB.',
    budget: 600,
    category: 'Base de Datos',
    skills: ['SQL', 'MongoDB', 'ETL'],
    status: 'in progress',
    userId: '2',
    createdAt: Date.now() - 86400000 * 7, // 7 días antes
    updatedAt: Date.now() - 86400000 * 4,
    timestamp: Date.now() - 86400000 * 7
  }
];

/**
 * Categorías de trabajos disponibles
 */
export const JOB_CATEGORIES = [
  'Desarrollo Web',
  'Desarrollo Móvil',
  'Desarrollo Backend',
  'Frontend',
  'Diseño Gráfico',
  'UI/UX',
  'Base de Datos',
  'DevOps',
  'Machine Learning',
  'Inteligencia Artificial',
  'Blockchain',
  'Videojuegos',
  'Realidad Virtual',
  'Marketing Digital',
  'Redacción',
  'Traducción',
  'Soporte Técnico',
  'Otro'
];

/**
 * Habilidades disponibles para seleccionar
 */
export const SKILLS_LIST = [
  'JavaScript',
  'TypeScript',
  'React',
  'Vue.js',
  'Angular',
  'Node.js',
  'Express',
  'PHP',
  'Laravel',
  'Python',
  'Django',
  'Flask',
  'Java',
  'Spring Boot',
  'C#',
  '.NET',
  'Ruby',
  'Ruby on Rails',
  'HTML',
  'CSS',
  'SASS',
  'TailwindCSS',
  'Bootstrap',
  'SQL',
  'MongoDB',
  'Firebase',
  'Redis',
  'AWS',
  'Azure',
  'Google Cloud',
  'Docker',
  'Kubernetes',
  'React Native',
  'Flutter',
  'Swift',
  'Kotlin',
  'Android',
  'iOS',
  'GraphQL',
  'REST',
  'WebSockets',
  'Git',
  'GitHub',
  'GitLab',
  'CI/CD',
  'Jira',
  'Scrum',
  'Kanban',
  'Photoshop',
  'Illustrator',
  'Figma',
  'Adobe XD',
  'Sketch',
  'UI/UX',
  'SEO',
  'SEM',
  'Google Analytics',
  'Content Marketing',
  'Email Marketing',
  'Social Media'
];
