// lib/learn-mock.ts
// Datos de ejemplo para mockups en development. En producción reemplaza por
// queries a Supabase (ver INTEGRATION.md).

import type { Course, Module } from '@/components/learn/types';

export const mockCourse: Course = {
  slug: 'curso-de-fotografia-captura-el-mundo-a-traves-de-tu-lente',
  title: 'Captura el mundo a través de tu lente',
  tag: 'Fotografía',
  instructor: 'Lucía Vega',
  instructorRole: 'Fotógrafa documental',
  duration: '4 h 38 min',
  lessons: 14,
  level: 'Principiante',
  color: '#1b38c4',
  completion: 0.42,
  streak: 5,
  xp: 1240,
};

export const mockModules: Module[] = [
  {
    n: 1,
    title: 'Tu cámara como herramienta',
    summary: 'Conoce tu equipo antes de pulsar el disparador.',
    lessons: [
      { id: '1.1', kind: 'video', title: 'Anatomía de tu cámara',          dur: '8 min',  state: 'done' },
      { id: '1.2', kind: 'video', title: 'El triángulo de exposición',     dur: '14 min', state: 'done' },
      { id: '1.3', kind: 'text',  title: 'ISO, apertura y velocidad',      dur: '11 min', state: 'done' },
      { id: '1.4', kind: 'audio', title: 'Conversación: tu primer setup',  dur: '22 min', state: 'done' },
      { id: '1.q', kind: 'quiz',  title: 'Quiz · Tu cámara',               dur: '6 preguntas', state: 'done', score: 6 },
    ],
  },
  {
    n: 2,
    title: 'Componer con intención',
    summary: 'La diferencia entre una foto y una imagen que se queda contigo.',
    lessons: [
      { id: '2.1', kind: 'video', title: 'Regla de los tercios y más allá', dur: '9 min',  state: 'done' },
      { id: '2.2', kind: 'text',  title: 'Líneas, formas y patrones',       dur: '12 min', state: 'current' },
      { id: '2.3', kind: 'video', title: 'Hora dorada y luz natural',       dur: '15 min', state: 'next' },
      { id: '2.4', kind: 'audio', title: 'El error que cambió mi mirada',   dur: '18 min', state: 'locked' },
      { id: '2.q', kind: 'quiz',  title: 'Quiz · Composición',              dur: '8 preguntas', state: 'locked' },
    ],
  },
  {
    n: 3,
    title: 'Revelado y carácter',
    summary: 'Editar no es disfrazar — es revelar lo que ya estaba ahí.',
    lessons: [
      { id: '3.1', kind: 'video', title: 'Flujo en Lightroom',              dur: '18 min', state: 'locked' },
      { id: '3.2', kind: 'text',  title: 'Color, contraste y tono',         dur: '14 min', state: 'locked' },
      { id: '3.3', kind: 'video', title: 'Exportar y publicar',             dur: '7 min',  state: 'locked' },
      { id: '3.q', kind: 'quiz',  title: 'Quiz · Revelado',                 dur: '7 preguntas', state: 'locked' },
    ],
  },
  {
    n: 4,
    title: 'Examen final',
    summary: 'Boss fight · 20 preguntas, 12 minutos, sin segundas oportunidades.',
    isFinal: true,
    lessons: [
      { id: 'F.1', kind: 'boss', title: 'Examen final · Captura el mundo', dur: '12 min', state: 'locked' },
    ],
  },
];
