import { useState, useEffect } from "react";
import { Search, User } from "lucide-react";
const API_BASE = import.meta.env.VITE_API_URL;

const authHeaders = (json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});
function PaymentModal({ show, onClose, onSave }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const fetchCustomers = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/customers?q=${query}`,
          {
            headers: authHeaders(),
          }
        );
        const data = await res.json();
        setResults(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error("Search error:", err);
      }
    };

    const delay = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(delay);
  }, [query]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

      <div className="bg-white w-[420px] rounded-2xl shadow-xl p-6">

        {/* HEADER */}
        <h2 className="text-lg font-semibold mb-4">
          Add Payment
        </h2>

        {/* 🔍 SEARCH */}
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 mb-3">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search customer..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="outline-none w-full text-sm"
          />
        </div>

        {/* 🔥 RESULTS */}
        {results.length > 0 && (
          <div className="max-h-44 overflow-y-auto mb-3 space-y-1">

            {results.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedCustomer(c);
                  setQuery("");
                  setResults([]);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition"
              >
                <div className="flex items-center gap-2">

                  {/* AVATAR */}
                  <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs">
                    {c.name?.[0]?.toUpperCase()}
                  </div>

                  {/* NAME + CITY */}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {c.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {c.city || c.phone || "No info"}
                    </span>
                  </div>

                </div>

                {/* BALANCE */}
                <div className="text-xs text-gray-500">
                  Rs {Number(c.balance).toLocaleString()}
                </div>
              </div>
            ))}

          </div>
        )}

        {/* SELECTED CUSTOMER */}
        {selectedCustomer && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg mb-3">

            <div className="flex items-center gap-2">
              <User size={14} className="text-blue-600" />

              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {selectedCustomer.name}
                </span>
                <span className="text-xs text-gray-400">
                  {selectedCustomer.city || selectedCustomer.phone || "No info"}
                </span>
              </div>
            </div>

            <span className="text-xs text-gray-500">
              Rs {Number(selectedCustomer.balance).toLocaleString()}
            </span>
          </div>
        )}

        {/* 💰 AMOUNT */}
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* ACTIONS */}
        <div className="flex justify-end gap-2">

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (!selectedCustomer) return alert("Select customer");
              if (!amount) return alert("Enter amount");

              onSave({
                customer_id: selectedCustomer.id,
                amount: Number(amount),
              });

              // RESET
              setQuery("");
              setAmount("");
              setSelectedCustomer(null);
            }}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Save Payment
          </button>

        </div>

      </div>
    </div>
  );
}

export default PaymentModal;