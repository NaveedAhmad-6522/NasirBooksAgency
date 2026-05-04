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
  
    let mode = "today"; // default

    if (data.length && data[0]?.hour !== undefined) {
      mode = "today";
    } else if (data.length && typeof data[0]?.day === "string") {
      mode = "week";
    } else if (data.length && typeof data[0]?.day === "number") {
      mode = "month";
    } else {
      // fallback to filter if detection fails
      const f = (filter || "").toLowerCase();
      if (f.includes("week")) mode = "week";
      else if (f.includes("month")) mode = "month";
      else mode = "today";
    }
  
    if (data.length && data[0]?.hour !== undefined) {
      chartData = data.map(item => ({
        time: formatHour(item.hour),
        sales: Number(item.total || 0)
      }));
    }
  
    else if (data.length && typeof data[0]?.day === "string") {
      chartData = data.map(item => ({
        time: item.day,
        sales: Number(item.total || 0)
      }));
    }
  
    else if (data.length && typeof data[0]?.day === "number") {
      chartData = data.map(item => ({
        time: `Day ${item.day}`,
        sales: Number(item.total || 0)
      }));
    }
  
    else {
      if (mode === "today") {
        chartData = data.map(item => ({
          time: formatHour(item.hour),
          sales: Number(item.total || 0)
        }));
      } else if (mode === "week") {
        chartData = data.map(item => ({
          time: item.day,
          sales: Number(item.total || 0)
        }));
      } else if (mode === "month") {
        chartData = data.map(item => ({
          time: `Day ${item.day}`,
          sales: Number(item.total || 0)
        }));
      }
    }
  
    if (mode === "today") {
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
  
    if (mode === "week") {
      const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
      const map = new Map(chartData.map(d => [d.time, d.sales]));
  
      chartData = days.map(day => ({
        time: day,
        sales: map.get(day) || 0
      }));
    }
  
    if (mode === "month") {
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
  
    if (mode === "today") {
      chartData.sort((a, b) => {
        const getHour = (label) => {
          const [num, period] = label.split(" ");
          let hour = Number(num);
          if (period === "PM" && hour !== 12) hour += 12;
          if (period === "AM" && hour === 12) hour = 0;
          return hour;
        };
        return getHour(a.time) - getHour(b.time);
      });
    }
  
    if (mode === "week") {
      const order = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
      chartData.sort((a, b) => order.indexOf(a.time) - order.indexOf(b.time));
    }
  
    if (mode === "month") {
      chartData.sort((a, b) => {
        const dayA = Number(a.time.replace("Day ", ""));
        const dayB = Number(b.time.replace("Day ", ""));
        return dayA - dayB;
      });
    }
  
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
  
          {/* X AXIS (dynamic based on mode) */}
          <XAxis
            dataKey="time"
            tickFormatter={(value) => {
              if (mode === "week") return value?.slice(0, 3);
              if (mode === "month") return value?.replace("Day ", "");
              return value;
            }}
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