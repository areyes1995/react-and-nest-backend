// Plantilla oficial de presentación de clase (11 diapositivas).

import type { Slide } from '@services/types'

let n = 0
const id = () => `s${Date.now().toString(36)}${(n++).toString(36)}`

export function templateSlides(title = 'Nombre de la clase', subtitle = 'Subtítulo de ser necesario'): Slide[] {
  return [
    { id: id(), layout: 'title', title, subtitle, blocks: [] },
    { id: id(), layout: 'reflection', title: 'Reflexión del día', blocks: [{ type: 'text', text: 'Escribe aquí la reflexión o frase del día.' }] },
    { id: id(), layout: 'feedback', title: 'Retroalimentación', blocks: [{ type: 'bullets', items: ['¿Qué aprendimos la clase anterior?', '¿Qué dudas quedaron?'] }] },
    { id: id(), layout: 'purpose', title: 'Propósito', blocks: [{ type: 'text', text: 'Aquí se coloca la intención pedagógica del plan de clase.' }] },
    { id: id(), layout: 'agenda', title: 'Tabla de contenido', blocks: [{ type: 'bullets', items: ['Contenido 1', 'Contenido 2', 'Contenido 3'] }] },
    { id: id(), layout: 'section', title: 'Título de la primera parte de la clase', blocks: [] },
    { id: id(), layout: 'content', title: 'Contenidos o ejemplos abordados', blocks: [{ type: 'text', text: 'Desarrollo del tema' }, { type: 'formula', latex: '2x + 5 = 13' }] },
    { id: id(), layout: 'activities', title: 'Actividades', blocks: [{ type: 'question', prompt: 'Resuelve: 3x − 4 = 11' }] },
    { id: id(), layout: 'assignment', title: 'Asignación', blocks: [] },
    { id: id(), layout: 'task', title: 'Descripción de tarea', blocks: [{ type: 'text', text: 'Aquí se coloca la tarea del día.' }] },
    { id: id(), layout: 'closing', title: 'Frase final del día', blocks: [{ type: 'text', text: 'La educación no cambia el mundo, cambia a las personas que van a cambiar el mundo. — Paulo Freire' }] },
  ]
}

export function blankSlide(layout = 'content'): Slide {
  return { id: id(), layout, title: 'Nueva diapositiva', blocks: [{ type: 'text', text: 'Escribe tu contenido…' }] }
}
