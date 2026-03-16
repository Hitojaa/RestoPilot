/**
 * Hook central de chargement des données
 * Fetche /api/menu et /api/sales depuis le serveur Express
 * (ou les fichiers JSON en import statique si pas de serveur)
 */

import { useState, useEffect, useMemo } from 'react';
import { splitByWeek, revenueByDay, buildHeatmap } from '../utils/dataUtils';

const START_DATE = '2026-02-16';

export function useData() {
  const [menu, setMenu] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [menuRes, salesRes] = await Promise.all([
          fetch('/api/menu'),
          fetch('/api/sales'),
        ]);

        if (!menuRes.ok || !salesRes.ok) throw new Error('Erreur réseau');

        const menuData = await menuRes.json();
        const salesData = await salesRes.json();

        setMenu(menuData.dishes || menuData);
        setSales(salesData.sales || salesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Données dérivées mémoïsées pour éviter des recalculs inutiles
  const derived = useMemo(() => {
    if (!menu.length || !sales.length) return null;

    const weeks = splitByWeek(sales, START_DATE);
    const revByDay = revenueByDay(sales, menu);
    const heatmap = buildHeatmap(sales);

    return { weeks, revByDay, heatmap };
  }, [menu, sales]);

  return { menu, sales, loading, error, derived, startDate: START_DATE };
}
