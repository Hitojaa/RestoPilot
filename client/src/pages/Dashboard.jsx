import { useMemo } from 'react';
import { Euro, Users, ShoppingBag, Star } from 'lucide-react';
import { useData } from '../hooks/useData';
import KPICard from '../components/dashboard/KPICard';
import RevenueChart from '../components/dashboard/RevenueChart';
import PeakHoursChart from '../components/dashboard/PeakHoursChart';
import InsightsPanel from '../components/dashboard/InsightsPanel';
import {
  getRevenue, getVolume, avgTicket, totalCovers,
  groupByHour, topByRevenue, formatEur, formatNum, trendPercent,
  ALL_HOURS,
} from '../utils/dataUtils';
import { generateInsights } from '../utils/insights';

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
        <p className="text-text-muted text-sm">Chargement des données...</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { menu, sales, loading, error, derived, startDate } = useData();

  const stats = useMemo(() => {
    if (!menu.length || !sales.length || !derived) return null;

    const { weeks, revByDay } = derived;
    const lastWeek = weeks[3];
    const prevWeek = weeks[2];

    // KPIs semaine courante
    const weekRevenue = menu.reduce((s, d) => s + getRevenue(lastWeek, d.id, menu), 0);
    const prevRevenue = menu.reduce((s, d) => s + getRevenue(prevWeek, d.id, menu), 0);
    const revTrend = prevRevenue > 0 ? ((weekRevenue - prevRevenue) / prevRevenue) * 100 : null;

    const ticket = avgTicket(lastWeek, menu);
    const prevTicket = avgTicket(prevWeek, menu);
    const ticketTrend = prevTicket > 0 ? ((ticket - prevTicket) / prevTicket) * 100 : null;

    const covers = totalCovers(lastWeek, menu);
    const prevCovers = totalCovers(prevWeek, menu);
    const coversTrend = prevCovers > 0 ? ((covers - prevCovers) / prevCovers) * 100 : null;

    // Plat #1 (4 semaines)
    const top = topByRevenue(sales, menu, 1)[0];

    // Graphique CA journalier
    const chartData = Object.entries(revByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    // Heures de pointe
    const hourGroups = groupByHour(sales);
    const hourData = ALL_HOURS.map((h) => ({ hour: h, quantity: hourGroups[h] || 0 }));

    // Insights IA
    const insights = generateInsights(sales, menu, startDate);

    return { weekRevenue, revTrend, ticket, ticketTrend, covers, coversTrend, top, chartData, hourData, insights };
  }, [menu, sales, derived, startDate]);

  if (loading) return <LoadingScreen />;
  if (error) return <div className="text-accent-red text-sm p-4">Erreur : {error}</div>;
  if (!stats) return <LoadingScreen />;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1400px]">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title="CA cette semaine"
          value={formatEur(stats.weekRevenue)}
          trend={stats.revTrend}
          icon={Euro}
          iconColor="bg-accent-blue/10"
          subtitle="vs semaine précédente"
        />
        <KPICard
          title="Ticket moyen"
          value={formatEur(stats.ticket)}
          trend={stats.ticketTrend}
          icon={ShoppingBag}
          iconColor="bg-accent-green/10"
          subtitle="par couvert"
        />
        <KPICard
          title="Couverts servis"
          value={formatNum(stats.covers)}
          trend={stats.coversTrend}
          icon={Users}
          iconColor="bg-accent-purple/10"
          subtitle="cette semaine"
        />
        <KPICard
          title="Plat #1"
          value={stats.top?.name ?? '—'}
          smallValue
          icon={Star}
          iconColor="bg-accent-amber/10"
          subtitle={stats.top ? `${formatEur(getRevenue(sales, stats.top.id, menu))} générés (4 sem.)` : ''}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart data={stats.chartData} />
        <PeakHoursChart data={stats.hourData} />
      </div>

      {/* Insights IA */}
      <InsightsPanel insights={stats.insights} />
    </div>
  );
}
