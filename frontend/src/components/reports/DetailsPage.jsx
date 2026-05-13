import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL;

const authHeaders = (json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const handleClose = () => {
    window.close();
  };

export default function DetailsPage() {
  const [params] = useSearchParams();
  const type = params.get("type");
  const filter = params.get("filter");
  const date = params.get("date");

  const [data, setData] = useState([]);

  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      let endpoint = "";

      if (type === "sales") endpoint = "sales-details";
      if (type === "payments") endpoint = "payments-details";
      if (type === "receivable") endpoint = "receivable-details";

      const res = await fetch(
        `${API_BASE}/api/reports/${endpoint}?filter=${filter}&date=${date}`,
        {
          headers: authHeaders(),
        }
      );

      const result = await res.json();
      setData(result);
    };

    fetchData();
  }, [type, filter, date]);

  const filteredData = data.filter((row) => {
    const term = search.toLowerCase();

    if (type === "sales") {
      return (
        row.customer?.toLowerCase().includes(term) ||
        String(row.id).includes(term)
      );
    }

    if (type === "payments") {
      return (
        row.supplier?.toLowerCase().includes(term) ||
        String(row.id).includes(term)
      );
    }

    if (type === "receivable") {
      return row.customer?.toLowerCase().includes(term);
    }

    return true;
  });

  const receivedByCustomer = {};

  if (type === "sales") {
    filteredData.forEach(r => {
      const name = r.customer || "Walk-in";
      if (!receivedByCustomer[name]) receivedByCustomer[name] = 0;
      receivedByCustomer[name] += Number(r.paid_amount || 0);
    });
  }

  const receivedList = Object.entries(receivedByCustomer)
    .map(([customer, amount]) => ({ customer, amount }))
    .sort((a, b) => b.amount - a.amount);

  let total = 0;
  let paid = 0;
  let remaining = 0;

  if (type === "sales") {
    filteredData.forEach(r => {
      total += Number(r.total_amount || 0);
      paid += Number(r.paid_amount || 0);
      remaining += Number(r.remaining || 0);
    });
  }

  if (type === "payments") {
    filteredData.forEach(r => {
      total += Number(r.amount || 0);
    });
  }

  if (type === "receivable") {
    filteredData.forEach(r => {
      remaining += Number(r.balance || 0);
    });
  }

  const formatCurrency = (num) => {
    if (!num) return "Rs 0";
    if (num >= 1000000) return `Rs ${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `Rs ${(num / 1000).toFixed(1)}K`;
    return `Rs ${num}`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>

          {/* Breadcrumb */}
          <p className="text-xs text-gray-400 mb-1">
            Dashboard / Reports / {type}
          </p>

          <h1 className="text-2xl font-semibold capitalize">
            {type} Details
          </h1>

          <p className="text-sm text-gray-500">
            {filter} • {date}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-black text-xl px-2 py-1"
          title="Close"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {type === "sales" && (
          <>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-xl font-semibold">{formatCurrency(total)}</p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm">
              <p className="text-sm text-gray-500">Total Received</p>
              <p className="text-xl font-semibold text-green-600">{formatCurrency(paid)}</p>

              <div className="mt-3 max-h-32 overflow-y-auto text-xs space-y-1">
                {receivedList.length === 0 ? (
                  <p className="text-gray-400">No data</p>
                ) : (
                  receivedList.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-gray-600 truncate">{item.customer}</span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm">
              <p className="text-sm text-gray-500">Outstanding</p>
              <p className="text-xl font-semibold text-red-500">{formatCurrency(remaining)}</p>
            </div>
          </>
        )}

        {type === "payments" && (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-xl font-semibold text-red-500">{formatCurrency(total)}</p>
          </div>
        )}

        {type === "receivable" && (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Total Receivable</p>
            <p className="text-xl font-semibold text-red-500">{formatCurrency(remaining)}</p>
          </div>
        )}

      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <table className="w-full text-sm">

          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              {type === "sales" && (
                <>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Total</th>
                  <th className="p-3 text-left">Paid</th>
                  <th className="p-3 text-left">Remaining</th>
                </>
              )}

              {type === "payments" && (
                <>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Supplier</th>
                  <th className="p-3 text-left">Amount</th>
                </>
              )}

              {type === "receivable" && (
                <>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Balance</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-400">
                  No data found
                </td>
              </tr>
            ) : (
              filteredData.map((row, i) => (
                <tr key={i} className="border-t hover:bg-gray-50 transition">
                  {type === "sales" && (
                    <>
                      <td className="p-3">#{row.id}</td>
                      <td className="p-3 font-medium">{row.customer}</td>
                      <td className="p-3">{formatCurrency(row.total_amount)}</td>
                      <td className="p-3 text-green-600">{formatCurrency(row.paid_amount)}</td>
                      <td className="p-3 text-red-500">{formatCurrency(row.remaining)}</td>
                    </>
                  )}

                  {type === "payments" && (
                    <>
                      <td className="p-3">#{row.id}</td>
                      <td className="p-3 font-medium">{row.supplier}</td>
                      <td className="p-3 text-red-500">{formatCurrency(row.amount)}</td>
                    </>
                  )}

                  {type === "receivable" && (
                    <>
                      <td className="p-3 font-medium">{row.customer}</td>
                      <td className="p-3 text-red-500">{formatCurrency(row.balance)}</td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}