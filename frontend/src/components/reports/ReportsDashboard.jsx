import { useState, useEffect } from "react";
import StatCard from "./StatCard";
import SectionCard from "./SectionCard";
import SalesChart from "./SalesChart";
import PaymentChart from "./PaymentChart";
import SummaryPanel from "./SummaryPanel";
import { Package, ArrowDown, ArrowUp, Wallet, TrendingUp, AlertTriangle, BookOpen, Layers, CreditCard, Users } from "lucide-react";

export default function ReportsDashboard({ onLogout }) {
  const [filter, setFilter] = useState("Today");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (num) => {
    if (!num) return "0";
    const n = Number(num);

    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + " B";
    if (n >= 10_000_000) return (n / 10_000_000).toFixed(2) + " Cr";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + " M";
    if (n >= 1_000) return (n / 1_000).toFixed(2) + " K";

    return n.toFixed(2);
  };

  const formatFull = (num) => {
    const n = Number(num || 0);
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  console.log("Filter:", filter, "Date:", date);

  const fetchReport = async () => {
    try {
      setLoading(true);

      const res = await fetch(`http://localhost:5001/api/reports/dashboard?filter=${filter}&date=${date}`);
      const data = await res.json();

      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filter, date]);

  if (loading && !reportData) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Reports Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of business performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 shadow-sm"
          />

          {/* Filters */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-sm p-1">
            {['Today','This Week','This Month'].map((f)=> (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm rounded-lg transition-all duration-200 font-medium
                  ${filter===f 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-md transition-all duration-200 active:scale-95"
          >
            Logout
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Today's Sale Orders" value={reportData?.ordersCount || 0} subtitle="Orders" icon={<Package size={18} />} type="blue" />
        <StatCard 
          title="Total Received" 
          value={`Rs ${formatCurrency(reportData?.totalReceived)}`} 
          tooltip={`Rs ${formatFull(reportData?.totalReceived)}`}
          subtitle="Customers + Walk-in" 
          icon={<ArrowDown size={18} />} 
          type="green"
        />
        <StatCard 
          title="Total Paid to Suppliers" 
          value={`Rs ${formatCurrency(reportData?.totalPaid)}`} 
          tooltip={`Rs ${formatFull(reportData?.totalPaid)}`}
          subtitle="Suppliers" 
          icon={<ArrowUp size={18} />} 
          type="red"
        />
        <StatCard 
          title="Net Cash Flow Today" 
          value={`Rs ${formatCurrency(reportData?.netCashFlow)}`} 
          tooltip={`Rs ${formatFull(reportData?.netCashFlow)}`}
          subtitle="Net" 
          icon={<Wallet size={18} />} 
          type="blue"
        />
        <StatCard 
          title="Total Receivable" 
          value={`Rs ${formatCurrency(reportData?.totalReceivable)}`} 
          tooltip={`Rs ${formatFull(reportData?.totalReceivable)}`}
          subtitle="Customers owe" 
          icon={<Users size={18} />} 
          type="yellow"
        />
        <StatCard title="Total Payable" value={`Rs ${formatCurrency(reportData?.totalPaid)}`} tooltip={`Rs ${formatFull(reportData?.totalPaid)}`} subtitle="To suppliers" icon={<CreditCard size={18} />} type="red" />
        <StatCard 
          title="Cash in Hand" 
          value={`Rs ${formatCurrency((reportData?.totalReceived || 0) - (reportData?.totalPaid || 0))}`} 
          tooltip={`Rs ${formatFull((reportData?.totalReceived || 0) - (reportData?.totalPaid || 0))}`}
          subtitle="Available balance" 
          icon={<Wallet size={18} />} 
          type="blue"
        />
        <StatCard 
          title="Total Profit (Est.)" 
          value={`Rs ${formatCurrency(reportData?.profit)}`} 
          tooltip={`Rs ${formatFull(reportData?.profit)}`}
          subtitle="Today's estimate" 
          icon={<TrendingUp size={18} />} 
          type="purple"
        />
        <StatCard 
          title="Total Stock Value" 
          value={`Rs ${formatCurrency(reportData?.stockValue)}`} 
          tooltip={`Rs ${formatFull(reportData?.stockValue)}`}
          subtitle="Cost value" 
          icon={<Layers size={18} />} 
          type="teal"
        />
        <StatCard title="Low Stock Items" value={reportData?.lowStockItems || 0} subtitle="Items running low" icon={<AlertTriangle size={18} />} type="yellow" />
        <StatCard title="Total Books in Inventory" value={reportData?.totalBooks || 0} subtitle="Total book copies" icon={<BookOpen size={18} />} type="blue" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

        {/* Sales Trend - BIG */}
        <div className="lg:col-span-6">
          <SectionCard 
            title="Sales Trend" 
            
          >
            <div className="h-[240px]">
              <SalesChart data={reportData?.hourlySales || []} />
            </div>
          </SectionCard>
        </div>

        {/* Payment */}
        <div className="lg:col-span-3">
          <SectionCard title="Payment Flow" className="h-full">
            <div className="h-[240px] flex items-center justify-center">
              <PaymentChart data={reportData?.paymentFlow || { received: 0, paid: 0 }} />
            </div>
          </SectionCard>
        </div>

        {/* Summary */}
        <div className="lg:col-span-3">
          <SectionCard title="Summary" className="h-full">
            <div className="h-[240px] px-2 py-2">
              <SummaryPanel 
                compact 
                data={{
                  received: reportData?.totalReceived || 0,
                  paid: reportData?.totalPaid || 0,
                  profit: reportData?.profit || 0,
                }}
              />
            </div>
          </SectionCard>
        </div>

      </div>

    </div>
  );
}