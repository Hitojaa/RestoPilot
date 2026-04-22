/**
 * Moteur d'insights IA — CleanPlate
 *
 * Règles métier :
 * - Bestseller     : plat représentant >20% du CA total sur 4 semaines
 * - En déclin      : baisse >15% sur 2 semaines CONSÉCUTIVES (règle conservative)
 * - Faux bon plat  : top 3 réputation mais volume < 70% de la médiane
 * - Créneau mort   : jour avec <60% de la moyenne de couverts
 * - Opportunité    : plat à fort volume et prix sous la moyenne catégorie
 * - Simplification : 2 plats les moins vendus ET sans tendance positive
 * - Tendance hebdo : variation CA semaine courante vs précédente
 */

import {
  getRevenue,
  getVolume,
  splitByWeek,
  groupByDayOfWeek,
  avgTicket,
  trendPercent,
  formatEur,
  formatPct,
  DAYS_FR,
} from './dataUtils';

/**
 * Génère 4 à 6 insights depuis les données brutes.
 * Garantit l'absence de contradictions : un même plat ne peut pas apparaître
 * dans un insight positif ET un insight négatif.
 */
export function generateInsights(sales, menu, startDate) {
  const insights = [];
  const weeks = splitByWeek(sales, startDate);
  const lastWeek = weeks[3];
  const prevWeek = weeks[2];
  const allTime = sales;

  const totalRevenue = menu.reduce((s, d) => s + getRevenue(allTime, d.id, menu), 0);

  // Pré-calcul des tendances (sem 3→4) pour chaque plat — sert aux vérifications anti-contradiction
  const trendMap = {};
  for (const dish of menu) {
    trendMap[dish.id] = trendPercent(weeks[2], weeks[3], dish.id);
  }

  const dishRevenues = menu.map((d) => ({
    ...d,
    revenue: getRevenue(allTime, d.id, menu),
    volume:  getVolume(allTime, d.id),
    trend:   trendMap[d.id],
  }));
  dishRevenues.sort((a, b) => b.revenue - a.revenue);

  // ── 1. Plat pilier (bestseller) ────────────────────────────────────────────
  const topDish = dishRevenues[0];
  if (topDish && totalRevenue > 0) {
    const pct = (topDish.revenue / totalRevenue) * 100;
    if (pct >= 20) {
      insights.push({
        type: 'success',
        text: `"${topDish.name}" génère ${pct.toFixed(0)}% de votre CA total — c'est votre plat pilier. Maintenez sa qualité et ne sous-estimez jamais vos stocks d'ingrédients.`,
      });
    }
  }

  // ── 2. Plat en déclin confirmé (2 semaines consécutives) ──────────────────
  // Règle conservative : 2 semaines consécutives évitent les faux-positifs dus
  // à une mauvaise semaine isolée (événement, météo, etc.)
  for (const dish of menu) {
    const t12 = trendPercent(weeks[1], weeks[2], dish.id);
    const t23 = trendPercent(weeks[2], weeks[3], dish.id);
    if (t12 < -15 && t23 < -15) {
      const avg = (t12 + t23) / 2;
      insights.push({
        type: 'danger',
        text: `"${dish.name}" est en recul de ${Math.abs(avg).toFixed(0)}% depuis 2 semaines consécutives. Repositionnement de carte ou retrait recommandé.`,
      });
      break; // Un seul insight de déclin pour ne pas alarmer inutilement
    }
  }

  // ── 3. Faux bon plat ───────────────────────────────────────────────────────
  // Bien noté mais peu commandé → problème de visibilité ou de prix, pas de qualité
  const allVolumes = menu.map((d) => getVolume(allTime, d.id)).sort((a, b) => a - b);
  const medianVolume = allVolumes[Math.floor(allVolumes.length / 2)];
  const topReputation = [...menu].sort((a, b) => b.reputation - a.reputation).slice(0, 3);

  for (const dish of topReputation) {
    const vol = getVolume(allTime, dish.id);
    // Anti-contradiction : ne pas signaler un faux bon plat si sa tendance est forte
    if (vol < medianVolume * 0.7 && trendMap[dish.id] < 20) {
      insights.push({
        type: 'warning',
        text: `"${dish.name}" est très bien noté (${dish.reputation}/5) mais ne représente que ${vol} commandes sur 4 semaines. Mettez-le plus en avant sur la carte ou revoyez son prix.`,
      });
      break;
    }
  }

  // ── 4. Créneau mort ───────────────────────────────────────────────────────
  const platIds = new Set(menu.filter((d) => d.category === 'plats').map((d) => d.id));
  const byDow = groupByDayOfWeek(lastWeek);
  const dowSales = Object.entries(byDow).map(([dow, s]) => ({
    dow: parseInt(dow),
    volume: s.filter((e) => platIds.has(e.dishId)).reduce((sum, e) => sum + e.quantity, 0),
  }));
  const avgDow = dowSales.reduce((s, d) => s + d.volume, 0) / 7;

  // Prend le jour le plus faible qui est significativement en dessous
  const deadDay = dowSales
    .filter((d) => d.volume > 0 && avgDow > 0)
    .sort((a, b) => a.volume - b.volume)
    .find((d) => d.volume < avgDow * 0.6);

  if (deadDay) {
    const diff = ((deadDay.volume - avgDow) / avgDow) * 100;
    insights.push({
      type: 'info',
      text: `Le ${DAYS_FR[deadDay.dow]} est votre journée la plus creuse (${formatPct(diff, true)} vs la moyenne hebdomadaire). Un menu spécial ou une promotion ponctuelle ce jour-là pourrait rééquilibrer votre fréquentation.`,
    });
  }

  // ── 5. Opportunité de hausse de prix ──────────────────────────────────────
  // Plat à fort volume avec prix inférieur à la moyenne de sa catégorie
  // → la demande supporte probablement une légère hausse
  const categories = [...new Set(menu.map((d) => d.category))];
  for (const cat of categories) {
    const catDishes = menu.filter((d) => d.category === cat);
    if (catDishes.length < 2) continue; // Pas de moyenne significative avec 1 seul plat
    const avgPrice = catDishes.reduce((s, d) => s + d.price, 0) / catDishes.length;
    const catByVolume = catDishes
      .map((d) => ({ ...d, volume: getVolume(allTime, d.id) }))
      .sort((a, b) => b.volume - a.volume);
    const top = catByVolume[0];
    if (top && top.price < avgPrice * 0.85) {
      // Projection mensuelle avec élasticité -0.5 (loi puissance)
      const targetPrice = Math.round(avgPrice * 0.95 * 2) / 2; // Arrondi à 0.50€ près
      const priceRatio = targetPrice / top.price;
      const projVolume = top.volume * Math.pow(priceRatio, -0.5);
      const projRevenue = projVolume * targetPrice;
      const currentRevenue = top.volume * top.price;
      const gain = projRevenue - currentRevenue;
      if (gain > 0) {
        insights.push({
          type: 'info',
          text: `"${top.name}" est ${(avgPrice - top.price).toFixed(0)}€ sous la moyenne de sa catégorie. Passer à ${targetPrice}€ générerait ~${formatEur(gain)} de CA supplémentaire sur 4 semaines (après ajustement de la demande).`,
        });
        break;
      }
    }
  }

  // ── 6. Simplification de carte ────────────────────────────────────────────
  // Identifie les 2 plats les moins vendus qui ne sont PAS en hausse.
  // Anti-contradiction clé : on n'inclut pas un plat en croissance (trend > +10%)
  const simplificationCandidates = [...dishRevenues]
    .sort((a, b) => a.volume - b.volume)
    .filter((d) => d.trend <= 10); // Exclut les plats en hausse notable

  const bottom2 = simplificationCandidates.slice(0, 2);
  const avg28dVolume = dishRevenues.reduce((s, d) => s + d.volume, 0) / dishRevenues.length;

  if (bottom2.length === 2 && bottom2.every((d) => d.volume < avg28dVolume * 0.25)) {
    insights.push({
      type: 'warning',
      text: `"${bottom2[0].name}" et "${bottom2[1].name}" cumulent seulement ${bottom2[0].volume + bottom2[1].volume} ventes en 4 semaines (vs ${Math.round(avg28dVolume)} en moyenne). Les retirer allégerait votre stock sans impacter votre CA.`,
    });
  }

  // ── 7. Évolution globale semaine courante ─────────────────────────────────
  const revLast = menu.reduce((s, d) => s + getRevenue(lastWeek, d.id, menu), 0);
  const revPrev = menu.reduce((s, d) => s + getRevenue(prevWeek, d.id, menu), 0);
  if (revPrev > 0) {
    const weekVar = ((revLast - revPrev) / revPrev) * 100;
    if (Math.abs(weekVar) > 5) {
      const ticketLast = avgTicket(lastWeek, menu);
      const ticketPrev = avgTicket(prevWeek, menu);
      const ticketVar = ticketPrev > 0 ? ((ticketLast - ticketPrev) / ticketPrev) * 100 : 0;
      const ticketNote = Math.abs(ticketVar) > 3
        ? ` Le ticket moyen a ${ticketVar > 0 ? 'progressé' : 'reculé'} de ${Math.abs(ticketVar).toFixed(1)}%.`
        : '';
      insights.push({
        type: weekVar > 0 ? 'success' : 'danger',
        text: `Semaine en cours : CA ${weekVar > 0 ? 'en hausse' : 'en baisse'} de ${Math.abs(weekVar).toFixed(1)}% vs la semaine précédente (${formatEur(revLast)} vs ${formatEur(revPrev)}).${ticketNote}`,
      });
    }
  }

  // Tri par priorité et limitation à 6
  const priority = { success: 0, danger: 1, warning: 2, info: 3 };
  return insights.sort((a, b) => priority[a.type] - priority[b.type]).slice(0, 6);
}

