import { Search, RefreshCw, Calendar, FileDown } from "lucide-react";

function SalesHeader({
  search,
  setSearch,
  filter,
  setFilter,
  onRefresh,
  onExport,
}) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between mb-5">

      {/* 🔍 SEARCH */}
      <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg w-1/3">
        <Search size={16} className="text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer or invoice..."
          className="bg-transparent outline-none text-sm w-full"
        />
      </div>

      {/* RIGHT CONTROLS */}
      <div className="flex items-center gap-4">

        {/* DATE FILTER (WIDER + LEFT SHIFT) */}
        <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg min-w-[170px] mr-2">
          <Calendar size={16} className="text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-transparent outline-none text-sm w-full"
          >
            <option value="today">Today</option>
            <option value="week">Last Week</option>
            <option value="month">This Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>

          </select>
        </div>

        {/* EXPORT */}
        <button
          onClick={() => {
            alert("Preparing Excel export...");
            onExport();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg 
  bg-gradient-to-r from-gray-100 to-gray-50 
  border border-gray-200 
  text-gray-700 text-sm font-medium
  hover:from-gray-200 hover:to-gray-100 
  hover:shadow-md active:scale-95 
  transition-all duration-200"
        >
          <FileDown size={16} className="text-gray-600" />
  Export Excel
        </button>

        {/* REFRESH */}
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition shadow-sm"
        >
          <RefreshCw size={16} />
          Refresh
        </button>

      </div>
    </div>
  );
}

export default SalesHeader;