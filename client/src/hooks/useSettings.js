/**
 * Hook de gestion des paramètres restaurant
 * Persistance via localStorage — clé isolée par utilisateur
 */

import { useState, useCallback } from 'react';

const SESSION_KEY = 'cleanplate_session';

const DEFAULT_DAY_SCHEDULE = { lunchStart: 11, lunchEnd: 15, dinnerStart: 18, dinnerEnd: 23 };

export const DEFAULT_SETTINGS = {
  restaurantName: 'Brasserie Le Marais',
  cuisineType: '',
  covers: 40,
  color: '#4F8EF7',
  emoji: '🍽️',
  // true = ouvert, false = fermé (index 0 = Lundi … 6 = Dimanche)
  openDays: [true, true, true, true, true, true, false],
  // Horaires par jour — chaque jour peut avoir ses propres créneaux
  daySchedules: Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY_SCHEDULE })),
};

function getUserId() {
  try {
    const s = localStorage.getItem(SESSION_KEY);
    const session = s ? JSON.parse(s) : null;
    return session?.id ?? null;
  } catch { return null; }
}

function getStorageKey() {
  const uid = getUserId();
  return uid ? `cleanplate_settings_${uid}` : 'cleanplate_settings';
}

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
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = migrate(JSON.parse(raw));
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
  try { localStorage.setItem(getStorageKey(), JSON.stringify(s)); } catch {}
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

export function isHourInService(hour, schedule) {
  const inLunch  = hour >= schedule.lunchStart  && hour <= schedule.lunchEnd;
  const inDinner = hour >= schedule.dinnerStart && hour <= schedule.dinnerEnd;
  return inLunch || inDinner;
}
