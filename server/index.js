/**
 * CleanPlate — Serveur Express
 * Sert les données mock JSON via une API REST simple
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, '..', 'data');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
}));
app.use(express.json());

// ── Helper ────────────────────────────────────────────────────────────────────
function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier non trouvé : ${filename}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// ── Routes API ────────────────────────────────────────────────────────────────

// GET /api/menu — Liste des plats
app.get('/api/menu', (req, res) => {
  try {
    const data = readJSON('menu.json');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sales — Données de ventes complètes
app.get('/api/sales', (req, res) => {
  try {
    const data = readJSON('sales.json');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sales?date=YYYY-MM-DD — Ventes d'un jour spécifique
app.get('/api/sales/day', (req, res) => {
  try {
    const { date } = req.query;
    const { sales } = readJSON('sales.json');
    const filtered = date ? sales.filter((s) => s.date === date) : sales;
    res.json({ sales: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats — Résumé rapide (CA total, couverts, ticket moyen)
app.get('/api/stats', (req, res) => {
  try {
    const { dishes } = readJSON('menu.json');
    const { sales } = readJSON('sales.json');

    const priceMap = Object.fromEntries(dishes.map((d) => [d.id, d.price]));
    const platIds = new Set(dishes.filter((d) => d.category === 'plats').map((d) => d.id));

    const totalRevenue = sales.reduce((s, e) => s + e.quantity * (priceMap[e.dishId] || 0), 0);
    const totalCovers = sales
      .filter((s) => platIds.has(s.dishId))
      .reduce((s, e) => s + e.quantity, 0);

    res.json({
      totalRevenue: Math.round(totalRevenue),
      totalCovers,
      avgTicket: totalCovers > 0 ? Math.round(totalRevenue / totalCovers) : 0,
      period: { start: '2026-02-16', end: '2026-03-15', days: 28 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/generate-ingredients — Génère les ingrédients d'un plat via Groq
app.post('/api/generate-ingredients', async (req, res) => {
  const { dishName, category } = req.body;
  if (!dishName) return res.status(400).json({ error: 'dishName requis' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'GROQ_API_KEY non configurée. Ajoutez GROQ_API_KEY=sk-... dans server/.env puis redémarrez le serveur.',
    });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Tu es un chef cuisinier professionnel français. Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte autour.',
          },
          {
            role: 'user',
            content: `Donne les ingrédients pour 1 portion de "${dishName}" (catégorie: ${category || 'plat'}) avec les quantités ET le prix grossiste indicatif France (type Metro/Promocash) en euros.
JSON exact attendu: {"ingredients":[{"name":"bœuf haché","quantity":180,"unit":"g","unitPrice":8.50}]}
Règles unitPrice:
- ingrédients en g ou kg → prix par kg (ex: bœuf 8-12€/kg, farine 0.8€/kg, beurre 7€/kg)
- ingrédients en cl, ml ou L → prix par litre (ex: crème 2.5€/L, huile olive 4€/L, vin 3€/L)
- ingrédients en pièce(s) → prix par pièce (ex: œuf 0.20€, citron 0.30€)
Utiliser des prix grossiste France réalistes (Metro, Promocash, Transgourmet), pas grande surface.
Unités autorisées: g, kg, cl, ml, L, pièce(s). Entre 4 et 10 ingrédients.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: `Groq API ${response.status}`, details: text.slice(0, 300) });
    }

    const data = await response.json();
    const content = (data.choices?.[0]?.message?.content || '').trim();
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Réponse non parseable: ${content.slice(0, 100)}`);

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.ingredients)) throw new Error('Format inattendu (ingredients manquant)');

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Serve static client (production) ─────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '0.1.0', timestamp: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🍽️  CleanPlate API → http://localhost:${PORT}`);
  console.log(`   Données: ${DATA_DIR}`);
});
