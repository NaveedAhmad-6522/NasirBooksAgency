import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const buildData = (data) => {
  const received = Number(data.received || 0);
  const paid = Number(data.paid || 0);

  return [
    { name: "Received", value: received, abs: Math.abs(received) },
    { name: "Paid", value: paid, abs: Math.abs(paid) },
  ];
};

const COLORS = ["#22c55e", "#ef4444"];

const formatCurrency = (value) => {
  const n = Number(value || 0);
  if (n >= 1_000_000) return `Rs ${(n / 1_000_000).toFixed(2)} M`;
  if (n >= 1_000) return `Rs ${(n / 1_000).toFixed(1)} K`;
  return `Rs ${n}`;
};

export default function PaymentChart({ data = { received: 0, paid: 0 } }) {
  const chartData = buildData(data);
  const net = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-full h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="abs"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={2}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>

            {/* Center Label */}
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-900 text-sm font-semibold"
            >
              {formatCurrency(Math.abs(net))}
            </text>

            <Tooltip
              formatter={(value, name, props) => {
                const actual = props?.payload?.value || 0;
                return formatCurrency(Math.abs(actual));
              }}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <div className="flex gap-6 mt-3 text-xs">
        {chartData.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS[i] }}
            />
            <span className="text-gray-600">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}