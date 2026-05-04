import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard.jsx";
import POS from "./pages/POS.jsx";
import Sales from "./pages/Sales.jsx";
import Customers from "./pages/Customers.jsx";
import CustomerLedger from "./components/LedgerModal.jsx";
import InvoicePage from "./components/Invoice.jsx"; // or wherever
import Books from "./pages/Books.jsx";
import Suppliers from "./pages/Suppliers.jsx";
import SupplierLedgerPage from "./components/SupplierLedgerModal.jsx";
import CustomerReturn from "./components/CustomerReturn.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import DetailsPage from "./components/reports/DetailsPage.jsx";
import Sidebar from "./components/Sidebar.jsx";
function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <Sidebar />
        <div className="ml-44 w-full min-h-screen bg-gray-50">
          <Routes>
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerLedger />} /> {/* ✅ */}
            <Route path="/customer-return/:id" element={<CustomerReturn />} />
            <Route path="/sales/:id" element={<InvoicePage />} />
            <Route path="/books" element={<Books />} />
            <Route path="/add-book" element={<Books />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/suppliers/:id/ledger" element={<SupplierLedgerPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/details" element={<DetailsPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;