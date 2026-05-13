import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import PaymentModal from "../components/PaymentModal";
import CustomersHeader from "../components/CustomersHeader";
import CustomersStats from "../components/CustomersStats";
import CustomersTable from "../components/CustomersTable";
import CustomerModal from "../components/CustomerModal";
import SaleDetailsModal from "../components/SaleDetailsModal";
function Customers() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    city: "",
    balance: ""
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showLedger, setShowLedger] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [filter, setFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [showPayment, setShowPayment] = useState(false);

  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const [loading, setLoading] = useState(false);
  const API = import.meta.env.VITE_API_URL;

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const limit = 6;

  const navigate = useNavigate();

  /* =========================
     🔥 DEBOUNCE SEARCH
  ========================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /* =========================
     🔥 LOAD CUSTOMERS
  ========================= */
  const loadCustomers = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API}/api/customers?q=${debouncedSearch}&page=${page}&limit=${limit}&filter=${filter}`,
        {
          headers: authHeaders(),
        }
      );

      const data = await res.json();

      setCustomers(Array.isArray(data) ? data : data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Customers Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     🔥 LOAD STATS
  ========================= */
  const loadStats = async () => {
    try {
      const res = await fetch(`${API}/api/customers/stats`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Stats Fetch Error:", err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [debouncedSearch, page, filter]);

  useEffect(() => {
    loadStats();
  }, []);

  /* =========================
     🔥 FRONTEND FILTER (SAFE)
  ========================= */


  /* =========================
     ➕ ADD CUSTOMER
  ========================= */
  const handleAddCustomer = async () => {
    try {
      await fetch(`${API}/api/customers`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...newCustomer,
          balance: Number(newCustomer.balance) || 0
        }),
      });

      setShowCustomerModal(false);

      setNewCustomer({
        name: "",
        phone: "",
        city: "",
        balance: ""
      });

      loadCustomers();
      loadStats();

    } catch (err) {
      console.error(err);
      alert("Failed to add customer");
    }
  };

   /* =========================
     ledger
  ========================= */
  const openLedger = (customer) => {
    window.open(`/customers/${customer.id}`, "_blank");
  };
  const handleViewSale = async (saleId) => {
    try {
      const res = await fetch(`${API}/api/sales/${saleId}`, {
        headers: authHeaders(),
      });
      const data = await res.json();

      setSelectedSale(data);
      setShowSaleModal(true);
    } catch (err) {
      console.error("Sale fetch error:", err);
    }
  };
  /* =========================
     💰 PAYMENT
  ========================= */
  const handleSavePayment = async ({ customer_id, amount }) => {
    try {
      await fetch(`${API}/api/customers/payment`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ customer_id, amount }),
      });

      setShowPayment(false);

      loadCustomers();
      loadStats();

    } catch (err) {
      console.error(err);
      alert("Payment failed");
    }
  };

  /* =========================
     🔥 PAGINATION
  ========================= */
  const renderPages = () => {
    const pages = [];

    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`px-3 py-1 rounded-md text-sm ${
            page === i
              ? "bg-indigo-600 text-white"
              : "border hover:bg-gray-100"
          }`}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  const handleExport = () => {
    const url = `${API}/api/customers/export?search=${search}&filter=${filter}`;
    window.open(
      `${url}&token=${localStorage.getItem("token")}`,
      "_blank"
    );
  };

  return (
    <div className="h-screen flex bg-gray-100 text-sm overflow-hidden">

      <Sidebar />

      <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden w-full max-w-[1800px] mx-auto">

        <div className="flex-1 space-y-4 overflow-auto min-w-0">

          <h1 className="text-lg sm:text-xl font-bold">Customers</h1>

          <CustomersHeader
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={(value) => {
              setFilter(value);
              setPage(1);
            }}
            setShowPayment={setShowPayment}
            setShowCustomerModal={setShowCustomerModal}
            onExport={handleExport}
          />

          {stats && <CustomersStats stats={stats} />}

          {/* ✅ USE FILTERED */}
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <CustomersTable 
                customers={customers} 
                onViewLedger={openLedger}
              />
            </div>
          )}
          <PaymentModal
            show={showPayment}
            onClose={() => setShowPayment(false)}
            customers={customers}
            onSave={handleSavePayment}
          />

          <CustomerModal
            show={showCustomerModal}
            onClose={() => setShowCustomerModal(false)}
            onSave={handleAddCustomer}
            newCustomer={newCustomer}
            setNewCustomer={setNewCustomer}
          />
<SaleDetailsModal
  show={showSaleModal}
  data={selectedSale}
  onClose={() => setShowSaleModal(false)}
/>
        </div>

        {/* PAGINATION FIX */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 px-2">

          <span className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
          Showing {(page - 1) * limit + 1} to{" "}
{Math.min(page * limit, total)} of {total} customers
           
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2">

            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 border rounded"
            >
              {"<"}
            </button>

            {renderPages()}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 border rounded"
            >
              {">"}
            </button>

          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default Customers;