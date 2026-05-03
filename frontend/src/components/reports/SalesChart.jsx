import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
  } from "recharts";
  
  export default function SalesChart({ data = [], filter = "Today" }) {
    const formatHour = (h) => {
      const hour = Number(h);
      const suffix = hour >= 12 ? "PM" : "AM";
      const formatted = hour % 12 === 0 ? 12 : hour % 12;
      return `${formatted} ${suffix}`;
    };
  
    let chartData = [];
  
    if (filter === "Today") {
      chartData = data.map(item => ({
        time: formatHour(item.hour),
        sales: Number(item.total || 0)
      }));
    }
  
    else if (filter === "This Week") {
      chartData = data.map(item => ({
        time: item.day,
        sales: Number(item.total || 0)
      }));
    }
  
    else if (filter === "This Month") {
      chartData = data.map(item => ({
        time: `Day ${item.day}`,
        sales: Number(item.total || 0)
      }));
    }
  
    // 🔹 Fill missing values for smooth charts
    if (filter === "Today") {
      const fullHours = Array.from({ length: 24 }, (_, i) => i);
      const map = new Map(chartData.map(d => [d.time, d.sales]));
  
      chartData = fullHours.map(h => {
        const label = formatHour(h);
        return {
          time: label,
          sales: map.get(label) || 0
        };
      });
    }
  
    if (filter === "This Week") {
      const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
      const map = new Map(chartData.map(d => [d.time, d.sales]));
  
      chartData = days.map(day => ({
        time: day,
        sales: map.get(day) || 0
      }));
    }
  
    if (filter === "This Month") {
      const daysInMonth = 31; // safe default
      const map = new Map(chartData.map(d => [d.time, d.sales]));
  
      chartData = Array.from({ length: daysInMonth }, (_, i) => {
        const label = `Day ${i + 1}`;
        return {
          time: label,
          sales: map.get(label) || 0
        };
      });
    }
  
    // 🔹 Ensure data is sorted correctly
    if (filter === "Today") {
      chartData.sort((a, b) => new Date(`1970-01-01 ${a.time}`) - new Date(`1970-01-01 ${b.time}`));
    } else {
      chartData.sort((a, b) => a.time.localeCompare(b.time));
    }
  
    // 🔹 Fallback when no data
    if (!chartData.length) {
      chartData = [{ time: "No Data", sales: 0 }];
    }
  
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
  
          {/* LIGHT GRID (like design) */}
          <CartesianGrid vertical={false} stroke="#eef2f7" />
  
          {/* X AXIS (dynamic based on filter) */}
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
  
          {/* Y AXIS EXACT VALUES */}
          <YAxis
            tickFormatter={(value) => {
              if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
              if (value >= 1000) return (value / 1000).toFixed(1) + "K";
              return value;
            }}
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
  
          {/* TOOLTIP (clean box like design) */}
          <Tooltip
            formatter={(value) => `Rs ${Number(value).toLocaleString()}`}
            labelFormatter={(label) => `${label}`}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              fontSize: "12px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
            }}
          />
  
          {/* MAIN LINE + SHADE */}
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#2563eb"
            strokeWidth={3}
            fill="url(#salesGradient)"
            dot={false}
            activeDot={{
              r: 6,
              stroke: "#fff",
              strokeWidth: 2
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }