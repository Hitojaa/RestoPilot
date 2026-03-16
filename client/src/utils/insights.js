/**
 * Moteur d'insights IA — RestoPilot
 *
 * Fonction pure qui analyse les données de ventes et retourne des
 * phrases d'analyse automatiques selon des règles métier définies.
 *
 * Règles :
 * - Bestseller     : plat représentant >20% du CA total
 * - En déclin      : baisse >15% sur 2 semaines consécutives
 * - Faux bon plat  : top 3 réputation mais volume < médiane des plats
 * - Créneau mort   : <60% de la moyenne horaire
 * - Opportunité prix: fort volume + prix sous la moyenne de sa catégorie
 */

import {
  getRevenue,
  getVolume,
  splitByWeek,
  groupByDayOfWeek,
  groupByHour,
  avgTicket,
  trendPercent,
  formatEur,
  formatPct,
  DAYS_FR,
  ALL_HOURS,
} from './dataUtils';

/**
 * Génère entre 4 et 6 insights depuis les données brutes
 *
 * @param {Array}  sales    - Tableau de {date, dishId, hour, quantity}
 * @param {Array}  menu     - Tableau de {id, name, category, price, reputation}
 * @param {string} startDate - Date ISO du premier jour (ex: "2026-02-16")
 * @returns {Array<{text: string, type: 'success'|'warning'|'danger'|'info'}>}
 */
export function generateInsights(sales, menu, startDate) {
  const insights = [];

  const weeks = splitByWeek(sales, startDate);
  const lastWeek = weeks[3];
  const prevWeek = weeks[2];
  const allTime = sales;

  const totalRevenue = menu.reduce((s, d) => s + getRevenue(allTime, d.id, menu), 0);

  // ── 1. Bestseller ──────────────────────────────────────────────────────────
  // Identifie le plat qui représente le plus grand % du CA total
  const dishRevenues = menu.map((d) => ({
    ...d,
    revenue: getRevenue(allTime, d.id, menu),
    volume: getVolume(allTime, d.id),
  }));
  dishRevenues.sort((a, b) => b.revenue - a.revenue);

  const topDish = dishRevenues[0];
  if (topDish) {
    const pct = (topDish.revenue / totalRevenue) * 100;
    if (pct >= 20) {
      insights.push({
        type: 'success',
        text: `"${topDish.name}" représente ${pct.toFixed(0)}% de votre CA total — votre plat pilier. Assurez-vous de ne jamais en manquer les ingrédients.`,
      });
    }
  }

  // ── 2. Plat en déclin ─────────────────────────────────────────────────────
  // Détecte une baisse >15% sur 2 semaines consécutives (sem 2→3 ET 3→4)
  for (const dish of menu) {
    const t12 = trendPercent(weeks[1], weeks[2], dish.id);
    const t23 = trendPercent(weeks[2], weeks[3], dish.id);
    const avgDecline = (t12 + t23) / 2;

    if (t12 < -15 && t23 < -15) {
      insights.push({
        type: 'danger',
        text: `"${dish.name}" chute de ${Math.abs(avgDecline).toFixed(0)}% sur 2 semaines consécutives. Envisagez de le retirer ou de le repositionner dans la carte.`,
      });
      if (insights.filter((i) => i.type === 'danger').length >= 1) break; // Max 1 déclin
    }
  }

  // ── 3. Faux bon plat ───────────────────────────────────────────────────────
  // Top 3 réputation mais volume de ventes dans la moitié basse
  const byReputation = [...menu].sort((a, b) => b.reputation - a.reputation).slice(0, 3);
  const allVolumes = menu.map((d) => getVolume(allTime, d.id));
  allVolumes.sort((a, b) => a - b);
  const medianVolume = allVolumes[Math.floor(allVolumes.length / 2)];

  for (const dish of byReputation) {
    const vol = getVolume(allTime, dish.id);
    if (vol < medianVolume * 0.7) {
      insights.push({
        type: 'warning',
        text: `"${dish.name}" est très bien noté (${dish.reputation}/5) mais se vend peu (${vol} fois sur 4 sem.). C'est un "faux bon plat" — visibilité insuffisante ou prix inadapté.`,
      });
      break; // Max 1 faux bon plat
    }
  }

  // ── 4. Créneau mort ───────────────────────────────────────────────────────
  // Heure ou jour avec <60% de la moyenne
  const byDow = groupByDayOfWeek(lastWeek);
  const platIds = new Set(menu.filter((d) => d.category === 'plats').map((d) => d.id));

  const dowSales = Object.entries(byDow).map(([dow, s]) => ({
    dow: parseInt(dow),
    volume: s.filter((e) => platIds.has(e.dishId)).reduce((sum, e) => sum + e.quantity, 0),
  }));
  const avgDow = dowSales.reduce((s, d) => s + d.volume, 0) / 7;
  const deadDay = dowSales.find((d) => d.volume < avgDow * 0.6 && avgDow > 0);

  if (deadDay) {
    const diff = ((deadDay.volume - avgDow) / avgDow) * 100;
    insights.push({
      type: 'info',
      text: `Le ${DAYS_FR[deadDay.dow]} est votre créneau le plus faible (${formatPct(diff, true)} vs moyenne). Une formule promotionnelle ou un événement régulier pourrait dynamiser cette journée.`,
    });
  }

  // ── 5. Opportunité de hausse de prix ──────────────────────────────────────
  // Plat à fort volume dont le prix est sous la moyenne de sa catégorie
  const categories = [...new Set(menu.map((d) => d.category))];
  const opportunityInsights = [];

  for (const cat of categories) {
    const catDishes = menu.filter((d) => d.category === cat);
    const avgPrice = catDishes.reduce((s, d) => s + d.price, 0) / catDishes.length;
    const catVolumes = catDishes.map((d) => ({ ...d, volume: getVolume(allTime, d.id) }));
    catVolumes.sort((a, b) => b.volume - a.volume);

    const topCatDish = catVolumes[0];
    if (topCatDish && topCatDish.price < avgPrice * 0.9) {
      const extra = (avgPrice - topCatDish.price) * topCatDish.volume * (1 / 4) * 4; // projeté par mois
      opportunityInsights.push({
        type: 'info',
        text: `Augmenter "${topCatDish.name}" de ${(avgPrice - topCatDish.price).toFixed(0)}€ (vers la moyenne de la catégorie) générerait ~${formatEur(extra)}/mois supplémentaires.`,
      });
    }
  }
  if (opportunityInsights.length > 0) insights.push(opportunityInsights[0]);

  // ── 6. Simplification de carte ────────────────────────────────────────────
  // 2 plats les moins vendus = potentiel de simplification stock
  const bottom2 = [...dishRevenues].sort((a, b) => a.volume - b.volume).slice(0, 2);
  const avg28dVolume = dishRevenues.reduce((s, d) => s + d.volume, 0) / dishRevenues.length;

  if (bottom2.every((d) => d.volume < avg28dVolume * 0.25)) {
    insights.push({
      type: 'warning',
      text: `"${bottom2[0].name}" et "${bottom2[1].name}" totalisent moins de ${bottom2[0].volume + bottom2[1].volume} ventes en 4 semaines. Les retirer simplifierait votre stock et réduirait le gaspillage.`,
    });
  }

  // ── 7. Semaine courante vs précédente ─────────────────────────────────────
  const revLastWeek = menu.reduce((s, d) => s + getRevenue(lastWeek, d.id, menu), 0);
  const revPrevWeek = menu.reduce((s, d) => s + getRevenue(prevWeek, d.id, menu), 0);

  if (revPrevWeek > 0) {
    const weekVar = ((revLastWeek - revPrevWeek) / revPrevWeek) * 100;
    if (Math.abs(weekVar) > 5) {
      insights.push({
        type: weekVar > 0 ? 'success' : 'danger',
        text: `Cette semaine, votre CA est ${weekVar > 0 ? 'en hausse' : 'en baisse'} de ${Math.abs(weekVar).toFixed(1)}% par rapport à la semaine précédente (${formatEur(revLastWeek)} vs ${formatEur(revPrevWeek)}).`,
      });
    }
  }

  // Limite à 6 insights maximum, priorité: success, danger, warning, info
  const priority = { success: 0, danger: 1, warning: 2, info: 3 };
  return insights
    .sort((a, b) => priority[a.type] - priority[b.type])
    .slice(0, 6);
}

