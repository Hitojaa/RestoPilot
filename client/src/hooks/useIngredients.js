import { useState, useEffect, useCallback } from 'react';

function getStorageKey() {
  try {
    const s = localStorage.getItem('cleanplate_session');
    const session = s ? JSON.parse(s) : null;
    return `cleanplate_ingredients_${session?.id || 'guest'}`;
  } catch {
    return 'cleanplate_ingredients_guest';
  }
}

export function useIngredients() {
  const [ingredients, setIngredients] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(getStorageKey());
      if (raw) setIngredients(JSON.parse(raw));
    } catch {}
  }, []);

  const setDishIngredients = useCallback((dishId, items) => {
    setIngredients(prev => {
      const updated = { ...prev, [dishId]: items };
      try { localStorage.setItem(getStorageKey(), JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  return { ingredients, setDishIngredients };
}
