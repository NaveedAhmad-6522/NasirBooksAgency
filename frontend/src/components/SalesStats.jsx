import {
    TrendingUp,
    TrendingDown,
    Package,
    Wallet,
    AlertTriangle,
  } from "lucide-react";
  
  function SalesStats({ sales, filter }) {
    const now = new Date();
  
    const isSameDay = (d1, d2) =>
      d1.toDateString() === d2.toDateString();
  
    const calcTotal = (arr, key) =>
      arr.reduce((sum, s) => sum + Number(s[key]), 0);
  
    const getChange = (current, previous) => {
      if (previous === 0) return current === 0 ? 0 : 100;
      return ((current - previous) / previous) * 100;
    };
  
    let current = [];
    let previous = [];
  
    // 🔥 FILTER LOGIC
    if (filter === "today") {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
  
      current = sales.filter((s) => {
        const d = new Date(s.created_at.replace(" ", "T"));
        return isSameDay(d, today);
      });
  
      previous = sales.filter((s) => {
        const d = new Date(s.created_at.replace(" ", "T"));
        return isSameDay(d, yesterday);
      });
  
    } else if (filter === "week") {
      const start = new Date();
      start.setDate(now.getDate() - 7);
  
      const prevStart = new Date();
      prevStart.setDate(now.getDate() - 14);
  
      current = sales.filter((s) => {
        const d = new Date(s.created_at.replace(" ", "T"));
        return d >= start;
      });
  
      previous = sales.filter((s) => {
        const d = new Date(s.created_at.replace(" ", "T"));
        return d >= prevStart && d < start;
      });
  
    } else if (filter === "month") {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
  
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
      current = sales.filter((s) => {
        const d = new Date(s.created_at.replace(" ", "T"));
        return (
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear
        );
      });
  
      previous = sales.filter((s) => {
        const d = new Date(s.created_at.replace(" ", "T"));
        return (
          d.getMonth() === prevMonth &&
          d.getFullYear() === prevYear
        );
      });
    }
  
    // ✅ CALCULATED VALUES (FIXED)
    const currentTotal = calcTotal(current, "total_amount");
    const previousTotal = calcTotal(previous, "total_amount");
  
    const currentPaid = calcTotal(current, "paid_amount");
    const previousPaid = calcTotal(previous, "paid_amount");
  
    const currentOrders = current.length;
    const previousOrders = previous.length;
  
    const currentRemaining = currentTotal - currentPaid;
    const previousRemaining = previousTotal - previousPaid;
  
    return (
      <div className="grid grid-cols-4 gap-4 mb-5">
  
        <StatCard
          title="Total Sales"
          value={`Rs ${currentTotal}`}
          change={getChange(currentTotal, previousTotal)}
          color="blue"
          filter={filter}
        />
  
        <StatCard
          title="Orders"
          value={currentOrders}
          change={getChange(currentOrders, previousOrders)}
          color="purple"
          filter={filter}
        />
  
        <StatCard
          title="Paid"
          value={`Rs ${currentPaid}`}
          change={getChange(currentPaid, previousPaid)}
          color="green"
          filter={filter}
        />
  
        <StatCard
          title="Remaining"
          value={`Rs ${currentRemaining}`}
          change={getChange(currentRemaining, previousRemaining)}
          color="red"
          filter={filter}
        />
  
      </div>
    );
  }
  
  function StatCard({ title, value, change, color, filter }) {
    const isPositive = change >= 0;
  
    const styles = {
      blue: "bg-blue-50 text-blue-700",
      purple: "bg-purple-50 text-purple-700",
      green: "bg-green-50 text-green-700",
      red: "bg-red-50 text-red-700",
    };
  
    const label =
      filter === "today"
        ? "yesterday"
        : filter === "week"
        ? "last week"
        : "last month";
  
    return (
      <div className={`p-4 rounded-xl shadow-sm ${styles[color]}`}>
        
        <div className="flex justify-between items-center">
  
          {/* LEFT */}
          <div>
            <div className="text-xs text-gray-500">{title}</div>
            <div className="text-lg font-bold">{value}</div>
  
            <div
              className={`text-xs mt-1 flex items-center gap-1 ${
                isPositive ? "text-green-600" : "text-red-500"
              }`}
            >
              {isPositive ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
  
              {Math.abs(change).toFixed(1)}%
              <span className="text-gray-400 ml-1">
                vs {label}
              </span>
            </div>
          </div>
  
          {/* ICON */}
          <div className="p-3 bg-white rounded-lg shadow">
            {color === "blue" && <TrendingUp size={18} />}
            {color === "purple" && <Package size={18} />}
            {color === "green" && <Wallet size={18} />}
            {color === "red" && <AlertTriangle size={18} />}
          </div>
  
        </div>
      </div>
    );
  }
  
  export default SalesStats;