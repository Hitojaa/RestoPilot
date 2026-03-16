/**
 * Utilitaires de traitement des données de ventes
 * Toutes les fonctions sont pures (pas d'effets de bord)
 */

// ── Constantes ────────────────────────────────────────────────────────────────
export const LUNCH_HOURS = [11, 12, 13, 14, 15];
export const DINNER_HOURS = [18, 19, 20, 21, 22];
export const ALL_HOURS = [...LUNCH_HOURS, ...DINNER_HOURS];
export const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// ── Agrégation des ventes ─────────────────────────────────────────────────────

/**
 * Calcule le CA total généré par un plat sur une période donnée
 */
export function getRevenue(sales, dishId, menu) {
  const dish = menu.find((d) => d.id === dishId);
  if (!dish) return 0;
  return sales
    .filter((s) => s.dishId === dishId)
    .reduce((sum, s) => sum + s.quantity * dish.price, 0);
}

/**
 * Calcule le volume total de ventes pour un plat
 */
export function getVolume(sales, dishId) {
  return sales.filter((s) => s.dishId === dishId).reduce((sum, s) => sum + s.quantity, 0);
}

/**
 * Regroupe les ventes par semaine (index 0-3)
 * @returns {Array<Array>} 4 tableaux de ventes, un par semaine
 */
export function splitByWeek(sales, startDate) {
  const start = new Date(startDate);
  return [0, 1, 2, 3].map((w) => {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return sales.filter((s) => {
      const d = new Date(s.date);
      return d >= weekStart && d < weekEnd;
    });
  });
}

/**
 * Regroupe les ventes par jour de la semaine (0=Lundi, 6=Dimanche)
 */
export function groupByDayOfWeek(sales) {
  const groups = {};
  for (let i = 0; i < 7; i++) groups[i] = [];
  for (const s of sales) {
    const dow = (new Date(s.date).getDay() + 6) % 7;
    groups[dow].push(s);
  }
  return groups;
}

/**
 * Regroupe les ventes par heure
 */
export function groupByHour(sales) {
  const groups = {};
  for (const h of ALL_HOURS) groups[h] = 0;
  for (const s of sales) {
    if (groups[s.hour] !== undefined) groups[s.hour] += s.quantity;
  }
  return groups;
}

/**
 * Agrège le CA par jour (pour le graphique CA sur 4 semaines)
 */
export function revenueByDay(sales, menu) {
  const priceMap = Object.fromEntries(menu.map((d) => [d.id, d.price]));
  const result = {};
  for (const s of sales) {
    result[s.date] = (result[s.date] || 0) + s.quantity * (priceMap[s.dishId] || 0);
  }
  return result;
}

/**
 * Calcule le ticket moyen sur une période
 * Estimation: CA / nombre de couverts (couverts ≈ ventes de plats principaux)
 */
export function avgTicket(sales, menu) {
  const priceMap = Object.fromEntries(menu.map((d) => [d.id, d.price]));
  const totalRevenue = sales.reduce((s, e) => s + e.quantity * (priceMap[e.dishId] || 0), 0);
  // Couverts = ventes dans la catégorie "plats" uniquement
  const platIds = new Set(menu.filter((d) => d.category === 'plats').map((d) => d.id));
  const covers = sales.filter((s) => platIds.has(s.dishId)).reduce((s, e) => s + e.quantity, 0);
  return covers > 0 ? totalRevenue / covers : 0;
}

/**
 * Nombre total de couverts (plats vendus)
 */
export function totalCovers(sales, menu) {
  const platIds = new Set(menu.filter((d) => d.category === 'plats').map((d) => d.id));
  return sales.filter((s) => platIds.has(s.dishId)).reduce((s, e) => s + e.quantity, 0);
}

/**
 * Top N plats par CA
 */
export function topByRevenue(sales, menu, n = 5) {
  return menu
    .map((d) => ({ ...d, revenue: getRevenue(sales, d.id, menu), volume: getVolume(sales, d.id) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, n);
}

/**
 * Top N plats par volume
 */
export function topByVolume(sales, menu, n = 5) {
  return menu
    .map((d) => ({ ...d, revenue: getRevenue(sales, d.id, menu), volume: getVolume(sales, d.id) }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, n);
}

/**
 * Heatmap data: pour chaque combo (jour_semaine × heure) → quantité totale
 */
export function buildHeatmap(sales) {
  const map = {};
  for (let d = 0; d < 7; d++) {
    for (const h of ALL_HOURS) {
      map[`${d}-${h}`] = 0;
    }
  }
  for (const s of sales) {
    const dow = (new Date(s.date).getDay() + 6) % 7;
    const key = `${dow}-${s.hour}`;
    if (map[key] !== undefined) map[key] += s.quantity;
  }
  return map;
}

/**
 * Calcule le statut de tendance d'un plat entre deux semaines
 * @returns {number} variation en % (positif = hausse)
 */
export function trendPercent(salesWeekA, salesWeekB, dishId) {
  const volA = getVolume(salesWeekA, dishId);
  const volB = getVolume(salesWeekB, dishId);
  if (volA === 0) return volB > 0 ? 100 : 0;
  return ((volB - volA) / volA) * 100;
}

// ── Formatage ─────────────────────────────────────────────────────────────────
export function formatEur(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export function formatNum(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

export function formatPct(n, withSign = true) {
  const sign = withSign && n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}
