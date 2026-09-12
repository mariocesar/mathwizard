import type { Component } from 'svelte';
import type { SliceSpec } from '../lib/storage/migrate';
import type { PersistedSlice } from '../lib/storage/persisted.svelte';
import type { Services } from '../lib/services';

export type { SliceSpec };

/** Props que recibe TODO componente de actividad. Nada más se le pasa. */
export interface ActivityProps<T = unknown> {
  /** Slice persistido reactivo, propio de esta actividad. */
  slice: PersistedSlice<T>;
  services: Services;
  /** Pide salir a la torre. El host es dueño de la transición e historial. */
  exit: () => void;
}

export interface ProgressSummary {
  gold: number;
  total: number;
}

export interface ActivityModule<T = unknown> {
  /** Id estable: segmento de ruta Y de clave de storage. No renombrar jamás. */
  id: string;
  /** Título en español para la torre. */
  title: string;
  /** Icono para la tarjeta de la torre (componente SVG inline). */
  icon: Component;
  /** Posición en la rejilla. */
  order: number;
  component: Component<ActivityProps<T>>;
  persistence?: SliceSpec<T>;
  /** Selector puro de progreso para la franja de Home (solo lectura). */
  progress?: (data: T) => ProgressSummary;
}

/** Fija T entre component y persistence (ayuda de inferencia). */
export function defineActivity<T>(module: ActivityModule<T>): ActivityModule<T> {
  return module;
}
