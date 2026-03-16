import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { useData } from '../hooks/useData';
import {
  getRevenue, getVolume, splitByWeek, topByRevenue, topByVolume, formatEur,
} from '../utils/dataUtils';

const WEEKS_LABELS = ['Sem. 1', 'Sem. 2', 'Sem. 3', 'Sem. 4'];

// Élasticités-prix par catégorie (littérature restauration française)
// Basées sur des études sectorielles : entrées peu élastiques, plats très élastiques
const ELASTICITY = { entrées: -0.45, plats: -0.60, desserts: -0.50, boissons: -0.30 };

// Confiance de la simulation selon l'amplitude du changement
function confidenceLevel(priceRatio) {
  const pct = Math.abs(priceRatio - 1) * 100;
  if (pct <= 10) return { label: 'Élevée', color: 'text-accent-green' };
  if (pct <= 25) return { label: 'Modérée', color: 'text-accent-amber' };
  return { label: 'Faible (grande variation)', color: 'text-accent-red' };
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-bg-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-text-muted mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {typeof p.value === 'number' && p.name.includes('€')
            ? formatEur(p.value)
            : p.value}
        </p>
      ))}
    </div>
  );
}

export default function Pricing() {
  const { menu, sales, loading, derived } = useData();
  const [selectedDishId, setSelectedDishId] = useState(null);
  const [simulatedPrice, setSimulatedPrice] = useState(null);

  const stats = useMemo(() => {
    if (!menu.length || !sales.length || !derived) return null;

    const { weeks } = derived;

    // Top 5 par CA vs top 5 par volume
    const byRevenue = topByRevenue(sales, menu, 5);
    const byVolume = topByVolume(sales, menu, 5);

    // Ticket moyen par semaine
    const platIds = new Set(menu.filter((d) => d.category === 'plats').map((d) => d.id));
    const weeklyTicket = weeks.map((wSales, i) => {
      const rev = menu.reduce((s, d) => s + getRevenue(wSales, d.id, menu), 0);
      const covers = wSales.filter((s) => platIds.has(s.dishId)).reduce((s, e) => s + e.quantity, 0);
      return { week: WEEKS_LABELS[i], ticket: covers > 0 ? rev / covers : 0 };
    });

    return { byRevenue, byVolume, weeklyTicket };
  }, [menu, sales, derived]);

  // Simulation de prix — modèle loi puissance (standard en économie de la demande)
  // Q_nouvelle = Q_actuelle × (P_nouvelle / P_actuelle) ^ élasticité
  // Garantit des volumes toujours positifs, quelle que soit l'amplitude du changement.
  const simulation = useMemo(() => {
    if (!selectedDishId || simulatedPrice === null || !sales.length) return null;

    const dish = menu.find((d) => d.id === selectedDishId);
    if (!dish) return null;

    const monthVolume = getVolume(sales, selectedDishId);
    const currentPrice = dish.price;
    const currentMonthRevenue = monthVolume * currentPrice;

    // Loi puissance : jamais de volume négatif
    const elasticity = ELASTICITY[dish.category] ?? -0.50;
    const priceRatio = simulatedPrice / currentPrice;
    const adjustedVolume = Math.round(monthVolume * Math.pow(priceRatio, elasticity));
    const adjustedRevenue = adjustedVolume * simulatedPrice;
    const adjustedDelta = adjustedRevenue - currentMonthRevenue;

    // CA sans ajustement de demande (borne haute théorique)
    const rawRevenue = monthVolume * simulatedPrice;
    const rawDelta = rawRevenue - currentMonthRevenue;

    const priceUp = simulatedPrice > currentPrice;
    const confidence = confidenceLevel(priceRatio);

    return {
      dish,
      currentPrice,
      simulatedPrice,
      monthVolume,
      adjustedVolume,
      currentMonthRevenue,
      adjustedRevenue,
      adjustedDelta,
      rawDelta,
      elasticity,
      priceUp,
      confidence,
    };
  }, [selectedDishId, simulatedPrice, menu, sales]);

  // Init simulation quand on sélectionne un plat
  function selectDish(dishId) {
    setSelectedDishId(dishId);
    const dish = menu.find((d) => d.id === dishId);
    if (dish) setSimulatedPrice(dish.price);
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1400px]">
      {/* Ticket moyen par semaine */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-1">Ticket moyen — évolution hebdomadaire</h2>
        <p className="text-xs text-text-muted mb-4">Revenu moyen par couvert sur les 4 semaines</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={stats.weeklyTicket} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `${v.toFixed(0)}€`}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={42}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="ticket"
              name="Ticket moyen €"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top 5 CA vs Top 5 Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Top 5 — Chiffre d'affaires</h2>
          <p className="text-xs text-text-muted mb-4">Les plats qui génèrent le plus de revenus</p>
          <div className="space-y-2.5">
            {stats.byRevenue.map((dish, i) => {
              const totalRev = stats.byRevenue.reduce((s, d) => s + d.revenue, 0);
              const pct = totalRev > 0 ? (dish.revenue / totalRev) * 100 : 0;
              return (
                <div key={dish.id} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-4 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-text-primary truncate">{dish.name}</span>
                      <span className="text-xs text-accent-green font-semibold ml-2 flex-shrink-0">{formatEur(dish.revenue)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden">
                      <div className="h-full bg-accent-green rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Top 5 — Volume vendu</h2>
          <p className="text-xs text-text-muted mb-4">Les plats les plus commandés</p>
          <div className="space-y-2.5">
            {stats.byVolume.map((dish, i) => {
              const totalVol = stats.byVolume.reduce((s, d) => s + d.volume, 0);
              const pct = totalVol > 0 ? (dish.volume / totalVol) * 100 : 0;
              const inTopCA = stats.byRevenue.some((d) => d.id === dish.id);
              return (
                <div key={dish.id} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-4 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-medium text-text-primary truncate">{dish.name}</span>
                        {!inTopCA && (
                          <span className="badge-yellow flex-shrink-0">≠ CA</span>
                        )}
                      </div>
                      <span className="text-xs text-accent-blue font-semibold ml-2 flex-shrink-0">{dish.volume} vendus</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden">
                      <div className="h-full bg-accent-blue rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-text-muted mt-3">
            ≠ CA = plat vendu en volume mais absent du top 5 CA — potentiel de hausse de prix.
          </p>
        </div>
      </div>

      {/* Simulateur de prix */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-1">Simulateur de prix</h2>
        <p className="text-xs text-text-muted mb-5">
          Modifiez le prix d'un plat et visualisez l'impact projeté sur le CA mensuel.
          Modèle loi puissance avec élasticité-prix différenciée par catégorie (entrées −0,45 · plats −0,60 · desserts −0,50 · boissons −0,30).
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sélecteur + slider */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary mb-2 block">Sélectionnez un plat</label>
              <select
                value={selectedDishId || ''}
                onChange={(e) => selectDish(e.target.value)}
                className="w-full bg-bg-hover border border-bg-border rounded-lg px-3 py-2.5 text-sm text-text-primary
                           focus:outline-none focus:border-accent-blue/50"
              >
                <option value="">— Choisir un plat —</option>
                {menu.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.price}€) — {d.category}
                  </option>
                ))}
              </select>
            </div>

            {selectedDishId && simulatedPrice !== null && (() => {
              const dish = menu.find((d) => d.id === selectedDishId);
              if (!dish) return null;
              // Plage ±50% du prix actuel, arrondie à 0.50€
              const sliderMin = Math.max(0.5, Math.round(dish.price * 0.5 * 2) / 2);
              const sliderMax = Math.round(dish.price * 1.5 * 2) / 2;
              return (
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs text-text-secondary">Nouveau prix</label>
                    <div className="flex items-center gap-2">
                      {simulatedPrice !== dish.price && (
                        <span className={`text-[10px] font-medium ${simulatedPrice > dish.price ? 'text-accent-green' : 'text-accent-red'}`}>
                          {simulatedPrice > dish.price ? '▲' : '▼'} {Math.abs(((simulatedPrice - dish.price) / dish.price) * 100).toFixed(0)}%
                        </span>
                      )}
                      <span className="text-sm font-bold text-accent-blue">{simulatedPrice.toFixed(2)}€</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={sliderMin}
                    max={sliderMax}
                    step={0.5}
                    value={simulatedPrice}
                    onChange={(e) => setSimulatedPrice(parseFloat(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-bg-hover accent-accent-blue"
                  />
                  <div className="flex justify-between text-[10px] text-text-muted mt-1">
                    <span>{sliderMin}€ (−50%)</span>
                    <span className="text-text-muted">{dish.price}€ actuel</span>
                    <span>{sliderMax}€ (+50%)</span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-2">
                    Élasticité appliquée : {ELASTICITY[dish.category] ?? -0.50} ({dish.category})
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Résultats simulation */}
          {simulation ? (
            <div className="space-y-3">
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-hover rounded-xl p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wide">Situation actuelle</p>
                  <p className="text-lg font-bold text-text-primary mt-1">{formatEur(simulation.currentMonthRevenue)}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{simulation.currentPrice}€ × {simulation.monthVolume} ventes/mois</p>
                </div>
                <div className={`rounded-xl p-3 border ${simulation.adjustedDelta >= 0 ? 'bg-accent-green/8 border-accent-green/20' : 'bg-accent-red/8 border-accent-red/20'}`}>
                  <p className="text-[10px] text-text-muted uppercase tracking-wide">Projection élasticité</p>
                  <p className={`text-lg font-bold mt-1 ${simulation.adjustedDelta >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {formatEur(simulation.adjustedRevenue)}
                  </p>
                  <p className={`text-[10px] mt-0.5 font-semibold ${simulation.adjustedDelta >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {simulation.adjustedDelta >= 0 ? '+' : ''}{formatEur(simulation.adjustedDelta)}/mois
                  </p>
                </div>
              </div>

              {/* Détail volume */}
              <div className="bg-bg-hover rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Volume estimé après ajustement</span>
                  <span className={`font-semibold ${simulation.adjustedVolume < simulation.monthVolume ? 'text-accent-red' : 'text-accent-green'}`}>
                    {simulation.adjustedVolume} ventes/mois
                    <span className="text-text-muted font-normal ml-1">
                      ({simulation.adjustedVolume >= simulation.monthVolume ? '+' : ''}{simulation.adjustedVolume - simulation.monthVolume})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">CA sans ajustement demande</span>
                  <span className="text-text-secondary font-medium">
                    {formatEur(simulation.monthVolume * simulation.simulatedPrice)}
                    <span className="text-text-muted font-normal ml-1">
                      ({simulation.rawDelta >= 0 ? '+' : ''}{formatEur(simulation.rawDelta)})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-bg-border/50">
                  <span className="text-text-muted">Fiabilité de la projection</span>
                  <span className={`font-semibold ${simulation.confidence.color}`}>{simulation.confidence.label}</span>
                </div>
              </div>

              {/* Message actionnable */}
              <div className={`rounded-xl p-3 text-xs border
                ${simulation.adjustedDelta > 0
                  ? 'bg-accent-green/6 border-accent-green/20 text-accent-green'
                  : simulation.adjustedDelta < -50
                  ? 'bg-accent-red/6 border-accent-red/20 text-accent-red'
                  : 'bg-bg-hover border-bg-border text-text-secondary'}`}
              >
                {simulation.adjustedDelta > 0 && simulation.priceUp &&
                  `✅ ${simulation.priceUp ? 'Augmenter' : 'Baisser'} "${simulation.dish.name}" à ${simulation.simulatedPrice.toFixed(2)}€ devrait générer environ ${formatEur(simulation.adjustedDelta)} de CA supplémentaire par mois, après prise en compte de la baisse de volume.`
                }
                {simulation.adjustedDelta > 0 && !simulation.priceUp &&
                  `✅ Baisser "${simulation.dish.name}" à ${simulation.simulatedPrice.toFixed(2)}€ devrait générer environ ${formatEur(simulation.adjustedDelta)} de CA supplémentaire par mois grâce à l'augmentation du volume.`
                }
                {simulation.adjustedDelta <= 0 && simulation.adjustedDelta >= -50 &&
                  `ℹ️ Ce changement de prix a un impact quasi neutre sur le CA mensuel (${formatEur(simulation.adjustedDelta)}).`
                }
                {simulation.adjustedDelta < -50 && simulation.priceUp &&
                  `⚠️ Augmenter "${simulation.dish.name}" à ${simulation.simulatedPrice.toFixed(2)}€ réduirait votre CA mensuel d'environ ${formatEur(Math.abs(simulation.adjustedDelta))} car la baisse de volume ne serait pas compensée par la hausse de prix.`
                }
                {simulation.adjustedDelta < -50 && !simulation.priceUp &&
                  `⚠️ Baisser "${simulation.dish.name}" à ${simulation.simulatedPrice.toFixed(2)}€ réduirait votre CA mensuel d'environ ${formatEur(Math.abs(simulation.adjustedDelta))} malgré la hausse de volume.`
                }
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center bg-bg-hover rounded-xl p-8 text-text-muted text-sm text-center">
              Sélectionnez un plat ci-contre pour simuler l'impact d'un changement de prix.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
