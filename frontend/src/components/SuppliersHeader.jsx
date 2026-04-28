import { Search, Download, CreditCard } from "lucide-react";

export default function SuppliersHeader({
  search,
  setSearch,
  filter,
  setFilter,
  onExport,
  onAdd,
  onPayment,
  exportLoading = false,
}) {
  return (
    <div className="space-y-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-100">

      {/* 🔷 TITLE + BREADCRUMB */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Suppliers</h1>
        <p className="text-gray-400 text-sm">
          Dashboard <span className="mx-1">›</span> Suppliers
        </p>
      </div>

      {/* 🔍 CONTROLS BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">

        {/* LEFT */}
        <div className="flex items-center gap-3 w-full md:w-auto">

          {/* SEARCH */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white shadow-sm w-full md:w-80 focus-within:ring-2 focus-within:ring-blue-500 transition">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm w-full"
            />
          </div>

          {/* FILTER */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white shadow-sm text-sm focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="all">All Suppliers</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          {/* EXPORT */}
          <button
            onClick={onExport}
            disabled={exportLoading}
            title="Download suppliers as Excel"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} className="text-gray-600" />
            {exportLoading ? "Exporting..." : "Export Excel"}
          </button>

          {/* PAYMENT */}
          <button
            onClick={onPayment}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md hover:shadow-lg hover:opacity-90 text-sm transition"
          >
            <CreditCard size={16} />
            Payment
          </button>

          {/* ADD SUPPLIER */}
          <button
            onClick={onAdd}
            className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-5 py-2 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 text-sm transition"
          >
            + Add Supplier
          </button>

        </div>

      </div>
    </div>
  );
}