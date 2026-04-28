import {
    Users,
    UserCheck,
    AlertCircle,
    CheckCircle,
    TrendingUp,
    TrendingDown,
  } from "lucide-react";
  
  function CustomersStats({ stats }) {
    if (!stats) return null;
  
    return (
      <div className="grid grid-cols-4 gap-4">
  
        <StatCard
          title="Total Customers"
          value={stats?.total ?? 0}
          change={Number(stats?.totalChange ?? 0)}
          icon={<Users size={18} />}
          color="blue"
        />
  
        <StatCard
          title="Credit Customers"
          value={stats?.credit ?? 0}
          change={Number(stats?.creditChange ?? 0)}
          icon={<UserCheck size={18} />}
          color="yellow"
        />
  
        <StatCard
          title="Total Outstanding"
          value={`Rs ${Number(stats?.outstanding ?? 0).toLocaleString()}`}
          change={Number(stats?.outstandingChange ?? 0)}
          icon={<AlertCircle size={18} />}
          color="red"
        />
  
        <StatCard
          title="Paid Customers"
          value={stats?.paid ?? 0}
          change={Number(stats?.paidChange ?? 0)}
          icon={<CheckCircle size={18} />}
          color="green"
        />
  
      </div>
    );
  }
  
  /* =========================
     🔹 CARD COMPONENT
  ========================= */
  function StatCard({ title, value, change, icon, color }) {
    const isPositive = change >= 0;
  
    const styles = {
      blue: "bg-blue-50 text-blue-700",
      yellow: "bg-yellow-50 text-yellow-700",
      red: "bg-red-50 text-red-700",
      green: "bg-green-50 text-green-700",
    };
  
    return (
      <div className={`p-4 rounded-2xl ${styles[color]} shadow-sm`}>
        <div className="flex justify-between items-center">
  
          {/* LEFT */}
          <div>
            <div className="text-xs text-gray-500">{title}</div>
            <div className="text-xl font-bold">{value}</div>
  
            {/* 🔥 CHANGE */}
            <div
              className={`flex items-center gap-1 text-xs mt-1 ${
                isPositive ? "text-green-600" : "text-red-500"
              }`}
            >
              {isPositive ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
  
              <span>{Number.isFinite(change) ? Math.abs(change).toFixed(1) : "0.0"}%</span>
              <span className="text-gray-400">vs last month</span>
            </div>
          </div>
  
          {/* ICON */}
          <div className="bg-white p-2 rounded-lg shadow">
            {icon}
          </div>
  
        </div>
      </div>
    );
  }
  
  export default CustomersStats;