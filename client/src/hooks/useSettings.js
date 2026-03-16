/**
 * Hook de gestion des paramètres restaurant
 * Persistance via localStorage — fonctionne sans serveur
 */

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'restopilot_settings';

export const DEFAULT_SETTINGS = {
  restaurantName: 'Brasserie Le Marais',
  // true = ouvert, false = fermé (index 0 = Lundi … 6 = Dimanche)
  openDays: [true, true, true, true, true, true, false],
  lunchService: { start: 11, end: 15 },
  dinnerService: { start: 18, end: 23 },
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    // Merge avec les defaults pour gérer les nouvelles clés ajoutées après coup
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function save(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage peut être désactivé en navigation privée
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(load);

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  const toggleDay = useCallback((dayIndex) => {
    setSettings((prev) => {
      const openDays = [...prev.openDays];
      openDays[dayIndex] = !openDays[dayIndex];
      const next = { ...prev, openDays };
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    save(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, update, toggleDay, reset };
}
