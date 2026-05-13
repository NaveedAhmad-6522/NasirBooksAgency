import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function CustomerReturn() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasMore: false,
    limit: 50,
  });

  // Fetch customer sales with remaining quantities (to allow return)
  useEffect(() => {
    fetchCustomer();
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchSales();
  }, [id, page, debouncedSearch]);
  const fetchCustomer = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/customers/${id}`);

      // 🔥 handle 404 or non-JSON response
      if (!res.ok) {
        console.warn("Customer not found or API missing");
        setCustomer(null);
        return;
      }

      const data = await res.json();
      setCustomer(data);
    } catch (err) {
      console.error("Fetch customer error:", err);
      setCustomer(null);
    }
  };

  const fetchSales = async () => {
    try {
      setInitialLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        search: debouncedSearch,
      });

      const res = await fetch(
        `http://localhost:5001/api/customers/${id}/sales?${params}`
      );

      const data = await res.json();

      setSales(Array.isArray(data?.data) ? data.data : []);

      setPagination(
        data?.pagination || {
          total: 0,
          totalPages: 1,
          hasMore: false,
          limit: 50,
        }
      );

      setInitialLoading(false);
    } catch (err) {
      setInitialLoading(false);
      console.error("Fetch sales error:", err);
    }
  };

  const handleQtyChange = (saleId, value, maxQty) => {
    let qty = Number(value || 0);

    // prevent negative and over-return
    if (qty < 0) qty = 0;
    if (qty > maxQty) qty = maxQty;

    setSelectedItems((prev) => ({
      ...prev,
      [saleId]: qty,
    }));
  };

  const handleSubmit = async () => {
    const items = Object.entries(selectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([id, quantity]) => ({
        sale_item_id: Number(id), // 🔥 ensure numeric ID
        quantity: Number(quantity),
      }));

    if (!items.length) {
        alert("Please enter quantity for at least one item");
        return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "http://localhost:5001/api/customers/return",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: id,
            items,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Return failed");
        return;
      }

      alert("Return processed successfully");

      // 🔥 clear selections
      setSelectedItems({});

      // 🔥 refresh latest quantities automatically
      await fetchSales();
      await fetchCustomer();
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const filteredSales = sales;

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-4 2xl:px-8">
      <div className="w-full mx-auto">
      <div className="mb-3 bg-white border border-slate-200 rounded-2xl shadow-sm px-3 sm:px-4 lg:px-5 py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3">

  <div className="flex items-center gap-3 min-w-0 flex-1">
    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-900 text-white flex items-center justify-center text-base sm:text-lg font-bold shrink-0">
      ↩
    </div>

    <div className="min-w-0">
      <div className="text-lg sm:text-xl font-bold text-slate-900 truncate">
        Customer Returns
      </div>

      <div className="text-sm text-slate-500 truncate">
        {customer?.name || "Customer"}
        {customer?.phone ? ` • ${customer.phone}` : ""}
      </div>
    </div>
  </div>

  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full xl:w-auto xl:flex-none">
    <input
      type="text"
      placeholder="Search book or publisher..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="h-10 sm:h-11 w-full xl:w-[360px] 2xl:w-[420px] rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-400 transition"
    />

    <div className="flex items-center justify-center gap-2 px-3 sm:px-4 h-10 sm:h-11 rounded-xl bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold whitespace-nowrap">
      {pagination.total || 0} Books
    </div>
  </div>
</div>

      {sales.length >= 100 && (
        <div className="mb-5 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-2xl shadow-sm">
          Showing first 100 books only. Use search (coming next) for large data.
        </div>
      )}
      <div className="bg-white/90 backdrop-blur-sm shadow-[0_20px_70px_rgba(15,23,42,0.08)] rounded-2xl lg:rounded-[30px] border border-white overflow-hidden">
        <div className="px-3 sm:px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">Purchased Books</h3>
            <p className="text-sm text-gray-500 mt-1">
              Select quantities to process customer returns.
            </p>
          </div>
        </div>

        <div className="overflow-auto min-h-[400px] max-h-[calc(100vh-220px)]">
          <table className="min-w-[1050px] w-full text-xs sm:text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b text-left text-gray-600 uppercase text-[10px] sm:text-[11px] tracking-[0.12em] sm:tracking-[0.18em]">
              <tr>
                <th className="px-3 py-2">Book</th>
                <th className="px-3 py-2 text-gray-400 text-sm">—</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Total Qty</th>
                <th className="px-3 py-2">Returned</th>
                <th className="px-3 py-2">Remaining</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Discount</th>
                <th className="px-3 py-2">Return</th>
              </tr>
            </thead>

            <tbody>
              {initialLoading ? (
                <tr>
                  <td className="px-3 py-2" colSpan="9">Loading...</td>
                </tr>
              ) : !Array.isArray(filteredSales) || filteredSales.length === 0 ? (
                <tr>
                  <td className="px-3 py-2" colSpan="9">No sales found for this customer</td>
                </tr>
              ) : (
                filteredSales.map((s, index) => (
                  <tr
                    key={s.id}
                    className={`border-b border-gray-100 transition-all duration-200 ${
                      selectedItems[s.id]
                        ? "bg-slate-100 border-slate-300"
                        : index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    } hover:bg-slate-100`}
                  >
                    <td className="px-3 py-2">
                      <div className="font-semibold text-[13px] sm:text-[14px] text-slate-900 leading-tight">
                        {s.book_name}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1">
                        {s.publisher ? s.publisher : "—"}
                        {s.edition ? ` • ${s.edition}` : ""}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-400 text-sm">—</td>
                    <td className="px-3 py-2 text-gray-500">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <span className="bg-slate-100 text-slate-700 rounded-full text-xs font-semibold px-3 py-1">
                        {Number(s.quantity || 0)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="bg-rose-100 text-rose-700 rounded-full text-xs font-semibold px-3 py-1">
                        {Number(s.returned_quantity || 0)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold px-3 py-1">
                        {Math.max(
                          Number(s.quantity || 0) - Number(s.returned_quantity || 0),
                          0
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-emerald-600 font-bold text-sm">
                      Rs {Number(s.price || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      {s.discount_percentage ? (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">
                          {s.discount_percentage}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={Math.max(
                            Number(s.quantity || 0) - Number(s.returned_quantity || 0),
                            0
                          )}
                          className="h-9 sm:h-10 w-16 sm:w-20 rounded-xl border border-gray-200 bg-white text-center text-xs sm:text-sm font-semibold shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition"
                          onChange={(e) =>
                            handleQtyChange(s.id, e.target.value, Math.max(
                              Number(s.quantity || 0) - Number(s.returned_quantity || 0),
                              0
                            ))
                          }
                        />
                        <span className="text-xs text-gray-500">
                          / {Math.max(
                            Number(s.quantity || 0) - Number(s.returned_quantity || 0),
                            0
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sticky bottom-2 sm:bottom-3 z-20 flex flex-col xl:flex-row justify-between xl:items-center gap-4 mt-4 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)] px-3 sm:px-5 py-3 sm:py-4 rounded-2xl border border-slate-200">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-1">
            Selected Return Quantity
          </div>

          <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
            {Object.values(selectedItems).reduce((a, b) => a + (b || 0), 0)}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-sm sm:text-base font-medium transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 text-white text-sm sm:text-base font-semibold shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Submit Return"}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap mt-3 px-1">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium disabled:opacity-40"
        >
          Previous
        </button>

        <div className="text-sm text-slate-600 font-medium">
          Page {pagination.page || page} of {pagination.totalPages || 1}
        </div>

        <button
          disabled={!pagination.hasMore}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium disabled:opacity-40"
        >
          Next
        </button>

        <div className="text-xs text-slate-400 ml-2">
          {pagination.total || 0} total books
        </div>
        </div>
    </div>
  </div>
  
  );
}