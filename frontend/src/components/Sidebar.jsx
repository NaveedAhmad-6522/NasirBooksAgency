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