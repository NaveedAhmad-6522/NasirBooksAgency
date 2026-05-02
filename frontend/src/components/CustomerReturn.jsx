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

  // Fetch customer sales with remaining quantities (to allow return)
  useEffect(() => {
    fetchSales();
    fetchCustomer();
  }, [id]);
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
      const res = await fetch(
        `http://localhost:5001/api/customers/${id}/sales`
      );
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.data || [];

      // ⚠️ Do NOT group here — return requires exact sale_item_id
      // ✅ Keep original sale_items (important for return correctness)
      setSales(list.slice(0, 100));

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

      alert("Return successful");
      navigate(-1);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const filteredSales = sales.filter((s) =>
    s.book_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 rounded-xl shadow">
        <h2 className="text-2xl font-bold">Customer Return</h2>
        <p className="text-sm opacity-90">
          Process returns and update inventory seamlessly
        </p>

        {customer ? (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Customer:</span> {customer.name}
            </div>
            <div>
              <span className="font-semibold">Phone:</span> {customer.phone || "-"}
            </div>
            <div className="col-span-2">
              <span className="font-semibold">Address:</span> {customer.address || "-"}
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm opacity-80">
            Customer info not available
          </div>
        )}
      </div>

      {sales.length >= 100 && (
        <div className="mb-3 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
          Showing first 100 books only. Use search (coming next) for large data.
        </div>
      )}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-200">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Purchased Books</h3>

          <input
            type="text"
            placeholder="Search book..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b text-left text-gray-600 uppercase text-xs tracking-wide">
              <tr>
                <th className="p-3">Book</th>
                <th className="p-3 text-gray-400 text-sm">—</th>
                <th className="p-3">Date</th>
                <th className="p-3">Total Qty</th>
                <th className="p-3">Returned</th>
                <th className="p-3">Remaining</th>
                <th className="p-3">Price</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Return</th>
              </tr>
            </thead>

            <tbody>
              {initialLoading ? (
                <tr>
                  <td className="p-3" colSpan="9">Loading...</td>
                </tr>
              ) : !Array.isArray(filteredSales) || filteredSales.length === 0 ? (
                <tr>
                  <td className="p-3" colSpan="9">No sales found for this customer</td>
                </tr>
              ) : (
                filteredSales.map((s, index) => (
                  <tr
                    key={s.id}
                    className={`border-b transition ${
                      selectedItems[s.id]
                        ? "bg-orange-50 border-orange-200"
                        : index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    } hover:bg-orange-100/40`}
                  >
                    <td className="p-3">
                      <div className="font-semibold text-gray-800">{s.book_name}</div>
                      <div className="text-xs text-gray-500">
                        {s.publisher ? s.publisher : "—"}
                        {s.edition ? ` • ${s.edition}` : ""}
                      </div>
                    </td>
                    <td className="p-3 text-gray-400 text-sm">—</td>
                    <td className="p-3 text-gray-500">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                        {Number(s.quantity || 0)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-semibold">
                        {Number(s.returned_quantity || 0)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                        {Number((s.remaining_quantity ?? s.quantity) || 0)}
                      </span>
                    </td>
                    <td className="p-3 text-emerald-600 font-bold text-sm">
                      Rs {Number(s.price || 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {s.discount_percentage ? (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">
                          {s.discount_percentage}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={s.remaining_quantity ?? s.quantity}
                          className="border px-2 py-1 rounded w-20 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                          onChange={(e) =>
                            handleQtyChange(s.id, e.target.value, s.remaining_quantity ?? s.quantity)
                          }
                        />
                        <span className="text-xs text-gray-500">
                          / {s.remaining_quantity ?? s.quantity}
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

      <div className="flex justify-between items-center mt-6 bg-white shadow-md p-4 rounded-xl border">
        <div className="text-sm text-gray-600">
          Total Items: {Object.values(selectedItems).reduce((a, b) => a + (b || 0), 0)}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow"
          >
            {loading ? "Processing..." : "Submit Return"}
          </button>
        </div>
      </div>
    </div>
  );
}