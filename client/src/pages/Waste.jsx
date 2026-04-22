import { useState, useMemo } from 'react';
import { Leaf, ShoppingCart, Sparkles, Plus, Trash2, Copy, Check, ChevronDown, ChevronUp, AlertCircle, TrendingUp } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useIngredients } from '../hooks/useIngredients';

const UNITS = ['g', 'kg', 'cl', 'ml', 'L', 'pièce(s)'];

// Catégories exclues de la gestion d'ingrédients (produits finis, pas de recette)
const NO_RECIPE_CATS = new Set([
  'boissons', 'boisson', 'drinks', 'drink', 'beverages', 'beverage',
]);

// Coût d'un ingrédient pour une portion (unitPrice = €/kg, €/L, ou €/pièce)
function ingredientCost(ing) {
  if (!ing.unitPrice || !ing.quantity) return 0;
  const { quantity, unit, unitPrice } = ing;
  if (unit === 'g')  return (quantity / 1000) * unitPrice;
  if (unit === 'kg') return quantity * unitPrice;
  if (unit === 'cl') return (quantity / 100) * unitPrice;
  if (unit === 'ml') return (quantity / 1000) * unitPrice;
  if (unit === 'L')  return quantity * unitPrice;
  return quantity * unitPrice; // pièce(s) et autres
}

// Coût matière total d'un plat (1 portion)
function dishCost(items) {
  if (!items?.length) return 0;
  return items.reduce((sum, ing) => sum + ingredientCost(ing), 0);
}

// Label du prix selon l'unité
function priceLabel(unit) {
  if (unit === 'g' || unit === 'kg') return '€/kg';
  if (unit === 'cl' || unit === 'ml' || unit === 'L') return '€/L';
  return '€/p.';
}

function computeForecast(sales, menu) {
  if (!sales.length || !menu.length) return {};

  const dates = [...new Set(sales.map(s => s.date))].sort();
  const recentDates = new Set(dates.slice(-14));
  const recent = sales.filter(s => recentDates.has(s.date));

  const counts = {};
  const dowOccurrences = {};

  for (const s of recent) {
    const dow = new Date(s.date).getDay();
    if (!counts[s.dishId]) counts[s.dishId] = {};
    counts[s.dishId][dow] = (counts[s.dishId][dow] || 0) + s.quantity;
  }
  for (const d of recentDates) {
    const dow = new Date(d).getDay();
    dowOccurrences[dow] = (dowOccurrences[dow] || 0) + 1;
  }

  const today = new Date();
  const nextDows = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i + 1);
    return d.getDay();
  });

  const forecast = {};
  for (const dish of menu) {
    let total = 0;
    for (const dow of nextDows) {
      const qty = counts[dish.id]?.[dow] || 0;
      const n = dowOccurrences[dow] || 1;
      total += qty / n;
    }
    forecast[dish.id] = Math.max(1, Math.round(total));
  }
  return forecast;
}

