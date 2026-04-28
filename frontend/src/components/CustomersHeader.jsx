import { Search, Filter } from "lucide-react";

function CustomersHeader({
  search,
  setSearch,
  filter,
  setFilter,
  setShowPayment,
  setShowCustomerModal,  // ✅ USE THIS
  onExport               // ✅ NEW PROP
}) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">

      {/* 🔍 SEARCH */}
      <div className="flex items-center gap-3 bg-gray-100 px-4 py-3 rounded-xl w-full max-w-md">
        <Search size={18} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search customer by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent outline-none text-sm w-full"
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
      {/* EXPORT */}
      <button
        onClick={() => {
          onExport();
        }}
        className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition"
      >
        Export Excel
      </button>
        {/* ✅ ADD CUSTOMER */}
        <button
          onClick={() => setShowCustomerModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          + Add Customer
        </button>



        {/* FILTER */}
        <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl">
          <Filter size={16} className="text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-transparent outline-none text-sm"
          >
            <option value="all">All</option>
            <option value="due">Due</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {/* ADD PAYMENT */}
        <button
          onClick={() => setShowPayment(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition"
        >
          + Add Payment
        </button>

      </div>
    </div>
  );
}

export default CustomersHeader;