/**
 * Hook central de chargement des données.
 *
 * Stratégie :
 * - En développement (npm run dev) : fetch depuis l'API Express /api/*
 * - En production / Vercel (VITE_STATIC_DATA=true) : import direct des JSON
 *   → aucun serveur requis, 100% statique, déployable sur Vercel free tier
 */

import { useState, useEffect, useMemo } from 'react';
import { splitByWeek, revenueByDay, buildHeatmap } from '../utils/dataUtils';

const START_DATE = '2026-02-16';

// Détecte si on doit utiliser les données statiques importées
// (variable d'env Vite définie dans .env.production ou sur Vercel)
const USE_STATIC = import.meta.env.VITE_STATIC_DATA === 'true';

export function useData() {
  const [menu, setMenu] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        let menuData, salesData;

        if (USE_STATIC) {
          // Import dynamique des JSON — Vite les bundle directement,
          // zéro dépendance réseau, fonctionne sur tout hébergeur statique
          const [menuMod, salesMod] = await Promise.all([
            import('../../data/menu.json'),
            import('../../data/sales.json'),
          ]);
          menuData = menuMod.default;
          salesData = salesMod.default;
        } else {
          // Mode développement : fetch depuis le serveur Express
          const [menuRes, salesRes] = await Promise.all([
            fetch('/api/menu'),
            fetch('/api/sales'),
          ]);
          if (!menuRes.ok || !salesRes.ok) throw new Error('Serveur Express inaccessible — lance `npm run dev` depuis la racine.');
          menuData = await menuRes.json();
          salesData = await salesRes.json();
        }

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

  const derived = useMemo(() => {
    if (!menu.length || !sales.length) return null;
    return {
      weeks: splitByWeek(sales, START_DATE),
      revByDay: revenueByDay(sales, menu),
      heatmap: buildHeatmap(sales),
    };
  }, [menu, sales]);

  return { menu, sales, loading, error, derived, startDate: START_DATE };
}
