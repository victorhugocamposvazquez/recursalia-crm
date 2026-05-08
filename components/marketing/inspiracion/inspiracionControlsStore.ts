'use client';

import { useSyncExternalStore } from 'react';

type ControlsState = {
  step: number;
  canGoBack: boolean;
};

const initialState: ControlsState = { step: 0, canGoBack: false };
let state: ControlsState = initialState;

const listeners = new Set<() => void>();

let backHandler: (() => void) | null = null;
let exitHandler: (() => void) | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

/**
 * Store ligero (singleton, basado en `useSyncExternalStore`) que conecta
 * la experiencia `/inspiracion` con el `SiteHeader` global. Permite mover
 * los controles de "volver atrás" y "salir" al header sin tener que
 * envolver el árbol con un Provider adicional.
 */
export const inspiracionControlsStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot(): ControlsState {
    return state;
  },
  setState(partial: Partial<ControlsState>) {
    const next = { ...state, ...partial };
    if (next.step === state.step && next.canGoBack === state.canGoBack) {
      return;
    }
    state = next;
    emit();
  },
  reset() {
    if (state.step === initialState.step && state.canGoBack === initialState.canGoBack) {
      return;
    }
    state = initialState;
    emit();
  },
  registerHandlers(handlers: { back?: () => void; exit?: () => void }) {
    if (handlers.back !== undefined) backHandler = handlers.back;
    if (handlers.exit !== undefined) exitHandler = handlers.exit;
  },
  unregisterHandlers() {
    backHandler = null;
    exitHandler = null;
  },
  triggerBack() {
    backHandler?.();
  },
  triggerExit() {
    exitHandler?.();
  },
};

export function useInspiracionControls(): ControlsState {
  return useSyncExternalStore(
    inspiracionControlsStore.subscribe,
    inspiracionControlsStore.getSnapshot,
    () => initialState
  );
}
