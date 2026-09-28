import * as fs from 'fs';

export function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
}

export function getTime() {
    const currentTime = new Date();

    return currentTime.toLocaleString('es-ES', {
      weekday: 'long', // Día de la semana (por ejemplo, "lunes")
      year: 'numeric',
      month: 'long', // Mes completo (por ejemplo, "marzo")
      day: 'numeric', // Día del mes (por ejemplo, "26")
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false, // Para usar formato de 24 horas
    });
}
  
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fileExists(filePath: string) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    
    return true;
  } catch (error) {
    return false;
  }
}