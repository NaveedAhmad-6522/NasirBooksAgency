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
  const [showCityReport, setShowCityReport] = useState(false);
  const [cityReportCity, setCityReportCity] = useState("");

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
      const normalizedPhone = (newCustomer.phone || "").trim();

      const existingCustomer = customers.find(
        (c) => (c.phone || "").trim() === normalizedPhone
      );

      if (normalizedPhone && existingCustomer) {
        alert(
          `Customer already exists: ${existingCustomer.name} (${existingCustomer.phone})`
        );
        return;
      }
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

  const handleExport = async () => {
    try {
      const response = await fetch(
        `${API}/api/customers/export?search=${search}&filter=${filter}`,
        {
          headers: authHeaders(),
        }
      );
  
      if (!response.ok) {
        throw new Error("Export failed");
      }
  
      const blob = await response.blob();
  
      const url = window.URL.createObjectURL(blob);
  
      const link = document.createElement("a");
      link.href = url;
      link.download = "customers.xlsx";
  
      document.body.appendChild(link);
      link.click();
      link.remove();
  
      window.URL.revokeObjectURL(url);
  
    } catch (err) {
      console.error(err);
      alert("Export failed");
    }
  };

  const handleCityReport = async () => {
    try {
      if (!cityReportCity.trim()) {
        alert("Please enter a city");
        return;
      }

      const res = await fetch(
        `${API}/api/customers/city-summary?city=${encodeURIComponent(cityReportCity)}`,
        {
          headers: authHeaders(),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to load city report");
      }

      const data = await res.json();

      const printWindow = window.open("", "_blank");

      printWindow.document.write(`
        <html>
        <head>
          <title>${data.city} Customer Summary</title>
          <style>
  @page {
    margin: 6mm;
    size: A4;
  }

  body {
    font-family: Arial, sans-serif;
    margin: 0;
    background: white;
    color: #111827;
  }

  .invoice {
    width: 100%;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 8px;
  }

  .company-title {
    font-size: 22px;
    font-weight: bold;
    margin: 0;
  }

  .invoice-label {
    color: #6b7280;
    font-size: 12px;
    margin-top: 4px;
  }

  .contact {
    font-size: 10px;
    line-height: 1.4;
    margin-top: 4px;
  }

  .right {
    text-align: right;
  }

  .right .report-title {
    font-size: 18px;
    font-weight: bold;
  }

  .summary {
    margin-top: 8px;
    font-size: 11px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    font-size: 10px;
  }

  thead {
    background: #f9fafb;
  }

  th, td {
    border: 1px solid #d1d5db;
    padding: 6px;
  }

  th {
    text-transform: uppercase;
    font-size: 9px;
  }

  .balance {
    text-align: right;
    font-weight: 600;
  }

  .receive {
    width: 120px;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #d1d5db;
    margin-top: 12px;
    padding-top: 6px;
    font-size: 9px;
    color: #6b7280;
  }
</style>
        </head>
        <body>
          <div class="invoice">
  <div class="header">
    <div>
      <div class="company-title">NASIR BOOK AGENCY</div>
      <div class="invoice-label">City Customer Report</div>

      <div class="contact">
        Dhakki Nalbandi, Qissa Khwani Bazar Peshawar<br>
        📞 091-2572277<br>
        📞 0302-8884377<br>
        📞 0311-3888849
      </div>
    </div>

    <div class="right">
      <div class="report-title">${data.city}</div>
      <div>${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="summary">
    <strong>Total Customers:</strong> ${data.totalCustomers}<br>
    <strong>Total Outstanding:</strong> Rs ${Number(data.totalOutstanding || 0).toLocaleString()}
  </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>City</th>
                <th>Balance</th>
                <th>Receive</th>
              </tr>
            </thead>
            <tbody>
              ${data.customers.map((c, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${c.name || ''}</td>
                  <td>${c.phone || '-'}</td>
                  <td>${c.city || '-'}</td>
                  <td class="balance">Rs ${Number(c.balance || 0).toLocaleString()}</td>
                  <td class="receive"></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
  <div>Generated from Nasir Book Agency POS</div>
  <div>Nasir Book Agency</div>
</div>
</div>
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.print();

      setShowCityReport(false);
      setCityReportCity("");
    } catch (err) {
      console.error(err);
      alert("Failed to generate city report");
    }
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
            setShowCityReport={setShowCityReport}
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
{showCityReport && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">
          City Summary Report
        </h2>

        <button
          onClick={() => setShowCityReport(false)}
          className="text-gray-400 hover:text-red-500 text-xl"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Enter City
          </label>

          <input
            type="text"
            value={cityReportCity}
            onChange={(e) => setCityReportCity(e.target.value)}
            placeholder="e.g. Charsadda"
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <button
          onClick={handleCityReport}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold shadow"
        >
          Generate PDF
        </button>
      </div>
    </div>
  </div>
)}
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