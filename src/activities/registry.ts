import type { ActivityModule } from './types';
import timesTables from './times-tables';
import giro from './giro';

/**
 * Registro estático de actividades. Añadir una actividad = crear su carpeta
 * y añadir UNA línea aquí. Nada más cambia en la app.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const activities: ReadonlyArray<ActivityModule<any>> = [timesTables, giro];
/* eslint-enable @typescript-eslint/no-explicit-any */

export function getActivity(id: string): ActivityModule<unknown> | undefined {
  return activities.find((a) => a.id === id) as ActivityModule<unknown> | undefined;
}