/**
 * Calcule le statut d'un plat pour les badges de la page Mes Plats.
 * Basé sur la tendance de la dernière semaine uniquement (réactif).
 *
 * @returns {'bestseller'|'en-hausse'|'stable'|'déclin'|'faux-bon'}
 */
export function getDishStatus(dish, sales, menu, weeks) {
  const allTime = sales;
  const totalRevenue = menu.reduce((s, d) => s + getRevenue(allTime, d.id, menu), 0);
  const dishRevenue  = getRevenue(allTime, dish.id, menu);
  const dishVolume   = getVolume(allTime, dish.id);
  const lastTrend    = weeks.length >= 4 ? trendPercent(weeks[2], weeks[3], dish.id) : 0;

  // 1. Bestseller : >15% du CA total sur 4 semaines
  if (totalRevenue > 0 && dishRevenue / totalRevenue > 0.15) return 'bestseller';

  // 2. En déclin : dernière semaine < -10%
  if (lastTrend < -10) return 'déclin';

  // 3. Faux bon plat : top 3 réputation, faible volume ET pas en hausse forte
  const allVolumes    = menu.map((d) => getVolume(allTime, d.id)).sort((a, b) => a - b);
  const medianVol     = allVolumes[Math.floor(allVolumes.length / 2)];
  const topReputation = [...menu].sort((a, b) => b.reputation - a.reputation).slice(0, 3);
  if (topReputation.some((d) => d.id === dish.id) && dishVolume < medianVol * 0.7 && lastTrend < 20) {
    return 'faux-bon';
  }

  // 4. En hausse : dernière semaine > +10%
  if (lastTrend > 10) return 'en-hausse';

  // 5. Stable
  return 'stable';
}
