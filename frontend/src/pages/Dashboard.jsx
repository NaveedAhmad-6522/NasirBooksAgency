import React, { useState, useRef, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from "recharts";
import { DollarSign, ShoppingCart, Users, Wallet, LayoutDashboard, Calendar } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";


function Dashboard() {

  const [filter, setFilter] = useState("Last 7 Days");
  const [data, setData] = useState(null);
  const [lowStockLimit] = useState(10);
  const [lowStockOffset, setLowStockOffset] = useState(0);
  const [lowStockData, setLowStockData] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const API = import.meta.env.VITE_API_URL;

  const authHeaders = (json = false) => ({
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });
const cacheRef = useRef({});
useEffect(() => {
  setLowStockData([]);
  setLowStockOffset(0);

  // Simple cache for dashboard data by filter
  if (cacheRef.current[filter]) {
    setData(cacheRef.current[filter]);
    // Still need to fetch low stock from dedicated endpoint
    fetch(`${API}/api/dashboard/low-stock?limit=10&offset=0`, {
      headers: authHeaders(),
    })
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(text);
        }
        return r.json();
      })
      .then(ls => {
        setLowStockData(ls.data || []);
        setLowStockOffset(10);
      });
    return;
  }

  fetch(`${API}/api/dashboard?filter=${filter}`, {
    headers: authHeaders(),
  })    .then(async (res) => {
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return;
    }
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
      return res.json();
    })
    .then(res => {
      setData(res);
      cacheRef.current[filter] = res;
      // initial low stock fetch
      fetch(`${API}/api/dashboard/low-stock?limit=10&offset=0`, {
        headers: authHeaders(),
      })        .then(async r => {
          if (!r.ok) {
            const text = await r.text();
            throw new Error(text);
          }
          return r.json();
        })
        .then(ls => {
          setLowStockData(ls.data || []);
          setLowStockOffset(10);
        });
    })
    .catch(err => {
      console.error("Dashboard API Error:", err);
    });
}, [filter]);

  const getLabel = () => {
    if (filter === "Today") {
      const today = new Date();
      return today.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    return filter;
  };

  const formatCurrency = (num) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(num);

  const salesData = data?.chart || [];
  const normalizedData = useMemo(() => salesData
    .map(d => {
      // If backend sends hour (Today case)
      if (typeof d.hour !== "undefined") {
        return {
          rawDate: d.hour,
          date: `${String(d.hour).padStart(2, '0')}:00`,
          total: Number(d.total || 0),
          orders: Number(d.orders || d.total || 0),
          customers: Number(d.customers || d.total || 0),
          receivable: Number(d.receivable || d.total || 0),
        };
      }

      // Otherwise (daily data)
      const rawDate = d.date ? new Date(d.date) : null;
      return {
        rawDate,
        date: rawDate
          ? rawDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
          : '',
        total: Number(d.total || 0),
        orders: Number(d.orders || d.total || 0),
        customers: Number(d.customers || d.total || 0),
        receivable: Number(d.receivable || d.total || 0),
      };
    })
    .sort((a, b) => (a.rawDate > b.rawDate ? 1 : -1)), [salesData]);
  const hasData = normalizedData.length > 0;
  const chartData = filter === "Today" ? normalizedData.slice(-24) : normalizedData.slice(-7);
  // Find peak value (highest sales point)
const maxPoint = Math.max(...normalizedData.map(d => d.total || 0));
  const getChange = (arr, key) => {
    if (!arr.length) return 0;
  
    const current = Number(arr[arr.length - 1]?.[key] || 0);
  
    let previous = 0;
  
    if (filter === "Today") {
      // Compare with previous hour
      previous = Number(arr[arr.length - 2]?.[key] || 0);
    } else {
      // Compare with average of previous period (more accurate)
      const prevSlice = arr.slice(0, -1);
  
      if (prevSlice.length > 0) {
        const sum = prevSlice.reduce((acc, item) => acc + Number(item[key] || 0), 0);
        previous = sum / prevSlice.length;
      }
    }
  
    if (previous === 0) return current === 0 ? 0 : 100;
  
    return ((current - previous) / previous) * 100;
  };

  const salesChange = getChange(chartData, "total");
  const ordersChange = getChange(chartData, "orders");
  const customersChange = getChange(chartData, "customers");
  const visibleLowStock = lowStockData;
  const handleLowStockScroll = async (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    if (
      scrollTop + clientHeight >= scrollHeight - 5 &&
      data
    ) {
      // request protection
      if (loadingMore) return;
      if (lowStockData.length >= (data?.lowStockTotal || 0)) return;
      // (assumes backend still sends total count in dashboard)

      setLoadingMore(true);

      try {
        const res = await fetch(
          `${API}/api/dashboard/low-stock?limit=10&offset=${lowStockOffset}`,
          {
            headers: authHeaders(),
          }
        );
        const newData = await res.json();
        if (!newData.data || newData.data.length === 0) {
          setLoadingMore(false);
          return;
        }
        setLowStockData(prev => [...prev, ...newData.data]);
        setLowStockOffset(prev => prev + 10);
      } catch (err) {
        console.error(err);
      }

      setLoadingMore(false);
    }
  };

  return (
  <div className="flex">
    <Sidebar />

    <div className="flex-1 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <div className="p-4 space-y-4 flex-1">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <LayoutDashboard className="text-gray-700" />
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm">
            Welcome back! Here's what's happening in your store.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow text-sm text-gray-600 cursor-pointer"
            >
              <Calendar size={16} />
              <span>{getLabel()}</span>
              <span className="text-gray-400">▾</span>
            </div>
            {open && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow text-sm z-10">
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setFilter("Today");
                    setOpen(false);
                  }}
                >
                  Today
                </div>
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setFilter("Last 7 Days");
                    setOpen(false);
                  }}
                >
                  Last 7 Days
                </div>
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setFilter("This Month");
                    setOpen(false);
                  }}
                >
                  This Month
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow">
            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
            <span className="text-sm font-medium">Admin</span>
          </div>
        </div>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-4 gap-3">

        {/* SALES (CONFIDENTIAL) */}
        <div className="bg-white/90 backdrop-blur p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col gap-3 opacity-70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-green-100 text-green-600">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sales</p>
              <p className="text-2xl font-bold text-green-600">Rs ****</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Confidential</p>
        </div>

        {/* ORDERS */}
        <div className="bg-white/90 backdrop-blur p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <ShoppingCart size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Orders ({filter})</p>
                <p className="text-2xl font-bold text-blue-600">{data?.sales?.totalOrders || 0}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className={ordersChange >= 0 ? "text-green-500" : "text-red-500"}>
              {ordersChange >= 0 ? "▲" : "▼"} {Math.abs(ordersChange).toFixed(1)}% {filter === "Today" ? "vs Previous Hour" : "vs Avg Previous"}
            </span>
            <div className="w-20 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="miniOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#2563eb"
                    fill="url(#miniOrders)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* CUSTOMERS */}
        <div className="bg-white/90 backdrop-blur p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Users size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold text-purple-600">{data?.customers?.totalCustomers || 0}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className={customersChange >= 0 ? "text-green-500" : "text-red-500"}>
              {customersChange >= 0 ? "▲" : "▼"} {Math.abs(customersChange).toFixed(1)}% {filter === "Today" ? "vs Previous Hour" : "vs Avg Previous"}
            </span>
            <div className="w-20 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="miniCustomers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="customers"
                    stroke="#7c3aed"
                    fill="url(#miniCustomers)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RECEIVABLE (CONFIDENTIAL) */}
        <div className="bg-white/90 backdrop-blur p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col gap-3 opacity-70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Receivable</p>
              <p className="text-2xl font-bold text-orange-600">Rs ****</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Confidential</p>
        </div>

      </div>

      {/* ATTENTION PANEL */}
      

      {/* SALES CHART PLACEHOLDER */}
      <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
        <h2 className="font-semibold text-gray-800 mb-4">
          {filter === "Today" ? "Sales (Today - Hourly)" : `Sales (${filter})`}
        </h2>
        <div className="w-full h-[200px] overflow-hidden">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  interval={0}
                  tickFormatter={(value) => {
                    if (filter === "Today") return value; // already formatted like 10:00
                    return value;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#16a34a"
                  fill="url(#colorSales)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Loading chart...
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM TABLES */}
      <div className="grid grid-cols-2 gap-3 items-stretch">

        {/* TOP BOOKS */}
        <div className="bg-white/90 backdrop-blur p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
            📚 Top Selling Books
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">Scroll</span>
          </h2>
          <div
            className="flex-1 overflow-x-auto max-h-[260px] overflow-y-auto rounded-xl border border-gray-200 shadow-sm bg-white/80 backdrop-blur"
          >
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 z-10 text-gray-600 text-xs uppercase tracking-wide">
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wide border-b">
                <th>#</th>
                <th>Title</th>
                <th>Publisher</th>
                <th>Edition</th>
                <th>Sold</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data?.topBooks) && data.topBooks.slice(0, 10).map((b, i) => (
                <tr key={i} className={`border-b transition-all duration-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                  <td>{i + 1}</td>
                  <td className="font-medium text-gray-800">{b.title}</td>
                  <td className="text-gray-500 text-xs">{b.publisher || "-"}</td>
                  <td className="text-gray-500 text-xs">{b.edition || "-"}</td>
                  <td className="font-semibold">{b.sold}</td>
                </tr>
              ))}
              {(!data?.topBooks || data.topBooks.length === 0) && (
                <tr>
                  <td colSpan="5" className="text-center text-gray-400 py-4">No data available 📭</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
         
        </div>

        {/* LOW STOCK */}
        <div className="bg-white/90 backdrop-blur p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
            ⚠️ Low Stock (Below 15)
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">Scroll</span>
          </h2>
          <div className="flex gap-2 mb-4 items-center">
            <div className="bg-red-50 text-red-600 px-3 py-2 rounded-full text-xs font-semibold border border-red-200">
              Critical: {data?.criticalCount || 0}
            </div>
            <div className="bg-orange-50 text-orange-600 px-3 py-2 rounded-full text-xs font-semibold border border-orange-200">
              Low: {data?.warningCount ?? '-'}
            </div>
          </div>
          <div
            className="flex-1 overflow-x-auto max-h-[260px] overflow-y-auto rounded-xl border border-gray-200 shadow-sm bg-white/80 backdrop-blur"
            onScroll={handleLowStockScroll}
          >
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 z-10 text-gray-600 text-xs uppercase tracking-wide">
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wide border-b">
                <th>#</th>
                <th>Title</th>
                <th>Publisher</th>
                <th>Edition</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(visibleLowStock) && visibleLowStock.map((b, i) => (
                <tr key={i} className={`border-b transition-all duration-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                  <td>{i + 1}</td>
                  <td className="font-medium text-gray-800">{b.title}</td>
                  <td className="text-gray-500 text-xs">{b.publisher || "-"}</td>
                  <td className="text-gray-500 text-xs">{b.edition || "-"}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      b.stock <= 5
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-orange-50 text-orange-600 border border-orange-200"
                    }`}>
                      {b.stock}
                    </span>
                  </td>
                </tr>
              ))}
              {loadingMore && (
                <tr>
                  <td colSpan="5" className="text-center text-gray-400 py-2 text-xs">
                    Loading more books...
                  </td>
                </tr>
              )}
              {(!data?.lowStock || data.lowStock.length === 0) && (
                <tr>
                  <td colSpan="5" className="text-center text-gray-400 py-4">No data available 📭</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

      </div>

      </div>

      <Footer />
    </div>
  </div>
);
}
export default Dashboard;