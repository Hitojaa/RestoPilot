# 🍽️ RestoPilot

**Dashboard analytique SaaS pour restaurateurs** — MVP brasserie/bistrot parisien.

RestoPilot transforme les données de vente en insights actionnables : quels plats supprimer, quand et où promouvoir, comment ajuster les prix.

---

## ✨ Fonctionnalités

| Page | Contenu |
|------|---------|
| **Dashboard** | KPIs semaine (CA, ticket moyen, couverts, plat #1) · Courbe CA 4 semaines · Heures de pointe · Insights IA |
| **Mes Plats** | Tableau complet avec badges statut (Bestseller / Moyen / En déclin / Faux bon plat) · Filtre catégorie · Tri colonnes · Tendance vs semaine précédente |
| **Heures & Jours** | Heatmap jours × heures · Couverts par jour de semaine · Profil service midi/soir · Créneaux morts |
| **Prix & Revenus** | Simulateur de prix avec élasticité · Top 5 CA vs Top 5 volume · Évolution ticket moyen |

---

## 🛠️ Stack technique

- **Frontend** : React 18 + Vite 6 + TailwindCSS 3
- **Graphiques** : Recharts
- **Backend** : Node.js + Express 4
- **Données** : JSON local (mock) — pas de base de données requise
- **Routeur** : React Router DOM v6

---

## 🚀 Installation & Démarrage

### Prérequis
- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# Cloner le repo
git clone <url> && cd restopilot

# Installer toutes les dépendances (racine + client + serveur)
npm run install:all
```

### Développement

```bash
# Démarrer client ET serveur en parallèle
npm run dev
```

- **Client** → [http://localhost:5173](http://localhost:5173)
- **API** → [http://localhost:3001](http://localhost:3001)

### Production

```bash
# Builder le client
npm run build

# Démarrer le serveur (sert aussi le client buildé)
NODE_ENV=production npm start
```

---

## 📁 Structure des fichiers

```
restopilot/
├── client/                     # Application React (Vite)
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Layout.jsx        # Wrapper principal (sidebar + header)
│   │   │   │   ├── Sidebar.jsx       # Navigation latérale
│   │   │   │   └── Header.jsx        # En-tête avec date et nom du restaurant
│   │   │   ├── dashboard/
│   │   │   │   ├── KPICard.jsx       # Carte métrique générique
│   │   │   │   ├── RevenueChart.jsx  # Courbe CA (AreaChart)
│   │   │   │   ├── PeakHoursChart.jsx# BarChart heures de pointe
│   │   │   │   └── InsightsPanel.jsx # Panneau insights IA
│   │   │   ├── dishes/
│   │   │   │   └── DishBadge.jsx     # Badge coloré par statut de plat
│   │   │   └── schedule/
│   │   │       └── Heatmap.jsx       # Heatmap jours × heures
│   │   ├── hooks/
│   │   │   └── useData.js            # Hook de chargement des données API
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Page d'accueil (KPIs + charts + insights)
│   │   │   ├── Dishes.jsx            # Tableau des plats avec filtres
│   │   │   ├── Schedule.jsx          # Heures et jours (heatmap + barChart)
│   │   │   └── Pricing.jsx           # Prix, revenus, simulateur
│   │   ├── utils/
│   │   │   ├── dataUtils.js          # Fonctions pures de calcul (agrégation, formatage)
│   │   │   └── insights.js           # Moteur d'insights IA (règles métier)
│   │   ├── App.jsx                   # Router principal
│   │   ├── main.jsx                  # Point d'entrée React
│   │   └── index.css                 # Styles globaux + utilities Tailwind
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/
│   ├── index.js                      # Serveur Express + routes API
│   └── package.json
│
├── data/
│   ├── menu.json                     # 18 plats (id, nom, catégorie, prix, réputation)
│   ├── sales.json                    # ~2700 entrées de ventes sur 28 jours
│   └── generate.js                   # Script de génération des données mock
│
├── package.json                      # Scripts racine (dev, build, install:all)
└── README.md
```

---

## 📊 Format des données

### `data/menu.json`

```json
{
  "dishes": [
    {
      "id": "d001",
      "name": "Tartare de bœuf",
      "category": "entrées",    // "entrées" | "plats" | "desserts" | "boissons"
      "price": 16,              // prix en €
      "reputation": 4.7,        // note moyenne /5 (pour détection faux bons plats)
      "description": "..."
    }
  ]
}
```

### `data/sales.json`

```json
{
  "sales": [
    {
      "date": "2026-02-16",     // ISO date (YYYY-MM-DD)
      "dishId": "d001",         // ref vers menu.json
      "hour": 12,               // créneau horaire (11-15 midi, 18-22 soir)
      "quantity": 5             // nombre de plats vendus sur ce créneau
    }
  ]
}
```

### Régénérer les données mock

```bash
node data/generate.js
# → data/sales.json mis à jour avec de nouvelles données aléatoires
```

### Ajouter de vraies données

Remplacez ou complétez `data/sales.json` en respectant le format ci-dessus.
Assurez-vous que chaque `dishId` correspond à un `id` dans `menu.json`.

---

## 🧠 Logique des Insights IA

Fichier : `client/src/utils/insights.js`

Les insights sont calculés par la fonction pure `generateInsights(sales, menu, startDate)` selon ces règles :

| Insight | Règle |
|---------|-------|
| **Bestseller** | Plat générant >20% du CA total sur 4 semaines |
| **En déclin** | Baisse de volume >15% sur 2 semaines consécutives |
| **Faux bon plat** | Top 3 réputation mais volume <70% de la médiane |
| **Créneau mort** | Jour avec <60% de la moyenne des couverts journaliers |
| **Opportunité prix** | Plat à fort volume avec prix <90% de la moyenne de sa catégorie |
| **Simplification carte** | 2 plats cumulant <25% du volume moyen par plat |

---

## 🗺️ Roadmap

### Phase 2 — Intégrations POS
- [ ] API **Lightspeed Restaurant** (OAuth 2.0, sync ventes en temps réel)
- [ ] API **Zelty** (import automatique des tickets)
- [ ] Webhook **Sumeria / Caisse** pour flux temps réel

### Phase 3 — Multi-restaurant & Auth
- [ ] Authentification multi-tenants (Auth.js + PostgreSQL)
- [ ] Tableau de bord centralisé pour groupes de restaurants
- [ ] Gestion des rôles : Manager, Chef, Admin

### Phase 4 — IA avancée
- [ ] Prédiction de ventes (ML léger, régression)
- [ ] Recommandations de menu automatisées
- [ ] Alertes email/SMS sur anomalies détectées

### Phase 5 — Déploiement
- [ ] Déploiement Vercel (frontend) + Railway (backend)
- [ ] CI/CD GitHub Actions
- [ ] Monitoring Sentry + analytics Posthog

---

## 🚢 Déploiement Vercel (Frontend uniquement)

```bash
# Depuis le dossier client/
cd client
npm run build
# Déployez le dossier dist/ sur Vercel ou tout hébergeur statique
```

Configurez la variable d'environnement `VITE_API_URL` si votre API est hébergée séparément.

---

## 📄 Licence

MIT — Libre d'utilisation pour projets commerciaux et personnels.
