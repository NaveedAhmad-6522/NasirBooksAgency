import React, { useState, useRef, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from "recharts";
import { DollarSign, ShoppingCart, Users, Wallet, LayoutDashboard, Calendar } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";


function Dashboard() {

  const [filter, setFilter] = useState("Last 7 Days");
  const [data, setData] = useState(null);
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

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";
useEffect(() => {
  fetch(`${API}/api/dashboard?filter=${filter}`)
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      return res.json();
    })
    .then(res => setData(res))
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
  const normalizedData = salesData
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
    .sort((a, b) => (a.rawDate > b.rawDate ? 1 : -1));
  const hasData = normalizedData.length > 0;
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

  const salesChange = getChange(normalizedData, "total");
  const ordersChange = getChange(normalizedData, "orders");
  const customersChange = getChange(normalizedData, "customers");

  return (
  <div className="flex">
    <Sidebar />

    <div className="flex-1 min-h-screen bg-gray-50 flex flex-col">
      <div className="p-6 space-y-6 flex-1">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
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
      <div className="grid grid-cols-4 gap-4">

        {/* SALES */}
        <div className="bg-white p-5 rounded-xl shadow flex flex-col gap-3 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-500 text-white">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sales ({filter})</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data?.sales?.totalSales || 0)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className={salesChange >= 0 ? "text-green-500" : "text-red-500"}>
              {salesChange >= 0 ? "▲" : "▼"} {Math.abs(salesChange).toFixed(1)}% {filter === "Today" ? "vs Previous Hour" : "vs Avg Previous"}
            </span>
            <div className="w-24 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filter === "Today" ? normalizedData : normalizedData.slice(-7)}>
                  <defs>
                    <linearGradient id="miniSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#16a34a"
                    fill="url(#miniSales)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ORDERS */}
        <div className="bg-white p-5 rounded-xl shadow flex flex-col gap-3 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 text-white">
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
            <div className="w-24 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filter === "Today" ? normalizedData : normalizedData.slice(-7)}>
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
        <div className="bg-white p-5 rounded-xl shadow flex flex-col gap-3 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-500 text-white">
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
            <div className="w-24 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filter === "Today" ? normalizedData : normalizedData.slice(-7)}>
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

        {/* RECEIVABLE */}
        <div className="bg-white p-5 rounded-xl shadow flex flex-col gap-3 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-orange-500 text-white">
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Receivable</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(data?.receivable?.receivable || 0)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>From {data?.sales?.totalOrders || 0} Sales</span>
            <div className="w-24 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filter === "Today" ? normalizedData : normalizedData.slice(-7)}>
                  <defs>
                    <linearGradient id="miniReceivable" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="receivable"
                    stroke="#f97316"
                    fill="url(#miniReceivable)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* ATTENTION PANEL */}
      

      {/* SALES CHART PLACEHOLDER */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">
          {filter === "Today" ? "Sales (Today - Hourly)" : `Sales (${filter})`}
        </h2>
        <div className="w-full h-[260px] overflow-hidden">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filter === "Today" ? normalizedData : normalizedData.slice(-7)}>
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
      <div className="grid grid-cols-2 gap-4">

        {/* TOP BOOKS */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            📚 Top Selling Books
          </h2>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th>#</th>
                <th>Title</th>
                <th>Publisher</th>
                <th>Sold</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data?.topBooks) && data.topBooks.map((b, i) => (
                <tr key={i} className="border-t">
                  <td>{i + 1}</td>
                  <td>{b.title}</td>
                  <td className="text-gray-500 text-xs">{b.publisher || "-"}</td>
                  <td className="font-semibold">{b.sold}</td>
                </tr>
              ))}
              {(!data?.topBooks || data.topBooks.length === 0) && (
                <tr>
                  <td colSpan="4" className="text-center text-gray-400 py-4">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
         
        </div>

        {/* LOW STOCK */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            ⚠️ Low Stock (Below 10)
          </h2>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th>#</th>
                <th>Title</th>
                <th>Publisher</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data?.lowStock) && data.lowStock.map((b, i) => (
                <tr key={i} className="border-t">
                  <td>{i + 1}</td>
                  <td>{b.title}</td>
                  <td className="text-gray-500 text-xs">{b.publisher || "-"}</td>
                  <td className={b.stock <= 0 ? "text-red-600 font-bold" : "text-orange-500 font-medium"}>
                    {b.stock}
                  </td>
                </tr>
              ))}
              {(!data?.lowStock || data.lowStock.length === 0) && (
                <tr>
                  <td colSpan="4" className="text-center text-gray-400 py-4">No low stock items</td>
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