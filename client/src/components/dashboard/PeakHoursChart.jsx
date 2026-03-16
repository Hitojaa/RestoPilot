import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-bg-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-text-muted mb-1">{label}h</p>
      <p className="text-white font-semibold">{payload[0].value} plats vendus</p>
    </div>
  );
}

export default function PeakHoursChart({ data }) {
  // data: array of { hour: number, quantity: number }
  const maxVal = Math.max(...data.map((d) => d.quantity));

  return (
    <div className="card p-5">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-text-primary">Heures de pointe</h2>
        <p className="text-xs text-text-muted mt-0.5">Ventes par créneau horaire — 4 semaines</p>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
          <XAxis
            dataKey="hour"
            tickFormatter={(h) => `${h}h`}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.hour}
                fill={entry.quantity === maxVal ? '#4F8EF7' : entry.quantity > maxVal * 0.7 ? '#3b7de8' : '#2a2d3e'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
