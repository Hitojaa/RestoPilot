import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useData } from '../hooks/useData';
import Heatmap from '../components/schedule/Heatmap';
import {
  groupByDayOfWeek, groupByHour, totalCovers, formatNum,
  DAYS_FR, ALL_HOURS, LUNCH_HOURS, DINNER_HOURS,
} from '../utils/dataUtils';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-bg-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-text-muted mb-1">{label}</p>
      <p className="text-white font-semibold">{payload[0].value} couverts</p>
    </div>
  );
}

export default function Schedule() {
  const { menu, sales, loading, derived } = useData();

  const stats = useMemo(() => {
    if (!menu.length || !sales.length || !derived) return null;

    const { heatmap } = derived;
    const platIds = new Set(menu.filter((d) => d.category === 'plats').map((d) => d.id));
    const platSales = sales.filter((s) => platIds.has(s.dishId));

    // Couverts par jour de la semaine (moyennés sur 4 semaines)
    const byDow = groupByDayOfWeek(platSales);
    const dayData = DAYS_FR.map((name, dow) => ({
      name: name.slice(0, 3) + '.',
      covers: byDow[dow].reduce((s, e) => s + e.quantity, 0),
    }));
    const avgDayCover = dayData.reduce((s, d) => s + d.covers, 0) / 7;

    // Meilleur jour / jour le plus faible
    const bestDay = dayData.reduce((a, b) => (a.covers > b.covers ? a : b));
    const worstDay = dayData.reduce((a, b) => (a.covers < b.covers ? a : b));

    // Heures par service
    const hourGroups = groupByHour(sales);
    const lunchData = LUNCH_HOURS.map((h) => ({ hour: h, quantity: hourGroups[h] || 0 }));
    const dinnerData = DINNER_HOURS.map((h) => ({ hour: h, quantity: hourGroups[h] || 0 }));

    const allHourVals = ALL_HOURS.map((h) => hourGroups[h] || 0);
    const avgHour = allHourVals.reduce((s, v) => s + v, 0) / ALL_HOURS.length;
    const bestHour = ALL_HOURS[allHourVals.indexOf(Math.max(...allHourVals))];
    const deadHours = ALL_HOURS.filter((h, i) => allHourVals[i] < avgHour * 0.6);

    return { heatmap, dayData, avgDayCover, bestDay, worstDay, lunchData, dinnerData, bestHour, deadHours };
  }, [menu, sales, derived]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  const maxDayCover = Math.max(...stats.dayData.map((d) => d.covers));

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Highlight cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-text-muted mb-1">Meilleur créneau</p>
          <p className="text-xl font-bold text-accent-green">{stats.bestHour}h00</p>
          <p className="text-xs text-text-secondary mt-1">Pic de ventes sur la journée</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-text-muted mb-1">Meilleur jour</p>
          <p className="text-xl font-bold text-accent-blue">{stats.bestDay.name}</p>
          <p className="text-xs text-text-secondary mt-1">{formatNum(stats.bestDay.covers)} couverts</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-text-muted mb-1">Créneau(x) mort(s)</p>
          <p className="text-xl font-bold text-accent-amber">
            {stats.deadHours.length > 0 ? stats.deadHours.map((h) => `${h}h`).join(', ') : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-1">&lt;60% de la moyenne horaire</p>
        </div>
      </div>

      {/* Heatmap */}
      <Heatmap heatmapData={stats.heatmap} sales={sales} />

      {/* Jour de la semaine + services midi/soir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Par jour */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Couverts par jour de la semaine</h2>
          <p className="text-xs text-text-muted mb-4">Cumul 4 semaines — catégorie plats</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.dayData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="covers" radius={[4, 4, 0, 0]}>
                {stats.dayData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.covers === maxDayCover ? '#22c55e' : entry.covers < stats.avgDayCover * 0.6 ? '#ef4444' : '#4F8EF7'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Services */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Midi vs Soir — profil horaire</h2>
          <p className="text-xs text-text-muted mb-4">Ventes cumulées par créneau</p>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-accent-amber mb-2">Service Midi (11h–15h)</p>
              <div className="flex gap-1.5 items-end h-16">
                {stats.lunchData.map((d) => {
                  const maxL = Math.max(...stats.lunchData.map((x) => x.quantity));
                  const pct = maxL > 0 ? (d.quantity / maxL) * 100 : 0;
                  return (
                    <div key={d.hour} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-text-muted">{d.quantity}</span>
                      <div
                        className="w-full bg-accent-amber/70 rounded-sm"
                        style={{ height: `${Math.max(4, pct * 0.48)}rem` }}
                      />
                      <span className="text-[10px] text-text-muted">{d.hour}h</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-accent-blue mb-2">Service Soir (18h–22h)</p>
              <div className="flex gap-1.5 items-end h-16">
                {stats.dinnerData.map((d) => {
                  const maxD = Math.max(...stats.dinnerData.map((x) => x.quantity));
                  const pct = maxD > 0 ? (d.quantity / maxD) * 100 : 0;
                  return (
                    <div key={d.hour} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-text-muted">{d.quantity}</span>
                      <div
                        className="w-full bg-accent-blue/70 rounded-sm"
                        style={{ height: `${Math.max(4, pct * 0.48)}rem` }}
                      />
                      <span className="text-[10px] text-text-muted">{d.hour}h</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