/**
 * Calcule le statut d'un plat (pour les badges)
 * @returns {'bestseller'|'moyen'|'déclin'|'faux-bon'}
 */
export function getDishStatus(dish, sales, menu, weeks) {
  const allTime = sales;
  const totalRevenue = menu.reduce((s, d) => s + getRevenue(allTime, d.id, menu), 0);
  const dishRevenue = getRevenue(allTime, dish.id, menu);
  const dishVolume = getVolume(allTime, dish.id);

  // Bestseller: >15% du CA total
  if (dishRevenue / totalRevenue > 0.15) return 'bestseller';

  // En déclin: baisse >15% sur 2 semaines consécutives
  if (weeks.length >= 4) {
    const t12 = trendPercent(weeks[1], weeks[2], dish.id);
    const t23 = trendPercent(weeks[2], weeks[3], dish.id);
    if (t12 < -15 && t23 < -15) return 'déclin';
  }

  // Faux bon plat: top 3 réputation mais volume faible
  const allVolumes = menu.map((d) => getVolume(allTime, d.id)).sort((a, b) => a - b);
  const medianVol = allVolumes[Math.floor(allVolumes.length / 2)];
  const topReputation = [...menu].sort((a, b) => b.reputation - a.reputation).slice(0, 3);
  if (topReputation.some((d) => d.id === dish.id) && dishVolume < medianVol * 0.7) {
    return 'faux-bon';
  }

  return 'moyen';
}
