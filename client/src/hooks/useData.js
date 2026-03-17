/**
 * Hook central de chargement des données.
 *
 * Priorité :
 * 1. Données importées via CSV (localStorage restopilot_imported_{userId})
 * 2. Données statiques (VITE_STATIC_DATA=true → Vercel)
 * 3. API Express (développement)
 */

import { useState, useEffect, useMemo } from 'react';
import { splitByWeek, revenueByDay, buildHeatmap } from '../utils/dataUtils';

const DEFAULT_START = '2026-02-17';

const USE_STATIC = import.meta.env.VITE_STATIC_DATA === 'true';

function getSession() {
  try {
    const s = localStorage.getItem('restopilot_session');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

function getImportedData() {
  try {
    const session = getSession();
    if (!session) return null;
    const raw = localStorage.getItem(`restopilot_imported_${session.id}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function useData() {
  const [menu,    setMenu]    = useState([]);
  const [sales,   setSales]   = useState([]);
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Écoute les changements d'import (événement custom dispatché par la page Import)
  const [importVersion, setImportVersion] = useState(0);
  useEffect(() => {
    function onImport() { setImportVersion(v => v + 1); }
    window.addEventListener('restopilot:imported', onImport);
    return () => window.removeEventListener('restopilot:imported', onImport);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 1. Données importées via CSV ?
        const imported = getImportedData();
        if (imported) {
          setMenu(imported.menu || []);
          setSales(imported.sales || []);
          setStartDate(imported.startDate || DEFAULT_START);
          setLoading(false);
          return;
        }

        // 2. Données statiques ou API
        let menuData, salesData;
        if (USE_STATIC) {
          const [menuMod, salesMod] = await Promise.all([
            import('../../data/menu.json'),
            import('../../data/sales.json'),
          ]);
          menuData  = menuMod.default;
          salesData = salesMod.default;
        } else {
          const [menuRes, salesRes] = await Promise.all([
            fetch('/api/menu'),
            fetch('/api/sales'),
          ]);
          if (!menuRes.ok || !salesRes.ok) throw new Error('Serveur Express inaccessible — lance `npm run dev`.');
          menuData  = await menuRes.json();
          salesData = await salesRes.json();
        }

        const dishes = menuData.dishes  || menuData;
        const txs    = salesData.sales  || salesData;

        setMenu(dishes);
        setSales(txs);
        setStartDate(DEFAULT_START);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [importVersion]);

  const hasData = menu.length > 0 && sales.length > 0;

  const derived = useMemo(() => {
    if (!hasData) return null;
    return {
      weeks:    splitByWeek(sales, startDate),
      revByDay: revenueByDay(sales, menu),
      heatmap:  buildHeatmap(sales),
    };
  }, [menu, sales, startDate, hasData]);

  return { menu, sales, loading, error, derived, startDate, hasData };
}
