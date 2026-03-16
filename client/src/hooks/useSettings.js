/**
 * Hook de gestion des paramètres restaurant
 * Persistance via localStorage — fonctionne sans serveur
 */

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'restopilot_settings';

const DEFAULT_DAY_SCHEDULE = { lunchStart: 11, lunchEnd: 15, dinnerStart: 18, dinnerEnd: 23 };

export const DEFAULT_SETTINGS = {
  restaurantName: 'Brasserie Le Marais',
  // true = ouvert, false = fermé (index 0 = Lundi … 6 = Dimanche)
  openDays: [true, true, true, true, true, true, false],
  // Horaires par jour — chaque jour peut avoir ses propres créneaux
  daySchedules: Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY_SCHEDULE })),
};

function migrate(raw) {
  // Migration depuis l'ancien format (lunchService / dinnerService globaux)
  if (raw.lunchService || raw.dinnerService) {
    const ls = raw.lunchService ?? { start: 11, end: 15 };
    const ds = raw.dinnerService ?? { start: 18, end: 23 };
    raw.daySchedules = Array.from({ length: 7 }, () => ({
      lunchStart: ls.start, lunchEnd: ls.end,
      dinnerStart: ds.start, dinnerEnd: ds.end,
    }));
    delete raw.lunchService;
    delete raw.dinnerService;
  }
  return raw;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = migrate(JSON.parse(raw));
    // Deep merge : daySchedules peut manquer de clés si nouvelles
    const daySchedules = Array.from({ length: 7 }, (_, i) => ({
      ...DEFAULT_DAY_SCHEDULE,
      ...(parsed.daySchedules?.[i] ?? {}),
    }));
    return { ...DEFAULT_SETTINGS, ...parsed, daySchedules };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function save(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export function useSettings() {
  const [settings, setSettings] = useState(load);

  const update = useCallback((patch) => {
    setSettings((prev) => { const next = { ...prev, ...patch }; save(next); return next; });
  }, []);

  const toggleDay = useCallback((i) => {
    setSettings((prev) => {
      const openDays = [...prev.openDays];
      openDays[i] = !openDays[i];
      const next = { ...prev, openDays };
      save(next); return next;
    });
  }, []);

  /** Met à jour les horaires d'un jour précis */
  const updateDaySchedule = useCallback((dayIndex, patch) => {
    setSettings((prev) => {
      const daySchedules = prev.daySchedules.map((s, i) =>
        i === dayIndex ? { ...s, ...patch } : s
      );
      const next = { ...prev, daySchedules };
      save(next); return next;
    });
  }, []);

  const reset = useCallback(() => {
    save(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, update, toggleDay, updateDaySchedule, reset };
}

/** Vérifie si une heure donnée est dans les créneaux d'un jour (inclus) */
export function isHourInService(hour, schedule) {
  const inLunch  = hour >= schedule.lunchStart  && hour <= schedule.lunchEnd;
  const inDinner = hour >= schedule.dinnerStart && hour <= schedule.dinnerEnd;
  return inLunch || inDinner;
}
