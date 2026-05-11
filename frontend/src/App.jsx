import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

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
import Settings from "./pages/setting.jsx";
import DetailsPage from "./components/reports/DetailsPage.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./pages/login.jsx";
import { Navigate } from "react-router-dom";

const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function Layout() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="flex">
      {!isLoginPage && <Sidebar />}
      <div className={`${!isLoginPage ? "ml-44" : ""} w-full min-h-screen bg-gray-50`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/customers/:id" element={<ProtectedRoute><CustomerLedger /></ProtectedRoute>} />
          <Route path="/customer-return/:id" element={<ProtectedRoute><CustomerReturn /></ProtectedRoute>} />
          <Route path="/sales/:id" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />
          <Route path="/books" element={<ProtectedRoute><Books /></ProtectedRoute>} />
          <Route path="/add-book" element={<ProtectedRoute><Books /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
          <Route path="/suppliers/:id/ledger" element={<ProtectedRoute><SupplierLedgerPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/reports/details" element={<ProtectedRoute><DetailsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={isAuthenticated() ? "/Dashboard" : "/login"} />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;