import { useState, useEffect, useRef } from "react";

import { useNavigate } from "react-router-dom";
import SuppliersHeader from "../components/SuppliersHeader";
import SuppliersStats from "../components/SuppliersStats";
import SuppliersTable from "../components/SuppliersTable";
import SupplierModal from "../components/SupplierModal";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
const API = import.meta.env.VITE_API_URL;

const authHeaders = (json = false) => ({
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});
const SupplierPaymentModal = ({ suppliers, onClose, onSave }) => {
    if (!onClose) return null; // safety guard
    const [form, setForm] = useState({
        supplier_id: "",
        amount: "",
        note: "",
    });
    const [search, setSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [results, setResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.supplier_id || !form.amount) return alert("Required fields missing");
        onSave(form);
    };

    // --- Selected supplier lookup ---
    const selectedSupplier = suppliers.find(
        (s) => String(s.id) === String(form.supplier_id)
    );

    useEffect(() => {
        if (!search.trim()) {
            setResults([]);
            return;
        }

        const fetchSearch = async () => {
            try {
                setLoadingSearch(true);

                const res = await fetch(
                    `${API}/api/suppliers?search=${search}&limit=10`,
                    {
                        headers: authHeaders(),
                    }
                );
                const data = await res.json();

                setResults(data.data || data);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setLoadingSearch(false);
            }
        };

        const delay = setTimeout(fetchSearch, 300);
        return () => clearTimeout(delay);
    }, [search]);

    useEffect(() => {
        const handleClickOutside = () => setShowDropdown(false);
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, []);

    return (
        <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3 sm:p-4 overflow-auto"            style={{ pointerEvents: "auto" }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold">Supplier Payment</h2>

                <form onSubmit={handleSubmit} className="space-y-3">

                    <div className="relative">
                        <input
                            placeholder="Search supplier..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />

                        {showDropdown && search && (
                            <div className="absolute z-50 w-full bg-white border rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                                {loadingSearch && (
                                    <div className="px-3 py-2 text-gray-400 text-sm">
                                        Searching...
                                    </div>
                                )}
                                {results.map((s) => (
                                    <div
                                        key={s.id}
                                        onClick={() => {
                                            setForm((prev) => ({
                                                ...prev,
                                                supplier_id: s.id,
                                            }));
                                            setSearch(s.name);
                                            setShowDropdown(false);
                                        }}
                                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                                    >
                                        {s.name}
                                    </div>
                                ))}

                                {!loadingSearch && results.length === 0 && (
                                    <div className="px-3 py-2 text-gray-400 text-sm">
                                        No supplier found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Selected supplier + balance */}
                    {selectedSupplier && (
                        <div className="text-sm bg-gray-50 p-2 rounded-lg border">
                            <div className="font-medium">{selectedSupplier.name}</div>
                            <div>
                                Remaining:{" "}
                                <span className="text-red-600 font-semibold">
                                    {Number(selectedSupplier.balance || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}

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
    const [filter, setFilter] = useState("active");
    const [showModal, setShowModal] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit, setLimit] = useState(10);
    const [statsData, setStatsData] = useState(null);
    const [exportLoading, setExportLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [allSuppliers, setAllSuppliers] = useState([]);
    const fetchAllSuppliers = async () => {
        try {
            const res = await fetch(`${API}/api/suppliers?limit=10000`, {
                headers: authHeaders(),
            });
            const data = await res.json();
            setAllSuppliers(data.data || data);
        } catch (err) {
            console.error("Fetch all suppliers error:", err);
        }
    };
    const tableWrapperRef = useRef(null);
    const headerRef = useRef(null);
    useEffect(() => {
        const calculateLimit = () => {
            if (!tableWrapperRef.current) return;

            const wrapperHeight = tableWrapperRef.current.clientHeight;

            // approximate heights (adjust if needed)
            const headerHeight = headerRef.current?.offsetHeight || 180; // header + stats + filters
            const paginationHeight = 80;
            const rowHeight = 60;

            const available = wrapperHeight - headerHeight - paginationHeight;
            const rows = Math.floor(available / rowHeight);

            setLimit(Math.max(5, rows));
        };

        calculateLimit();
        window.addEventListener("resize", calculateLimit);

        return () => window.removeEventListener("resize", calculateLimit);
    }, []);

    const navigate = useNavigate();

    const fetchSuppliers = async () => {
        try {
            setLoading(true);

            const res = await fetch(
                `${API}/api/suppliers?search=${search}&filter=${filter}&limit=${limit}&offset=${(page - 1) * limit}&_=${Date.now()}`,
                {
                    cache: "no-store",
                    headers: authHeaders(),
                }
            );

            const data = await res.json();
            let rows = data.data || data;
            // 🔥 fallback filter (frontend safety)
            if (filter === "active") {
                rows = rows.filter(s => Number(s.is_active) === 1);
            } else if (filter === "inactive") {
                rows = rows.filter(s => Number(s.is_active) === 0);
            }
            console.log("RAW API RESPONSE:", data);
            console.log("FETCHED SUPPLIERS:", rows);
            console.log("FIRST ROW ACTIVE:", rows[0]?.is_active);

            setSuppliers([...rows]);
            setTotal(filter === "all" ? (data.total || rows.length) : rows.length);
        } catch (err) {
            console.error("Fetch suppliers error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API}/api/suppliers/stats`, {
                headers: authHeaders(),
            });
            const data = await res.json();
            setStatsData(data);
        } catch (err) {
            console.error("Fetch stats error:", err);
        }
    };

    useEffect(() => {
        fetchSuppliers();
        fetchStats();
    }, [search, filter, page, limit]);

    useEffect(() => {
        setPage(1);
    }, [search, filter]);

    useEffect(() => {
        setPage(1);
    }, [limit]);

    const handleAddSupplier = async (formData) => {
        try {
            const res = await fetch(`${API}/api/suppliers`, {
                method: "POST",
                headers: authHeaders(true),
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
            window.open(
                `${url}&token=${localStorage.getItem("token")}`,
                "_blank"
            );
        } catch (err) {
            console.error("Export error:", err);
        } finally {
            setExportLoading(false);
        }
    };

    const handlePayment = async () => {
        await fetchAllSuppliers();
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
                headers: authHeaders(true),
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
            const res = await fetch(`${API}/api/suppliers/${id}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
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
        console.log("FROM PARENT:", supplier.id, "NEW STATUS:", supplier.is_active);

        try {
            const res = await fetch(`${API}/api/suppliers/${supplier.id}/status`, {
                method: "PATCH",
                headers: authHeaders(),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Toggle failed");
                return;
            }

            // 🔥 Optimistic UI update (instant change)
            setSuppliers(prev =>
                prev.map(s =>
                    s.id === supplier.id ? { ...s, is_active: supplier.is_active } : s
                )
            );

            // 🔥 Ensure backend sync
            await fetchSuppliers();

        } catch (err) {
            console.error("TOGGLE ERROR:", err);
        }
    };

    const [editSupplier, setEditSupplier] = useState(null);

    const handleEdit = (supplier) => {
        console.log("EDIT CLICKED:", supplier);
        setEditSupplier(supplier);
        setShowModal(true);
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="flex min-h-screen bg-gray-50 overflow-hidden">
            {/* SIDEBAR */}
            <Sidebar />

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 w-full max-w-[1800px] mx-auto">
                {/* PAGE CONTENT */}
                
                <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto min-w-0" ref={tableWrapperRef}>
                    <div className="w-full space-y-6 min-w-0" ref={headerRef}>
                        <SuppliersHeader
                            search={search}
                            setSearch={setSearch}
                            filter={filter}
                            setFilter={setFilter}
                            onExport={handleExport}
                            exportLoading={exportLoading}
                            onPayment={handlePayment}
                            onAdd={() => {
                                setEditSupplier(null);
                                setShowModal(true);
                            }}
                        />

                        <SuppliersStats suppliers={suppliers} statsData={statsData} />

                        <div className="overflow-x-auto rounded-xl min-w-0">
                            <SuppliersTable
                                suppliers={suppliers}
                                loading={loading}
                                onLedger={handleOpenLedger}
                                onDelete={handleDelete}
                                onToggleStatus={handleToggleStatus}
                                onEdit={handleEdit}
                            />
                        </div>
                        {/* PREMIUM PAGINATION */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6">
                                <span className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
    Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
</span>

                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    {/* PREV */}
                                    <button
                                        type="button"
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
                                                    type="button"
                                                    onClick={() => setPage(p)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm ${page === p
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
                                        type="button"
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
                {showModal ? (
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
                                    headers: authHeaders(true),
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
                ) : null}

                {showPaymentModal && (
                    <SupplierPaymentModal
                        suppliers={allSuppliers}
                        onClose={() => setShowPaymentModal(false)}
                        onSave={handleSavePayment}
                    />
                )}


            </div>

        </div>
    );
}