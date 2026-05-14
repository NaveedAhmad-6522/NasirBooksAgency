import { useEffect, useState } from "react";
import { getSales } from "../services/api";

import Sidebar from "../components/Sidebar";
import SalesTable from "../components/SalesTable";
import SalesHeader from "../components/SalesHeader";
import SalesStats from "../components/SalesStats";
import Footer from "../components/Footer";

const API_BASE = import.meta.env.VITE_API_URL;

const authHeaders = (json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

function Sales() {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("today");
  const [selectedSale, setSelectedSale] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔥 LOAD SALES
  const loadSales = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE}/api/sales?search=${search}&filter=${filter}&limit=20`,
        {
          headers: authHeaders(),
        }
      );

      const data = await res.json();

      setSales(data || []);
      setFilteredSales(data || []);

    } catch (err) {
      console.error(err);
      setError("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  // 🔥 FETCH FULL SALE
  const handleView = async (sale) => {
    try {
      const res = await fetch(`${API_BASE}/api/sales/${sale.id}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setSelectedSale(data);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔍 FILTER
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadSales();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, filter]);

  // 🔄 REFRESH
  const handleRefresh = () => {
    loadSales();
  };

  // 📄 EXPORT (UPDATED WITH BALANCE)
  const handleExport = () => {
    if (filteredSales.length === 0) {
      alert("No data to export");
      return;
    }

    const rows = [
      ["ID", "Customer", "Total", "Paid", "Remaining", "Balance", "Date"],
      ...filteredSales.map((s) => [
        s.id,
        s.customer_name || "Walk-in",
        Number(s.total_amount).toFixed(2),
        Number(s.received_amount ?? s.paid_amount ?? 0).toFixed(2),
        Number(s.remaining ?? 0).toFixed(2),
        s.customer_balance || 0,
        new Date(s.created_at).toLocaleString(),
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `sales_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="h-screen flex bg-gray-100 text-sm overflow-hidden">

      <Sidebar />

      <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto space-y-4 w-full max-w-[1800px] mx-auto min-w-0">

        <h1 className="text-lg sm:text-xl font-bold">Sales History</h1>

        <SalesHeader
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          onRefresh={handleRefresh}
          onExport={handleExport}
        />

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-10 text-gray-400">
            Loading sales...
          </div>
        )}

        {!loading && <SalesStats sales={sales} filter={filter} />}

        {!loading && (
          <div className="overflow-x-auto rounded-xl">
          <SalesTable
            sales={filteredSales.map(s => ({
              ...s,
              customer_name: s.is_walkin === 1 ? null : s.customer_name,
              total_amount: Number(s.total_amount).toFixed(2),
              paid_amount: Number(s.received_amount ?? s.paid_amount ?? 0).toFixed(2),
              remaining: Number(s.remaining ?? 0).toFixed(2)
            }))}
            onView={handleView}
          />
          </div>
        )}

        {!loading && filteredSales.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            No sales found
          </div>
        )}

        <Footer />
      </div>

      {/* 🔥 INVOICE MODAL */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3 sm:p-4 overflow-auto">

          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-[600px] shadow-lg">

            <h2 className="text-lg font-bold mb-4 border-b pb-2">
              Invoice #{selectedSale.sale.id}
            </h2>

            <div className="mb-4 text-sm bg-gray-50 border rounded-lg p-3 space-y-1">

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p>
                  <strong>Customer:</strong>{" "}
                  {selectedSale.sale.customer_name || "Walk-in Customer"}
                </p>

                {selectedSale.sale.is_walkin === 1 && (
                  <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                    WALK-IN SALE
                  </span>
                )}
              </div>

              <p>
                <strong>Invoice:</strong> #{selectedSale.sale.id}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {new Date(selectedSale.sale.created_at).toLocaleString()}
              </p>

              {selectedSale.sale.phone && (
                <p>
                  <strong>Phone:</strong> {selectedSale.sale.phone}
                </p>
              )}

              {selectedSale.sale.city && (
                <p>
                  <strong>City:</strong> {selectedSale.sale.city}
                </p>
              )}

              {selectedSale.sale.address && (
                <p>
                  <strong>Address:</strong> {selectedSale.sale.address}
                </p>
              )}

              {selectedSale.sale.customer_balance !== undefined &&
                selectedSale.sale.customer_balance !== null &&
                selectedSale.sale.is_walkin !== 1 && (
                  <p>
                    <strong>Customer Balance:</strong>{" "}
                    <span className={`${Number(selectedSale.sale.customer_balance) > 0 ? "text-red-600" : "text-green-600"}`}>
                      Rs {Number(selectedSale.sale.customer_balance).toFixed(2)}
                    </span>
                  </p>
              )}

            </div>

            <div className="border rounded-lg overflow-x-auto text-sm">
              <div className="grid grid-cols-4 min-w-[500px] bg-gray-100 px-3 py-2 font-semibold">
                <div>Book</div>
                <div>Qty</div>
                <div>Price</div>
                <div>Total</div>
              </div>

              {selectedSale.items.map((item) => (
                <div key={item.id} className="grid grid-cols-4 min-w-[500px] px-3 py-2 border-t">
                  <div className="font-medium">{item.title}</div>
                  {(item.publisher || item.author || item.edition) && (
                    <div className="text-[11px] text-gray-500 leading-tight mt-0.5">
                      {item.author ? `${item.author}` : ""}
                      {item.author && item.publisher ? " • " : ""}
                      {item.publisher ? item.publisher : ""}
                      {(item.author || item.publisher) && item.edition ? " • " : ""}
                      {item.edition ? `Edition: ${item.edition}` : ""}
                    </div>
                  )}
                  <div>{item.quantity}</div>
                  <div>Rs {item.price}</div>
                  <div className="font-semibold">
                    Rs {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm space-y-1">
              <p><strong>Total:</strong> Rs {Number(selectedSale.sale.total_amount).toFixed(2)}</p>
              <p className="text-green-600">
                <strong>Received:</strong> Rs {Number(selectedSale.sale.received_amount ?? selectedSale.sale.paid_amount ?? 0).toFixed(2)}
              </p>
              {Number(selectedSale.sale.remaining ?? 0) > 0 && (
                <p className="text-gray-500">
                  <strong>Remaining:</strong> Rs {Number(selectedSale.sale.remaining).toFixed(2)}
                </p>
              )}
            </div>

            <div className="mt-5 flex flex-col sm:flex-row justify-between gap-3">

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full sm:w-auto"
              >
                Print
              </button>

              <button
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 w-full sm:w-auto"
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Sales;