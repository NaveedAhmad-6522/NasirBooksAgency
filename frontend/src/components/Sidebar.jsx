import { Link, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  Users,
  BarChart3,
  Package,
  Settings,
  FileText,
  Wallet,
  Truck
} from "lucide-react";

function Sidebar() {
  return (
    <div className="fixed top-0 left-0 h-screen w-44 bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white flex flex-col z-50 overflow-y-auto">

      {/* LOGO */}
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            📚
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">
              NASIR
            </div>
            <div className="text-xs text-gray-400">
              Book Agency
            </div>
          </div>
        </div>
      </div>

      {/* MENU */}
      <div className="flex-1 p-4 space-y-2">
        <SidebarItem icon={<Home size={18} />} label="Dashboard" to="/Dashboard" />

        <SidebarItem icon={<Wallet size={18} />} label="Billing (POS)" to="/pos" />

        <SidebarItem icon={<BookOpen size={18} />} label="Books" to="/books" />
        <SidebarItem icon={<Users size={18} />} label="Customers" to="/customers" />
        <SidebarItem icon={<Truck size={18} />} label="Suppliers" to="/suppliers" />
        <SidebarItem icon={<FileText size={18} />} label="Orders" to="/sales" />
        <SidebarItem icon={<BarChart3 size={18} />} label="Reports" to="/reports" />
      </div>

      {/* SUMMARY CARD */}
      <div className="p-4">
        <div className="bg-[#1e293b] rounded-xl p-4 text-sm shadow">

          <div className="mb-3 text-gray-400 text-xs">
            Today's Summary
          </div>

          <div className="flex justify-between mb-2">
            <span className="text-gray-300">Total Sales</span>
            <span className="font-semibold">Rs. 24,500</span>
          </div>

          <div className="flex justify-between mb-2">
            <span className="text-gray-300">Total Orders</span>
            <span className="font-semibold">32</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-300">Profit</span>
            <span className="font-semibold text-green-400">
              Rs. 8,750
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}

/* 🔹 Sidebar Item Component */
function SidebarItem({ icon, label, to }) {
  const location = useLocation();

  const isActive = location.pathname === to || location.pathname.startsWith(to + "/");
  return (
    <Link to={to}>
      <div
        className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition
            ${isActive
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow"
            : "hover:bg-gray-700"
          }`}
      >
        <div className="text-gray-300">{icon}</div>
        <span className="text-sm">{label}</span>
      </div>
    </Link>
  );
}

export default Sidebar;