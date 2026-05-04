import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "./StatCard";
import SectionCard from "./SectionCard";
import SalesChart from "./SalesChart";
import PaymentChart from "./PaymentChart";
import SummaryPanel from "./SummaryPanel";
import { Package, ArrowDown, ArrowUp, Wallet, TrendingUp, AlertTriangle, BookOpen, Layers, CreditCard, Users } from "lucide-react";

export default function ReportsDashboard({ onLogout }) {
  const getPKDate = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(now);
  };

  const [filter, setFilter] = useState("Today");
  const [date, setDate] = useState(getPKDate());

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const openDetailsPage = async (type) => {
    try {
      let endpoint = "";

      if (type === "sales") endpoint = "sales-details";
      if (type === "payments") endpoint = "payments-details";
      if (type === "receivable") endpoint = "receivable-details";
      if (type === "payable") endpoint = "payable-details";
      if (type === "inventory") endpoint = "inventory-details";
      if (type === "lowstock") endpoint = "lowstock-details";
      if (type === "profit") endpoint = "profit-details";
      if (type === "customerReturns") endpoint = "customer-returns-details";
      if (type === "supplierReturns") endpoint = "supplier-returns-details";

      if (!endpoint) {
        alert("Invalid export type");
        return;
      }

      const res = await fetch(`http://localhost:5001/api/reports/${endpoint}?filter=${filter}&date=${date}`);
      const data = await res.json();

      if (!data || data.length === 0) {
        alert("No data to export");
        return;
      }

      // Convert to CSV
      let headers = Object.keys(data[0]);

      // Custom headers for payable
      if (type === "payable") {
        headers = ["supplier", "balance"];
      }
      if (type === "inventory") {
        headers = [
          "title",
          "publisher",
          "category",
          "edition",
          "printed_price",
          "purchase_price",
          "current_price",
          "stock",
          "total_cost",
          "total_retail",
          "potential_profit"
        ];
      }
      if (type === "profit") {
        headers = [
          "title",
          "publisher",
          "edition",
          "purchase_price",
          "selling_price",
          "current_price",
          "printed_price",
          "total_sold",
          "profit_per_unit",
          "profit_percentage",
          "total_profit"
        ];
      }

      if (type === "lowstock") {
        headers = [
          "title",
          "publisher",
          "edition",
          "stock"
        ];
      }
      if (type === "customerReturns") {
        headers = [
          "return_id",
          "customer",
          "title",
          "publisher",
          "edition",
          "quantity",
          "purchase_price",
          "printed_price",
          "total_amount",
          "return_date"
        ];
      }

      if (type === "supplierReturns") {
        headers = [
          "id",
          "title",
          "publisher",
          "edition",
          "supplier",
          "quantity",
          "purchase_price",
          "total_amount",
          "return_date"
        ];
      }

      const csvRows = [headers.join(",")];

      data.forEach(row => {
        const values = headers.map(h => `"${row[h] ?? ""}"`);
        csvRows.push(values.join(","));
      });

      const csvContent = csvRows.join("\n");

      // Download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}_details_${date}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error(err);
      alert("Export failed");
    }
  };

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
        <StatCard 
          title="Today's Sales" 
          value={
            <span title={`Rs ${formatFull(reportData?.totalSales || 0)}`}>
              Rs {formatCurrency(reportData?.totalSales || 0)}
            </span>
          } 
          subtitle={`${reportData?.ordersCount || 0} Orders`} 
          tooltip={`Total Sales: Rs ${formatFull(reportData?.totalSales || 0)}`}
          icon={<Package size={18} />} 
          type="blue" 
        />
        <StatCard 
          title="Total Received" 
          value={`Rs ${formatCurrency(reportData?.totalReceived)}`} 
          tooltip={`Rs ${formatFull(reportData?.totalReceived)}`}
          subtitle="Customers + Walk-in" 
          icon={<ArrowDown size={18} />} 
          type="green"
          onClick={() => openDetailsPage("sales")}
          className="cursor-pointer"
        />
        <StatCard 
          title="Total Paid to Suppliers" 
          value={`Rs ${formatCurrency(reportData?.totalPaid)}`} 
          tooltip={`Rs ${formatFull(reportData?.totalPaid)}`}
          subtitle="Suppliers" 
          icon={<ArrowUp size={18} />} 
          type="red"
          onClick={() => openDetailsPage("payments")}
          className="cursor-pointer"
        />
        <StatCard 
          title="Customer Returns" 
          value={`Rs ${formatCurrency(reportData?.customerReturns)}`} 
          tooltip={`Rs ${formatFull(reportData?.customerReturns)}`}
          subtitle="Returned by customers" 
          icon={<ArrowDown size={18} />} 
          type="orange"
          onClick={() => openDetailsPage("customerReturns")}
          className="cursor-pointer"
        />
        <StatCard 
          title="Supplier Returns" 
          value={`Rs ${formatCurrency(reportData?.supplierReturns)}`} 
          tooltip={`Rs ${formatFull(reportData?.supplierReturns)}`}
          subtitle="Returned to suppliers" 
          icon={<ArrowUp size={18} />} 
          type="red"
          onClick={() => openDetailsPage("supplierReturns")}
          className="cursor-pointer"
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
          onClick={() => openDetailsPage("receivable")}
          className="cursor-pointer"
        />
        <StatCard 
          title="Total Payable" 
          value={`Rs ${formatCurrency(reportData?.totalPayable)}`} 
          tooltip={`Rs ${formatFull(reportData?.totalPayable)}`} 
          subtitle="To suppliers" 
          icon={<CreditCard size={18} />} 
          type="red"
          onClick={() => openDetailsPage("payable")}
          className="cursor-pointer"
        />
        <StatCard 
          title="Total Profit (Est.)" 
          value={`Rs ${formatCurrency(reportData?.profit)}`} 
          tooltip={`Rs ${formatFull(reportData?.profit)}`}
          subtitle="Click to export details" 
          icon={<TrendingUp size={18} />} 
          type="purple"
          onClick={() => openDetailsPage("profit")}
          className="cursor-pointer"
        />
        <StatCard 
          title="Total Stock Value" 
          value={`Rs ${formatCurrency(reportData?.stockValue)}`} 
          tooltip={`Rs ${formatFull(reportData?.stockValue)}`}
          subtitle="Cost value" 
          icon={<Layers size={18} />} 
          type="teal"
          onClick={() => openDetailsPage("inventory")}
          className="cursor-pointer"
        />
        <StatCard 
          title="Low Stock Items" 
          value={reportData?.lowStockItems || 0} 
          subtitle="Items running low" 
          icon={<AlertTriangle size={18} />} 
          type="yellow"
          onClick={() => openDetailsPage("lowstock")}
          className="cursor-pointer"
        />
        <StatCard 
          title="Total Books in Inventory" 
          value={reportData?.totalBooks || 0} 
          subtitle="Total book copies" 
          icon={<BookOpen size={18} />} 
          type="blue"
          onClick={() => openDetailsPage("inventory")}
          className="cursor-pointer"
        />
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
                  customerReturns: reportData?.customerReturns || 0,
                  supplierReturns: reportData?.supplierReturns || 0,
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