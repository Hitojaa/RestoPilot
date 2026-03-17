/**
 * Parseur CSV multi-formats pour caisses de restaurant.
 * Détecte automatiquement les colonnes par scoring de similarité.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseLine(line, sep) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === sep && !inQ) { result.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  result.push(cur.trim());
  return result;
}

function normalizeDate(str) {
  if (!str) return null;
  str = str.trim().replace(/"/g, '');
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

function normalizeHour(str) {
  if (!str) return 12;
  str = str.trim().replace(/"/g, '');
  const m = str.match(/(\d{1,2})[h:]/);
  if (m) return parseInt(m[1]);
  const n = parseInt(str);
  return isNaN(n) ? 12 : n;
}

function normalizePrice(str) {
  if (!str) return 0;
  return parseFloat(String(str).replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
}

function normalizeQty(str) {
  const n = parseInt(str);
  return isNaN(n) || n <= 0 ? 1 : n;
}

// ── Détection automatique de colonnes ─────────────────────────────────────────

/** Distance de Levenshtein entre deux chaînes */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

/** Normalise un header pour comparaison (minuscules, sans accents, sans ponctuation) */
function norm(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['"()\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Alias par champ interne — couvrent les principaux POS (FR + INT) */
const FIELD_ALIASES = {
  date: [
    'date', 'date vente', 'date commande', 'date ticket', 'date transaction',
    'date de vente', 'date paiement', 'date ordre', 'date facture',
    'order date', 'transaction date', 'sale date', 'business date',
    'created at', 'paid date', 'payment date', 'jour', 'journee',
  ],
  hour: [
    'heure', 'heure vente', 'heure commande', 'heure ticket', 'horaire',
    'heure de vente', 'time', 'hour', 'order time', 'transaction time',
    'sale time', 'paid time', 'payment time',
  ],
  name: [
    'article', 'designation', 'libelle', 'libelle article', 'nom article',
    'intitule', 'plat', 'produit', 'nom produit', 'nom', 'label',
    'item', 'item name', 'product', 'product name', 'menu item',
    'description', 'payment title', 'lineitem name', 'item selection',
  ],
  category: [
    'famille', 'categorie', 'type', 'rayon', 'gamme', 'rubrique',
    'sous famille', 'category', 'family', 'group', 'department', 'type produit',
  ],
  qty: [
    'qte', 'quantite', 'nb', 'nombre', 'nb vendu', 'nombre vendu',
    'qty', 'quantity', 'qty sold', 'quantity sold', 'units', 'count',
    'lineitem quantity', 'nb articles', 'nb couverts',
  ],
  price: [
    'pu ttc', 'p.u. ttc', 'prix unitaire', 'prix unit', 'prix ttc',
    'prix de vente', 'tarif ttc', 'tarif', 'montant unitaire',
    'ca ttc', 'ca ht', 'montant ttc', 'prix',
    'unit price', 'price', 'net amount', 'gross sales', 'net sales',
    'amount', 'net', 'lineitem price', 'rate',
  ],
};

/** Score 0–1 d'une colonne pour un champ donné */
function scoreColumn(rawHeader, field) {
  const h = norm(rawHeader);
  if (!h) return 0;
  const aliases = FIELD_ALIASES[field];
  let best = 0;
  for (const alias of aliases) {
    const a = norm(alias);
    if (h === a) return 1.0;
    if (h.includes(a) || a.includes(h)) {
      best = Math.max(best, 0.85);
      continue;
    }
    // Levenshtein pour les courtes chaînes seulement
    if (h.length <= 20 && a.length <= 20) {
      const maxLen = Math.max(h.length, a.length);
      const dist = levenshtein(h, a);
      const sim = 1 - dist / maxLen;
      if (sim > 0.7) best = Math.max(best, sim * 0.6);
    }
  }
  return best;
}

/**
 * Détecte le meilleur mapping colonnes → champs internes.
 * Retourne { date, hour, name, category, qty, price }
 * Chaque champ : { idx: number, name: string, score: number }
 */
export function detectColumns(headers) {
  // Ordre de priorité pour l'assignation (greedy)
  const PRIORITY = ['name', 'date', 'category', 'price', 'qty', 'hour'];

  // Calcule les scores de chaque header pour chaque champ
  const candidates = {};
  for (const field of PRIORITY) {
    candidates[field] = headers
      .map((h, idx) => ({ idx, name: h, score: scoreColumn(h, field) }))
      .filter(c => c.score > 0.3)
      .sort((a, b) => b.score - a.score);
  }

  // Assigne greedily (une colonne → un seul champ)
  const used = new Set();
  const mapping = {};
  for (const field of PRIORITY) {
    const best = candidates[field].find(c => !used.has(c.idx));
    if (best) {
      mapping[field] = { idx: best.idx, name: best.name, score: best.score };
      used.add(best.idx);
    } else {
      mapping[field] = { idx: -1, name: null, score: 0 };
    }
  }
  return mapping;
}

/**
 * Lit un CSV, détecte le séparateur, extrait les headers + 3 lignes d'exemple
 * et propose un mapping automatique.
 */
export function detectColumnsFromCSV(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('Fichier vide ou invalide.');

  const sep = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
  const headers = parseLine(lines[0], sep);
  const samples = lines.slice(1, 4).map(l => parseLine(l, sep));
  const mapping = detectColumns(headers);

  return { headers, samples, mapping, sep };
}

// ── Parser principal ──────────────────────────────────────────────────────────

/**
 * Parse un CSV avec un mapping de colonnes explicite.
 * @param {string} content   — contenu brut du fichier CSV
 * @param {Object} colMap    — { date, hour, name, category, qty, price } → indices de colonnes (ou -1)
 */
export function parseCSVWithMapping(content, colMap) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('Fichier vide ou invalide.');

  const sep = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';

  const { date: ci_date, hour: ci_hour, name: ci_name, category: ci_cat, qty: ci_qty, price: ci_price } = colMap;

  if (ci_name === -1) throw new Error('Colonne "nom du plat" non mappée. Vérifiez le mapping des colonnes.');
  if (ci_date === -1) throw new Error('Colonne "date" non mappée. Vérifiez le mapping des colonnes.');

  const menuMap = new Map();
  const rawSales = [];
  let idCounter = 1;

  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i], sep);
    if (row.length < 2) continue;

    const date = normalizeDate(ci_date !== -1 ? row[ci_date] : '');
    if (!date) continue;

    const name = (ci_name !== -1 ? row[ci_name] : '').replace(/^"|"$/g, '').trim();
    if (!name) continue;

    const hour  = normalizeHour(ci_hour !== -1 ? row[ci_hour] : '12');
    const cat   = (ci_cat   !== -1 ? row[ci_cat]   : 'Autres').replace(/^"|"$/g, '').trim() || 'Autres';
    const qty   = normalizeQty(ci_qty   !== -1 ? row[ci_qty]   : '1');
    const price = normalizePrice(ci_price !== -1 ? row[ci_price] : '0');

    if (!menuMap.has(name)) {
      menuMap.set(name, {
        id:          `d${String(idCounter++).padStart(3, '0')}`,
        name,
        category:    cat.toLowerCase(),
        price:       price || 10,
        reputation:  4.0,
        description: '',
      });
    } else if (price > 0 && menuMap.get(name).price === 10) {
      menuMap.get(name).price = price;
    }

    const dishId = menuMap.get(name).id;
    for (let q = 0; q < qty; q++) {
      rawSales.push({ date, dishId, hour, quantity: 1 });
    }
  }

  if (rawSales.length === 0) throw new Error('Aucune ligne de vente valide trouvée dans le fichier.');

  const dates = rawSales.map(s => s.date).sort();
  const minDate = new Date(dates[0]);
  const dow = (minDate.getDay() + 6) % 7;
  minDate.setDate(minDate.getDate() - dow);
  const startDate = minDate.toISOString().slice(0, 10);

  const menu  = Array.from(menuMap.values());
  const sales = rawSales.sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);

  return { menu, sales, startDate, format: 'auto', rowCount: sales.length, dishCount: menu.length };
}

/**
 * Parse un CSV — auto-détecte les colonnes puis parse.
 * Compatible avec l'ancienne API.
 */
export function parseCSV(content) {
  const { mapping } = detectColumnsFromCSV(content);
  const colMap = Object.fromEntries(
    Object.entries(mapping).map(([field, v]) => [field, v.idx])
  );
  return parseCSVWithMapping(content, colMap);
}

/** Sauvegarde les données parsées dans localStorage */
export function saveImportedData(userId, { menu, sales, startDate }) {
  const payload = JSON.stringify({ menu, sales, startDate, importedAt: new Date().toISOString() });
  localStorage.setItem(`restopilot_imported_${userId}`, payload);
  window.dispatchEvent(new CustomEvent('restopilot:imported'));
}

/** Supprime les données importées (retour aux données mock) */
export function clearImportedData(userId) {
  localStorage.removeItem(`restopilot_imported_${userId}`);
  window.dispatchEvent(new CustomEvent('restopilot:imported'));
}
