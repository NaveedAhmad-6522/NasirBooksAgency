import { useState, useEffect } from "react";
const API = import.meta.env.VITE_API_URL || "http://localhost:5001";
import { useNavigate } from "react-router-dom";
import SuppliersHeader from "../components/SuppliersHeader";
import SuppliersStats from "../components/SuppliersStats";
import SuppliersTable from "../components/SuppliersTable";
import SupplierModal from "../components/SupplierModal";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

const SupplierPaymentModal = ({ suppliers, onClose, onSave }) => {
  const [form, setForm] = useState({
    supplier_id: "",
    amount: "",
    note: "",
  });
  const [search, setSearch] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.supplier_id || !form.amount) return alert("Required fields missing");
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">Supplier Payment</h2>

        <form onSubmit={handleSubmit} className="space-y-3">

          <input
            placeholder="Search supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
          />

          <select
            name="supplier_id"
            value={form.supplier_id}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg"
          >
            <option value="">Select Supplier</option>
            {suppliers
              .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
              .map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <input
            name="amount"
            placeholder="Amount"
            value={form.amount}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg"
          />

          <input
            name="note"
            placeholder="Note (optional)"
            value={form.note}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg"
          />

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Pay</button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 5;
  const [statsData, setStatsData] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const navigate = useNavigate();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API}/api/suppliers?search=${search}&filter=${filter}&limit=${limit}&offset=${(page - 1) * limit}`
      );

      const data = await res.json();
      const rows = data.data || data;

      setSuppliers(rows);
      setTotal(data.total || rows.length);
    } catch (err) {
      console.error("Fetch suppliers error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/api/suppliers/stats`);
      const data = await res.json();
      setStatsData(data);
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchStats();
  }, [search, filter, page]);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const handleAddSupplier = async (formData) => {
    try {
      const res = await fetch(`${API}/api/suppliers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to add supplier");
      }

      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      console.error("Add supplier error:", err);
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const url = `${API}/api/suppliers/export?search=${search}&filter=${filter}`;
      window.open(url, "_blank");
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExportLoading(false);
    }
  };

  const handlePayment = () => {
    setShowPaymentModal(true);
  };

  const handleOpenLedger = (supplierId) => {
    window.open(`/suppliers/${supplierId}/ledger`, "_blank");
  };

  const handleSavePayment = async (data) => {
    try {
      // basic validation
      if (!data.supplier_id || !data.amount) {
        alert("Supplier and amount are required");
        return;
      }

      const payload = {
        supplier_id: Number(data.supplier_id),
        amount: Number(data.amount),
        note: data.note || "",
      };

      const res = await fetch(`${API}/api/suppliers/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Payment failed");
      }

      // refresh UI data
      await fetchSuppliers();
      await fetchStats();

      setShowPaymentModal(false);

      alert("Payment added successfully");
    } catch (err) {
      console.error("Payment error:", err);
      alert("Failed to save payment");
    }
  };

  // --- HANDLERS FOR EDIT, DELETE, TOGGLE STATUS ---
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/api/suppliers/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      fetchSuppliers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (supplier) => {
    try {
      await fetch(`${API}/api/suppliers/${supplier.id}/status`, {
        method: "PATCH",
      });

      fetchSuppliers();
    } catch (err) {
      console.error(err);
    }
  };

  const [editSupplier, setEditSupplier] = useState(null);

  const handleEdit = (supplier) => {
    setEditSupplier(supplier);
    setShowModal(true);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">

        {/* PAGE CONTENT */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">

            <SuppliersHeader
              search={search}
              setSearch={setSearch}
              filter={filter}
              setFilter={setFilter}
              onExport={handleExport}
              exportLoading={exportLoading}
              onPayment={handlePayment}
              onAdd={() => setShowModal(true)}
            />

            <SuppliersStats suppliers={suppliers} statsData={statsData} />

            <SuppliersTable
              suppliers={suppliers}
              loading={loading}
              onLedger={handleOpenLedger}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onEdit={handleEdit}
            />

            {/* PREMIUM PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">

                <span className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
                </span>

                <div className="flex items-center gap-2">

                  {/* PREV */}
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-40"
                  >
                    ←
                  </button>

                  {/* PAGE NUMBERS */}
                  {[...Array(totalPages)].map((_, i) => {
                    const p = i + 1;

                    // limit visible pages
                    if (
                      p === 1 ||
                      p === totalPages ||
                      (p >= page - 2 && p <= page + 2)
                    ) {
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            page === p
                              ? "bg-blue-600 text-white"
                              : "border hover:bg-gray-100"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }

                    // dots
                    if (p === page - 3 || p === page + 3) {
                      return <span key={p}>...</span>;
                    }

                    return null;
                  })}

                  {/* NEXT */}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-40"
                  >
                    →
                  </button>

                </div>
              </div>
            )}

          </div>
        </div>

        {/* FOOTER */}
        <Footer />

        {/* ADD/EDIT SUPPLIER MODAL */}
        {showModal && (
          <SupplierModal
            key={editSupplier?.id || "new"}
            supplier={editSupplier}
            onClose={() => {
              setShowModal(false);
              setEditSupplier(null);
            }}
            onSave={async (formData) => {
              if (editSupplier) {
                const res = await fetch(`${API}/api/suppliers/${editSupplier.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(formData),
                });

                if (!res.ok) {
                  const data = await res.json();
                  alert(data.error || "Update failed");
                  return;
                }
              } else {
                await handleAddSupplier(formData);
              }

              setShowModal(false);
              setEditSupplier(null);
              fetchSuppliers();
            }}
          />
        )}

        {showPaymentModal && (
          <SupplierPaymentModal
            suppliers={suppliers}
            onClose={() => setShowPaymentModal(false)}
            onSave={handleSavePayment}
          />
        )}


      </div>

    </div>
  );
}