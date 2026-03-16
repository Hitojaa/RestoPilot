import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter } from 'lucide-react';
import { useData } from '../hooks/useData';
import DishBadge from '../components/dishes/DishBadge';
import {
  getRevenue, getVolume, splitByWeek, trendPercent, formatEur, formatPct,
} from '../utils/dataUtils';
import { getDishStatus } from '../utils/insights';

const CATEGORIES = ['Toutes', 'entrées', 'plats', 'desserts', 'boissons'];
const CAT_LABELS = { entrées: 'Entrées', plats: 'Plats', desserts: 'Desserts', boissons: 'Boissons' };

function SortIcon({ column, sortKey, sortDir }) {
  if (sortKey !== column) return <ArrowUpDown size={12} className="text-text-muted ml-1 inline" />;
  return sortDir === 'asc'
    ? <ArrowUp size={12} className="text-accent-blue ml-1 inline" />
    : <ArrowDown size={12} className="text-accent-blue ml-1 inline" />;
}

export default function Dishes() {
  const { menu, sales, loading, derived, startDate } = useData();
  const [category, setCategory] = useState('Toutes');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('revenue');
  const [sortDir, setSortDir] = useState('desc');

  const rows = useMemo(() => {
    if (!menu.length || !sales.length || !derived) return [];

    const weeks = derived.weeks;
    const lastWeek = weeks[3];
    const prevWeek = weeks[2];

    return menu.map((dish) => {
      const weekVolume = getVolume(lastWeek, dish.id);
      const monthVolume = getVolume(sales, dish.id);
      const revenue = getRevenue(sales, dish.id, menu);
      const trend = trendPercent(prevWeek, lastWeek, dish.id);
      const status = getDishStatus(dish, sales, menu, weeks);

      return { ...dish, weekVolume, monthVolume, revenue, trend, status };
    });
  }, [menu, sales, derived]);

  const filtered = useMemo(() => {
    let list = rows;
    if (category !== 'Toutes') list = list.filter((d) => d.category === category);
    if (search) list = list.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

    return [...list].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (typeof a[sortKey] === 'string') return mul * a[sortKey].localeCompare(b[sortKey]);
      return mul * (a[sortKey] - b[sortKey]);
    });
  }, [rows, category, search, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  const TH = ({ label, column }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-text-muted cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
      onClick={() => handleSort(column)}
    >
      {label}
      <SortIcon column={column} sortKey={sortKey} sortDir={sortDir} />
    </th>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1400px]">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* Category tabs — scroll horizontal sur mobile */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex gap-1 p-1 bg-bg-card rounded-lg border border-bg-border w-max sm:w-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap
                  ${category === cat
                    ? 'bg-accent-blue text-white'
                    : 'text-text-secondary hover:text-text-primary'}`}
              >
                {cat === 'Toutes' ? 'Toutes' : CAT_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Search — pleine largeur sur mobile */}
        <div className="relative w-full sm:w-52">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Rechercher un plat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-card border border-bg-border rounded-lg pl-8 pr-3 py-2 text-xs text-text-primary
                       placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50"
          />
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Bestsellers', count: rows.filter((r) => r.status === 'bestseller').length, color: 'text-accent-green' },
          { label: 'Moyens', count: rows.filter((r) => r.status === 'moyen').length, color: 'text-accent-amber' },
          { label: 'En déclin', count: rows.filter((r) => r.status === 'déclin').length, color: 'text-accent-red' },
          { label: 'Faux bons plats', count: rows.filter((r) => r.status === 'faux-bon').length, color: 'text-accent-purple' },
        ].map(({ label, count, color }) => (
          <div key={label} className="card px-4 py-3 flex items-center gap-3">
            <span className={`text-2xl font-bold ${color}`}>{count}</span>
            <span className="text-xs text-text-muted">{label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="border-b border-bg-border">
              <tr>
                <TH label="Nom" column="name" />
                <TH label="Catégorie" column="category" />
                <TH label="Prix" column="price" />
                <TH label="Ventes semaine" column="weekVolume" />
                <TH label="Ventes mois" column="monthVolume" />
                <TH label="CA généré" column="revenue" />
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Tendance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border">
              {filtered.map((dish) => (
                <tr key={dish.id} className="hover:bg-bg-hover/50 transition-colors duration-100">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">{dish.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-text-muted capitalize">{CAT_LABELS[dish.category] || dish.category}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-primary font-medium">{dish.price}€</td>
                  <td className="px-4 py-3 text-sm text-text-primary">{dish.weekVolume}</td>
                  <td className="px-4 py-3 text-sm text-text-primary">{dish.monthVolume}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-text-primary">{formatEur(dish.revenue)}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs font-medium
                      ${dish.trend > 0 ? 'text-accent-green' : dish.trend < 0 ? 'text-accent-red' : 'text-text-muted'}`}>
                      {dish.trend > 0 ? '↑' : dish.trend < 0 ? '↓' : '—'}
                      {dish.trend !== 0 && formatPct(Math.abs(dish.trend), false)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DishBadge status={dish.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-text-muted text-sm">
            Aucun plat ne correspond à cette recherche.
          </div>
        )}

        <div className="px-4 py-3 border-t border-bg-border text-xs text-text-muted">
          {filtered.length} plat{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
