/**
 * Parseur CSV multi-formats pour caisses de restaurant françaises.
 *
 * Formats supportés :
 *  - Zelty           (séparateur ; — fr)
 *  - Lightspeed      (séparateur , — en)
 *  - L'Addition      (séparateur ; — fr, dates DD/MM/YYYY)
 *  - Générique       (auto-détection)
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse une ligne CSV en tenant compte des guillemets */
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

/** Normalise une date en YYYY-MM-DD (accepte YYYY-MM-DD ou DD/MM/YYYY) */
function normalizeDate(str) {
  if (!str) return null;
  str = str.trim().replace(/"/g, '');
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  return null;
}

/** Extrait l'heure depuis "HH:MM" ou "HHhMM" ou nombre seul */
function normalizeHour(str) {
  if (!str) return 12;
  str = str.trim().replace(/"/g, '');
  const m = str.match(/(\d{1,2})[h:]/);
  if (m) return parseInt(m[1]);
  const n = parseInt(str);
  return isNaN(n) ? 12 : n;
}

/** Normalise un prix ("26,00" ou "26.00" ou "26") → float */
function normalizePrice(str) {
  if (!str) return 0;
  return parseFloat(String(str).replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
}

/** Normalise une quantité */
function normalizeQty(str) {
  const n = parseInt(str);
  return isNaN(n) || n <= 0 ? 1 : n;
}

// ── Détection de format ───────────────────────────────────────────────────────

function detectFormat(headers, sep) {
  const h = headers.map(x => x.toLowerCase().replace(/['"]/g, '').trim());
  const has = (...keys) => keys.every(k => h.some(x => x.includes(k)));

  // Zelty : Article, Famille, PU TTC
  if (sep === ';' && h.some(x => x.includes('article')) && h.some(x => x.includes('famille'))) {
    if (h.some(x => x.includes('pu ttc') || x.includes('p.u') || x.includes('prix unit')))
      return 'zelty';
  }
  // Lightspeed : Item, Category, Unit Price
  if (sep === ',' && h.some(x => x.includes('item') || x.includes('article'))) {
    if (h.some(x => x.includes('unit price') || x.includes('category')))
      return 'lightspeed';
  }
  // L'Addition : Désignation, N° Ticket
  if (sep === ';' && h.some(x => x.includes('désignation') || x.includes('designation'))) {
    return 'laddition';
  }
  return 'generic';
}

// ── Mappings colonnes par format ──────────────────────────────────────────────

const FORMAT_MAPS = {
  zelty: {
    date:     ['date'],
    hour:     ['heure'],
    name:     ['article'],
    category: ['famille'],
    qty:      ['quantité', 'quantite', 'qté', 'qty'],
    price:    ['pu ttc', 'p.u. ttc', 'prix unit'],
  },
  lightspeed: {
    date:     ['date'],
    hour:     ['time', 'heure'],
    name:     ['item', 'article', 'product'],
    category: ['category', 'famille', 'catégorie'],
    qty:      ['qty', 'quantity', 'quantité'],
    price:    ['unit price', 'prix unitaire', 'pu'],
  },
  laddition: {
    date:     ['date'],
    hour:     ['heure'],
    name:     ['désignation', 'designation', 'article'],
    category: ['famille', 'catégorie', 'category'],
    qty:      ['qté', 'quantité', 'qty'],
    price:    ['prix unitaire', 'pu ttc', 'pu'],
  },
  generic: {
    date:     ['date'],
    hour:     ['heure', 'hour', 'time'],
    name:     ['article', 'item', 'plat', 'désignation', 'designation', 'product', 'nom'],
    category: ['famille', 'category', 'catégorie', 'type'],
    qty:      ['qté', 'quantité', 'qty', 'quantity', 'nb'],
    price:    ['prix', 'price', 'pu ttc', 'montant', 'total', 'unit price'],
  },
};

function findColIndex(headers, aliases) {
  const h = headers.map(x => x.toLowerCase().replace(/['"]/g, '').trim());
  for (const alias of aliases) {
    const idx = h.findIndex(x => x.includes(alias));
    if (idx !== -1) return idx;
  }
  return -1;
}

// ── Parser principal ──────────────────────────────────────────────────────────

/**
 * Parse un CSV de caisse et retourne { menu, sales, startDate }
 * Compatible avec useData / useSettings format interne.
 *
 * @param {string} content  — contenu brut du fichier CSV
 * @returns {{ menu: Array, sales: Array, startDate: string, format: string }}
 */
export function parseCSV(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('Fichier vide ou invalide.');

  // Détecte le séparateur
  const firstLine = lines[0];
  const sep = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';

  const headers = parseLine(firstLine, sep);
  const format  = detectFormat(headers, sep);
  const map     = FORMAT_MAPS[format];

  const colDate  = findColIndex(headers, map.date);
  const colHour  = findColIndex(headers, map.hour);
  const colName  = findColIndex(headers, map.name);
  const colCat   = findColIndex(headers, map.category);
  const colQty   = findColIndex(headers, map.qty);
  const colPrice = findColIndex(headers, map.price);

  if (colName === -1) throw new Error(`Colonne "article/plat" introuvable. Colonnes détectées : ${headers.join(', ')}`);
  if (colDate === -1) throw new Error(`Colonne "date" introuvable.`);

  // Construire menu (dédupliqué par nom) + sales
  const menuMap = new Map(); // name → { id, name, category, price, reputation }
  const rawSales = [];
  let idCounter = 1;

  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i], sep);
    if (row.length < 2) continue;

    const date  = normalizeDate(colDate !== -1 ? row[colDate] : '');
    if (!date) continue;

    const name  = (colName !== -1 ? row[colName] : '').replace(/^"|"$/g, '').trim();
    if (!name) continue;

    const hour  = normalizeHour(colHour !== -1 ? row[colHour] : '12');
    const cat   = (colCat  !== -1 ? row[colCat]  : 'Autres').replace(/^"|"$/g, '').trim() || 'Autres';
    const qty   = normalizeQty(colQty  !== -1 ? row[colQty]  : '1');
    const price = normalizePrice(colPrice !== -1 ? row[colPrice] : '0');

    // Upsert menu
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
      // Met à jour le prix si on avait le placeholder
      menuMap.get(name).price = price;
    }

    const dishId = menuMap.get(name).id;
    // Chaque ligne = qty ventes individuelles
    for (let q = 0; q < qty; q++) {
      rawSales.push({ date, dishId, hour, quantity: 1 });
    }
  }

  if (rawSales.length === 0) throw new Error('Aucune ligne de vente valide trouvée dans le fichier.');

  // Calcule la startDate = premier lundi avant ou égal à la date min
  const dates = rawSales.map(s => s.date).sort();
  const minDate = new Date(dates[0]);
  const dow = (minDate.getDay() + 6) % 7; // 0=Lun
  minDate.setDate(minDate.getDate() - dow);
  const startDate = minDate.toISOString().slice(0, 10);

  const menu  = Array.from(menuMap.values());
  const sales = rawSales.sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);

  return { menu, sales, startDate, format, rowCount: sales.length, dishCount: menu.length };
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
