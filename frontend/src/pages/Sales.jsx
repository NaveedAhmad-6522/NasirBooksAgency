import { useEffect, useState } from "react";
import { getSales } from "../services/api";

import Sidebar from "../components/Sidebar";
import SalesTable from "../components/SalesTable";
import SalesHeader from "../components/SalesHeader";
import SalesStats from "../components/SalesStats";
import Footer from "../components/Footer";

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
        `http://localhost:5001/api/sales?search=${search}&filter=${filter}&limit=20`
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
      const res = await fetch(`http://localhost:5001/api/sales/${sale.id}`);
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
        s.total_amount,
        Number(s.received_amount ?? s.paid_amount ?? 0),
        Number(s.remaining ?? 0),
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
    <div className="h-screen flex bg-gray-100 text-sm">

      <Sidebar />

      <div className="flex-1 p-6 overflow-auto space-y-4">

        <h1 className="text-xl font-bold">Sales History</h1>

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
          <SalesTable
            sales={filteredSales.map(s => ({
              ...s,
              customer_name: s.is_walkin === 1 ? null : s.customer_name,
              paid_amount: Number(s.received_amount ?? s.paid_amount ?? 0),
              remaining: Number(s.remaining ?? 0)
            }))}
            onView={handleView}
          />
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white rounded-xl p-6 w-[600px] shadow-lg">

            <h2 className="text-lg font-bold mb-4 border-b pb-2">
              Invoice #{selectedSale.sale.id}
            </h2>

            <div className="mb-4 text-sm">
              <p><strong>Customer:</strong> {selectedSale.sale.customer_name || "Walk-in"}</p>
              <p><strong>Date:</strong> {new Date(selectedSale.sale.created_at).toLocaleString()}</p>

              {/* 🔥 BALANCE */}
              <p className="text-orange-600">
                <strong>Customer Balance:</strong> Rs {selectedSale.sale.customer_balance || 0}
              </p>
            </div>

            <div className="border rounded-lg overflow-hidden text-sm">
              <div className="grid grid-cols-4 bg-gray-100 px-3 py-2 font-semibold">
                <div>Book</div>
                <div>Qty</div>
                <div>Price</div>
                <div>Total</div>
              </div>

              {selectedSale.items.map((item) => (
                <div key={item.id} className="grid grid-cols-4 px-3 py-2 border-t">
                  <div>{item.title}</div>
                  <div>{item.quantity}</div>
                  <div>Rs {item.price}</div>
                  <div>Rs {item.price * item.quantity}</div> 
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm space-y-1">
              <p><strong>Total:</strong> Rs {selectedSale.sale.total_amount}</p>
              <p className="text-green-600">
                <strong>Received:</strong> Rs {Number(selectedSale.sale.received_amount ?? selectedSale.sale.paid_amount ?? 0)}
              </p>
              {Number(selectedSale.sale.remaining ?? 0) > 0 && (
                <p className="text-gray-500">
                  <strong>Remaining:</strong> Rs {Number(selectedSale.sale.remaining)}
                </p>
              )}
            </div>

            <div className="mt-5 flex justify-between">

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Print
              </button>

              <button
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
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