import { Sparkles, TrendingUp, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle,
    color: 'text-accent-green',
    bg: 'bg-accent-green/8 border-accent-green/20',
    dot: 'bg-accent-green',
  },
  danger: {
    icon: XCircle,
    color: 'text-accent-red',
    bg: 'bg-accent-red/8 border-accent-red/20',
    dot: 'bg-accent-red',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-accent-amber',
    bg: 'bg-accent-amber/8 border-accent-amber/20',
    dot: 'bg-accent-amber',
  },
  info: {
    icon: Info,
    color: 'text-accent-blue',
    bg: 'bg-accent-blue/8 border-accent-blue/20',
    dot: 'bg-accent-blue',
  },
};

function InsightItem({ insight, index }) {
  const config = TYPE_CONFIG[insight.type] || TYPE_CONFIG.info;
  const IconComp = config.icon;

  return (
    <div
      className={`flex gap-3 p-3.5 rounded-xl border ${config.bg} animate-slide-up`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>
        <IconComp size={15} />
      </div>
      <p className="text-sm text-text-primary leading-relaxed">{insight.text}</p>
    </div>
  );
}

export default function InsightsPanel({ insights }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-md bg-accent-purple/15 flex items-center justify-center">
          <Sparkles size={13} className="text-accent-purple" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Insights IA</h2>
        </div>
        <span className="ml-auto text-xs text-text-muted bg-bg-hover px-2 py-0.5 rounded-full">
          {insights.length} analyses
        </span>
      </div>

      <div className="space-y-2.5">
        {insights.map((insight, i) => (
          <InsightItem key={i} insight={insight} index={i} />
        ))}
      </div>
    </div>
  );
}
