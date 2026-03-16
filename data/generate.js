/**
 * Script de génération des données de ventes mockées
 * Brasserie Le Marais — 4 semaines du 2026-02-16 au 2026-03-15
 *
 * Run: node data/generate.js
 * Output: data/sales.json
 */

const fs = require('fs');

// ── Configuration temporelle ──────────────────────────────────────────────────
const START_DATE = new Date('2026-02-16');
const DAYS = 28;

// Créneaux horaires réalistes (service midi + service soir)
const LUNCH_HOURS = [11, 12, 13, 14, 15];
const DINNER_HOURS = [18, 19, 20, 21, 22];
const ALL_HOURS = [...LUNCH_HOURS, ...DINNER_HOURS];

// ── Profil de base par plat ───────────────────────────────────────────────────
// baseVolume: ventes/jour en semaine (normalisé)
// lunchRatio: part du midi (vs soir)
// trend: facteur de tendance par semaine (+: hausse, -: déclin)
// noise: amplitude de variation aléatoire
const DISH_PROFILES = {
  d001: { baseVolume: 8,  lunchRatio: 0.5, trend: 0.02,  noise: 0.2 },  // Tartare bœuf — stable
  d002: { baseVolume: 5,  lunchRatio: 0.6, trend: -0.08, noise: 0.3 },  // Soupe oignon — déclin fort
  d003: { baseVolume: 4,  lunchRatio: 0.7, trend: -0.03, noise: 0.25 }, // Salade niçoise — léger déclin
  d004: { baseVolume: 3,  lunchRatio: 0.55,trend: 0.0,   noise: 0.35 }, // Terrine — faible
  d005: { baseVolume: 22, lunchRatio: 0.4, trend: 0.03,  noise: 0.15 }, // Entrecôte — pilier
  d006: { baseVolume: 6,  lunchRatio: 0.85,trend: -0.01, noise: 0.2 },  // Croque — midi surtout
  d007: { baseVolume: 7,  lunchRatio: 0.35,trend: 0.05,  noise: 0.2 },  // Coq au vin — hausse
  d008: { baseVolume: 9,  lunchRatio: 0.45,trend: 0.01,  noise: 0.2 },  // Steak tartare
  d009: { baseVolume: 14, lunchRatio: 0.95,trend: 0.02,  noise: 0.15 }, // Formule midi — très lié au midi
  d010: { baseVolume: 8,  lunchRatio: 0.4, trend: 0.04,  noise: 0.25 }, // Moules — hausse
  d011: { baseVolume: 5,  lunchRatio: 0.45,trend: -0.02, noise: 0.3 },  // Bavette — stable bas
  d012: { baseVolume: 10, lunchRatio: 0.5, trend: 0.01,  noise: 0.2 },  // Tarte Tatin
  d013: { baseVolume: 8,  lunchRatio: 0.45,trend: 0.0,   noise: 0.2 },  // Crème brûlée
  d014: { baseVolume: 4,  lunchRatio: 0.4, trend: 0.0,   noise: 0.3 },  // Profiteroles — faux bon plat (réputation 4.3 mais faible)
  d015: { baseVolume: 3,  lunchRatio: 0.5, trend: -0.05, noise: 0.35 }, // Mousse choco — déclin
  d016: { baseVolume: 18, lunchRatio: 0.4, trend: 0.02,  noise: 0.15 }, // Bordeaux — fort
  d017: { baseVolume: 6,  lunchRatio: 0.2, trend: 0.03,  noise: 0.25 }, // Kir royal — soir
  d018: { baseVolume: 12, lunchRatio: 0.55,trend: 0.01,  noise: 0.2 },  // Café gourmand
};

// Facteur jour de la semaine (0=Lundi, 6=Dimanche)
const DAY_MULTIPLIERS = [0.75, 0.70, 0.85, 1.05, 1.20, 1.35, 1.10];

// Profil horaire (part relative de ventes par heure)
const HOUR_PROFILES = {
  11: 0.06, 12: 0.28, 13: 0.35, 14: 0.20, 15: 0.11,
  18: 0.05, 19: 0.20, 20: 0.35, 21: 0.28, 22: 0.12,
};

// ── Utilitaires ───────────────────────────────────────────────────────────────
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

// ── Génération des ventes ─────────────────────────────────────────────────────
const sales = [];
let seedCounter = 42;

for (let day = 0; day < DAYS; day++) {
  const date = addDays(START_DATE, day);
  const dateStr = formatDate(date);
  const dayOfWeek = (date.getDay() + 6) % 7; // 0=Lundi
  const weekIndex = Math.floor(day / 7);      // 0-3
  const isWeekend = dayOfWeek >= 5;

  for (const [dishId, profile] of Object.entries(DISH_PROFILES)) {
    const rand = seededRandom(seedCounter++);

    // Volume de base ajusté par tendance et jour
    const trendFactor = 1 + profile.trend * weekIndex;
    const dayFactor = DAY_MULTIPLIERS[dayOfWeek];
    const weekendBonus = isWeekend ? 1.15 : 1.0;
    const baseDaily = profile.baseVolume * trendFactor * dayFactor * weekendBonus;

    if (baseDaily <= 0) continue;

    for (const hour of ALL_HOURS) {
      const isLunch = LUNCH_HOURS.includes(hour);
      const timeFactor = isLunch ? profile.lunchRatio : (1 - profile.lunchRatio);
      const hourShare = HOUR_PROFILES[hour];
      const normalizer = isLunch
        ? LUNCH_HOURS.reduce((s, h) => s + HOUR_PROFILES[h], 0)
        : DINNER_HOURS.reduce((s, h) => s + HOUR_PROFILES[h], 0);

      const expectedQty = baseDaily * timeFactor * (hourShare / normalizer);

      // Variation aléatoire avec bruit gaussien simplifié
      const noise = (rand() + rand() + rand() - 1.5) * profile.noise;
      const rawQty = expectedQty * (1 + noise);
      const quantity = Math.max(0, Math.round(rawQty));

      if (quantity > 0) {
        sales.push({ date: dateStr, dishId, hour, quantity });
      }
    }
  }
}

// ── Écriture du fichier ───────────────────────────────────────────────────────
const output = JSON.stringify({ sales }, null, 2);
fs.writeFileSync(__dirname + '/sales.json', output);
console.log(`✅ Généré ${sales.length} entrées de ventes sur ${DAYS} jours.`);