export default function Waste() {
  const { menu, sales, hasData, loading } = useData();
  const { ingredients, setDishIngredients } = useIngredients();

  const [tab, setTab]           = useState('ingredients');
  const [expanded, setExpanded] = useState(null);
  const [generating, setGenerating] = useState(null);
  const [genError, setGenError] = useState(null);
  const [margin, setMargin]     = useState(15);
  const [copied, setCopied]     = useState(false);

  const forecast = useMemo(() => computeForecast(sales, menu), [sales, menu]);

  const sortedMenu = useMemo(
    () => [...menu].sort((a, b) => (forecast[b.id] || 0) - (forecast[a.id] || 0)),
    [menu, forecast],
  );

  // Exclut les boissons (produits finis, aucune recette à gérer)
  const ingredientMenu = useMemo(
    () => sortedMenu.filter(d => !NO_RECIPE_CATS.has((d.category || '').toLowerCase())),
    [sortedMenu],
  );

  const coveredDishes = ingredientMenu.filter(d => ingredients[d.id]?.length > 0).length;
  const maxForecast   = Math.max(1, ...Object.values(forecast));

  const shoppingList = useMemo(() => {
    const agg = {};
    for (const dish of menu) {
      const items = ingredients[dish.id];
      if (!items?.length) continue;
      const predicted = forecast[dish.id] || 0;
      if (predicted === 0) continue;
      for (const ing of items) {
        const key = ing.name.toLowerCase();
        if (!agg[key]) agg[key] = { name: ing.name, qty: 0, unit: ing.unit, unitPrice: ing.unitPrice || 0 };
        agg[key].qty += ing.quantity * predicted;
      }
    }
    return Object.values(agg)
      .map(({ name, qty, unit, unitPrice }) => {
        const base       = Math.round(qty * 10) / 10;
        const withMargin = Math.round(qty * (1 + margin / 100) * 10) / 10;
        const cost       = unitPrice > 0
          ? ingredientCost({ quantity: withMargin, unit, unitPrice })
          : null;
        return { name, base, withMargin, unit, unitPrice, cost };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [menu, ingredients, forecast, margin]);

  const totalShoppingCost = useMemo(
    () => shoppingList.reduce((sum, r) => sum + (r.cost || 0), 0),
    [shoppingList],
  );

  async function generateIngredients(dish) {
    setGenerating(dish.id);
    setGenError(null);
    try {
      const res = await fetch('/api/generate-ingredients', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ dishName: dish.name, category: dish.category }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error(
          res.status === 503 || res.status === 404
            ? 'Serveur inaccessible — lancez `npm run dev` dans le dossier /server'
            : `Réponse invalide du serveur (HTTP ${res.status})`,
        );
      }

      if (!res.ok) throw new Error(data.error || `Erreur serveur (${res.status})`);
      if (!Array.isArray(data.ingredients)) throw new Error('Format inattendu — réessayez');
      setDishIngredients(dish.id, data.ingredients);
    } catch (err) {
      setGenError(`${dish.name} : ${err.message}`);
    } finally {
      setGenerating(null);
    }
  }

  function copyShoppingList() {
    const lines = shoppingList
      .map(({ name, withMargin, unit }) => `- ${name} : ${withMargin} ${unit}`)
      .join('\n');
    navigator.clipboard.writeText(
      `Liste de courses — semaine prochaine (+${margin}% marge)\n\n${lines}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
        <Leaf size={32} className="text-text-muted" />
        <p className="text-sm font-semibold text-text-secondary">Aucune donnée de ventes</p>
        <p className="text-xs text-text-muted">Importez votre fichier CSV pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 space-y-5 max-w-4xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Gaspillage &amp; Stock</h1>
        <p className="text-sm text-text-muted mt-1">
          Prévisions d'ingrédients pour les 7 prochains jours &bull;{' '}
          <span className="text-text-secondary">{menu.length} plats</span>{' '}
          &bull;{' '}
          <span className={coveredDishes > 0 ? 'text-green-400' : 'text-text-secondary'}>
            {coveredDishes} avec ingrédients
          </span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-hover rounded-xl w-fit">
        {[
          { key: 'ingredients', label: 'Ingrédients',      Icon: Leaf         },
          { key: 'courses',     label: 'Liste de courses', Icon: ShoppingCart },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
              ${tab === key
                ? 'bg-bg-card text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {genError && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span>{genError}</span>
        </div>
      )}

      {/* ── Tab: Ingrédients ─────────────────────────────────────────────────── */}
      {tab === 'ingredients' && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">
            Cliquez sur un plat pour gérer ses ingrédients. L'IA génère automatiquement la recette via Groq.
            <span className="ml-1 text-text-muted/60">Les boissons sont exclues (produits finis, pas de recette).</span>
          </p>

          {ingredientMenu.map(dish => {
            const items   = ingredients[dish.id] || [];
            const isOpen  = expanded === dish.id;
            const cost    = dishCost(items);
            const hasCost = cost > 0;
            const margin  = hasCost && dish.price > 0
              ? ((dish.price - cost) / dish.price) * 100
              : null;

            return (
              <div key={dish.id} className="card overflow-hidden">
                {/* Row header */}
                <button
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-bg-hover/40 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : dish.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-text-primary">{dish.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-bg-hover text-text-muted capitalize">
                        {dish.category}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      {items.length > 0
                        ? `${items.length} ingrédient${items.length > 1 ? 's' : ''}`
                        : 'Aucun ingrédient'}
                      {' · '}
                      {forecast[dish.id] || 0} portions prévues
                    </p>
                  </div>
                  {/* Cost + margin badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasCost && (
                      <div className="hidden sm:flex items-center gap-1.5">
                        <span className="text-xs text-text-muted">{cost.toFixed(2)}€</span>
                        {margin !== null && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md
                            ${margin >= 70 ? 'bg-green-400/10 text-green-400'
                            : margin >= 50 ? 'bg-amber-400/10 text-amber-400'
                            : 'bg-red-400/10 text-red-400'}`}>
                            {Math.round(margin)}% marge
                          </span>
                        )}
                      </div>
                    )}
                    {items.length > 0 && (
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                    )}
                    {isOpen
                      ? <ChevronUp   size={16} className="text-text-muted" />
                      : <ChevronDown size={16} className="text-text-muted" />}
                  </div>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t border-bg-border px-4 pb-4 pt-3 space-y-3">
                    {/* Column labels */}
                    {items.length > 0 && (
                      <div className="grid grid-cols-[1fr,72px,88px,72px,32px] gap-2 text-[10px] text-text-muted px-0.5">
                        <span>Ingrédient</span>
                        <span>Qté</span>
                        <span>Unité</span>
                        <span>Prix gros</span>
                        <span />
                      </div>
                    )}

                    {/* Ingredient rows */}
                    {items.map((ing, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr,72px,88px,72px,32px] gap-2 items-center">
                        <input
                          className="bg-bg-hover text-text-primary rounded-lg px-2.5 py-1.5 text-sm border border-transparent focus:border-accent-blue/40 focus:outline-none w-full"
                          value={ing.name}
                          placeholder="nom"
                          onChange={e => {
                            const updated = [...items];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setDishIngredients(dish.id, updated);
                          }}
                        />
                        <input
                          type="number" min="0" step="any"
                          className="bg-bg-hover text-text-primary rounded-lg px-2.5 py-1.5 text-sm border border-transparent focus:border-accent-blue/40 focus:outline-none w-full"
                          value={ing.quantity}
                          onChange={e => {
                            const updated = [...items];
                            updated[idx] = { ...updated[idx], quantity: parseFloat(e.target.value) || 0 };
                            setDishIngredients(dish.id, updated);
                          }}
                        />
                        <select
                          className="bg-bg-hover text-text-primary rounded-lg px-2 py-1.5 text-sm border border-transparent focus:border-accent-blue/40 focus:outline-none w-full"
                          value={ing.unit}
                          onChange={e => {
                            const updated = [...items];
                            updated[idx] = { ...updated[idx], unit: e.target.value };
                            setDishIngredients(dish.id, updated);
                          }}
                        >
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        {/* Unit price (wholesale) */}
                        <div className="relative">
                          <input
                            type="number" min="0" step="0.01"
                            className="bg-bg-hover text-text-primary rounded-lg pl-2 pr-1 py-1.5 text-xs border border-transparent focus:border-accent-blue/40 focus:outline-none w-full"
                            value={ing.unitPrice ?? ''}
                            placeholder={priceLabel(ing.unit)}
                            title={`Prix grossiste ${priceLabel(ing.unit)}`}
                            onChange={e => {
                              const updated = [...items];
                              updated[idx] = { ...updated[idx], unitPrice: parseFloat(e.target.value) || 0 };
                              setDishIngredients(dish.id, updated);
                            }}
                          />
                        </div>
                        <button
                          onClick={() => setDishIngredients(dish.id, items.filter((_, i) => i !== idx))}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}

                    {/* Cost summary */}
                    {hasCost && (
                      <div className="flex items-center gap-3 pt-1 border-t border-bg-border/50 text-xs">
                        <TrendingUp size={12} className="text-text-muted flex-shrink-0" />
                        <span className="text-text-muted">Coût matière :</span>
                        <span className="font-semibold text-text-primary">{cost.toFixed(2)} €</span>
                        {margin !== null && dish.price > 0 && (
                          <>
                            <span className="text-text-muted">·</span>
                            <span className="text-text-muted">Vente : {dish.price.toFixed(2)} €</span>
                            <span className="text-text-muted">·</span>
                            <span className={`font-bold ${margin >= 70 ? 'text-green-400' : margin >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                              Marge {Math.round(margin)}%
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <button
                        onClick={() => generateIngredients(dish)}
                        disabled={generating === dish.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors disabled:opacity-50 disabled:cursor-wait"
                      >
                        <Sparkles size={12} className={generating === dish.id ? 'animate-spin' : ''} />
                        {generating === dish.id
                          ? 'Génération…'
                          : items.length > 0 ? 'Régénérer via IA' : 'Générer via IA'}
                      </button>
                      <button
                        onClick={() =>
                          setDishIngredients(dish.id, [...items, { name: '', quantity: 100, unit: 'g' }])
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                      >
                        <Plus size={12} />
                        Ajouter manuellement
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab: Liste de courses ─────────────────────────────────────────────── */}
      {tab === 'courses' && (
        <div className="space-y-4">

          {/* Margin config */}
          <div className="card p-4 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">Marge de sécurité</p>
              <p className="text-xs text-text-muted mt-0.5">Buffer ajouté pour éviter les ruptures de stock</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0" max="50" step="5"
                value={margin}
                onChange={e => setMargin(Number(e.target.value))}
                className="w-28"
              />
              <span className="text-sm font-bold text-accent-blue w-12 text-right">+{margin}%</span>
            </div>
          </div>

          {/* Forecast bar chart */}
          <div className="card p-4">
            <p className="text-sm font-semibold text-text-primary mb-4">Prévision semaine prochaine</p>
            {ingredientMenu.filter(d => ingredients[d.id]?.length > 0).length === 0 ? (
              <p className="text-sm text-text-muted">
                Aucun plat avec ingrédients. Générez-les dans l'onglet "Ingrédients".
              </p>
            ) : (
              <div className="space-y-2.5">
                {ingredientMenu
                  .filter(d => ingredients[d.id]?.length > 0)
                  .slice(0, 10)
                  .map(dish => {
                    const qty     = forecast[dish.id] || 0;
                    const pct     = Math.round((qty / maxForecast) * 100);
                    return (
                      <div key={dish.id} className="flex items-center gap-3 text-sm">
                        <span className="flex-1 min-w-0 text-text-secondary truncate">{dish.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-32 h-1.5 rounded-full bg-bg-hover overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent-blue/60 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-muted w-16 text-right">{qty} portions</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Shopping list */}
          {shoppingList.length > 0 ? (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    Liste de courses
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{shoppingList.length} ingrédients</p>
                </div>
                <button
                  onClick={copyShoppingList}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                >
                  {copied
                    ? <Check size={12} className="text-green-400" />
                    : <Copy  size={12} />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>

              {/* Header row */}
              <div className="grid grid-cols-[1fr,auto,auto,auto] gap-x-4 text-[10px] text-text-muted pb-2 border-b border-bg-border">
                <span>Ingrédient</span>
                <span className="text-right">Base</span>
                <span className="text-right text-accent-blue">+{margin}% marge</span>
                <span className="text-right text-green-400">Coût est.</span>
              </div>

              <div className="divide-y divide-bg-border/50">
                {shoppingList.map(({ name, base, withMargin, unit, cost }) => (
                  <div key={name} className="grid grid-cols-[1fr,auto,auto,auto] gap-x-4 items-center py-2">
                    <span className="text-sm text-text-primary capitalize">{name}</span>
                    <span className="text-sm text-text-muted text-right tabular-nums">
                      {base} {unit}
                    </span>
                    <span className="text-sm font-semibold text-text-primary text-right tabular-nums">
                      {withMargin} {unit}
                    </span>
                    <span className="text-sm text-right tabular-nums text-text-muted">
                      {cost != null ? `${cost.toFixed(2)} €` : '—'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total cost */}
              {totalShoppingCost > 0 && (
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-bg-border">
                  <span className="text-sm font-semibold text-text-primary">Total estimé (semaine)</span>
                  <span className="text-sm font-bold text-green-400 tabular-nums">
                    {totalShoppingCost.toFixed(2)} €
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-8 flex flex-col items-center text-center gap-3">
              <ShoppingCart size={32} className="text-text-muted" />
              <p className="text-sm font-medium text-text-secondary">Liste vide</p>
              <p className="text-xs text-text-muted max-w-xs">
                Ajoutez des ingrédients à vos plats dans l'onglet "Ingrédients" pour générer la liste de courses.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
