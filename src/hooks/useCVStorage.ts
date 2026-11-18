import { useReducer, useEffect, useCallback } from 'react';
import type { SavedCV } from '../types';
import { defaultCV } from '../data/defaultCV';

const STORAGE_KEY = 'cv-data';
const SELECTED_KEY = 'cv-selected-id';

const generateNewCV = (index: number = 0): SavedCV => {
  return {
    ...defaultCV,
    id: crypto.randomUUID(),
    title: index === 0 ? 'Novo Currículo' : `Novo Currículo ${index + 1}`,
    updatedAt: Date.now(),
  };
};

// Reducer State & Actions
type State = {
  cvs: SavedCV[];
  activeId: string | null;
  initialized: boolean;
};


interface InitFromStorageAction {
  type: 'INIT_FROM_STORAGE';
}

interface CreateAction {
  type: 'CREATE';
  payload: SavedCV;
}

interface DeleteAction {
  type: 'DELETE';
  payload: { idToDelete: string; newCVIfEmpty: SavedCV };
}

interface UpdateAction {
  type: 'UPDATE';
  payload: { id: string; data: Partial<SavedCV>; updatedAt: number };
}

interface SelectAction {
  type: 'SELECT';
  payload: string;
}

interface ResetAction {
  type: 'RESET';
  payload: { cvs: SavedCV[]; activeId?: string | null };
}

type Action =
  | InitFromStorageAction
  | CreateAction
  | DeleteAction
  | UpdateAction
  | SelectAction
  | ResetAction;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'CREATE': {
      return {
        ...state,
        cvs: [...state.cvs, action.payload],
        activeId: action.payload.id,
      };
    }
    case 'DELETE': {
      const { idToDelete, newCVIfEmpty } = action.payload;
      const remaining = state.cvs.filter((cv) => cv.id !== idToDelete);

      if (remaining.length === 0) {
        return {
          ...state,
          cvs: [newCVIfEmpty],
          activeId: newCVIfEmpty.id,
        };
      }

      let newActiveId = state.activeId;
      if (state.activeId === idToDelete) {
        newActiveId = remaining[0].id;
      }

      return {
        ...state,
        cvs: remaining,
        activeId: newActiveId,
      };
    }
    case 'UPDATE': {
      const { id, data, updatedAt } = action.payload;
      const newCvs = state.cvs.map((cv) =>
        cv.id === id ? { ...cv, ...data, updatedAt } : cv
      );
      return {
        ...state,
        cvs: newCvs,
      };
    }
    case 'SELECT': {
      return {
        ...state,
        activeId: action.payload,
      };
    }
    case 'RESET': {
      const { cvs: newCvs, activeId: requestedActiveId } = action.payload;
      const fallbackActiveId = newCvs.length > 0 ? newCvs[0].id : null;
      const newActiveId =
        requestedActiveId && newCvs.some((cv) => cv.id === requestedActiveId)
          ? requestedActiveId
          : fallbackActiveId;

      return {
        ...state,
        cvs: newCvs,
        activeId: newActiveId,
      };
    }
    default:
      return state;
  }
}

// Initializer function to read from localStorage synchronously
function initCVState(): State {
  let initialCvs: SavedCV[] = [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        initialCvs = parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse CV data', e);
  }

  if (initialCvs.length === 0) {
    initialCvs = [generateNewCV()];
  }

  let activeId = initialCvs[0].id;
  try {
    const storedSelected = localStorage.getItem(SELECTED_KEY);
    if (storedSelected && initialCvs.some((cv) => cv.id === storedSelected)) {
      activeId = storedSelected;
    }
  } catch (e) {
    console.error('Failed to parse selected CV id', e);
  }

  return {
    cvs: initialCvs,
    activeId,
    initialized: true,
  };
}

export function useCVStorage() {
  const [state, dispatch] = useReducer(reducer, null, initCVState);

  useEffect(() => {
    if (state.initialized && state.cvs.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cvs));
    }
  }, [state.cvs, state.initialized]);

  useEffect(() => {
    if (state.initialized && state.activeId) {
      try {
        localStorage.setItem(SELECTED_KEY, state.activeId);
      } catch (e) {
        console.error('Failed to persist selected CV id', e);
      }
    }
  }, [state.activeId, state.initialized]);

  const createCV = useCallback(() => {
    const newCV = generateNewCV(state.cvs.length);
    dispatch({ type: 'CREATE', payload: newCV });
  }, [state.cvs.length]);

  const duplicateCV = useCallback((id: string) => {
    const original = state.cvs.find((cv) => cv.id === id);
    if (!original) return;
    const newCV: SavedCV = {
      ...original,
      id: crypto.randomUUID(),
      title: `${original.title} (cópia)`,
      updatedAt: Date.now(),
    };
    dispatch({ type: 'CREATE', payload: newCV });
  }, [state.cvs]);

  const deleteCV = useCallback((id: string) => {
    // Pre-generate a new CV in case deletions make the list empty
    const newCVIfEmpty = generateNewCV();
    dispatch({
      type: 'DELETE',
      payload: { idToDelete: id, newCVIfEmpty },
    });
  }, []);

  const clearAll = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear storage', e);
    }
    const newCV = generateNewCV(0);
    dispatch({ type: 'RESET', payload: { cvs: [newCV], activeId: newCV.id } });
  }, []);

  const importCVs = useCallback((importedCvs: SavedCV[], preferredActiveId?: string | null) => {
    if (!Array.isArray(importedCvs) || importedCvs.length === 0) return false;
    dispatch({
      type: 'RESET',
      payload: { cvs: importedCvs, activeId: preferredActiveId ?? null },
    });
    return true;
  }, []);

  const updateCV = useCallback((id: string, data: Partial<SavedCV>) => {
    dispatch({
      type: 'UPDATE',
      payload: { id, data, updatedAt: Date.now() },
    });
  }, []);

  const setActiveId = useCallback((id: string) => {
    dispatch({ type: 'SELECT', payload: id });
  }, []);

  const activeCV = state.cvs.find((cv) => cv.id === state.activeId) || null;

  return {
    cvs: state.cvs,
    activeId: state.activeId,
    activeCV,
    setActiveId,
    createCV,
    updateCV,
    deleteCV,
    clearAll,
    duplicateCV,
    importCVs,
  };
}
