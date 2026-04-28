import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

function SalesTable({ sales, onView }) {
  const [page, setPage] = useState(1);
  const perPage = 5;

  const totalPages = Math.ceil(sales.length / perPage);

  const startIndex = (page - 1) * perPage;
  const currentData = sales.slice(startIndex, startIndex + perPage);

  return (
    <div className="bg-white rounded-2xl shadow-sm mt-4">

      {/* TABLE */}
      <div className="overflow-hidden">

        {/* HEADER */}
        <div className="grid grid-cols-7 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 border-b">
          <div>ID</div>
          <div>Customer</div>
          <div>Total</div>
          <div>Paid</div>
          <div>Remaining</div>
          <div>Date</div>
          <div className="text-right">Action</div>
        </div>

        {/* DATA */}
        {currentData.map((s) => {
          const remaining = Number(s.remaining ?? 0);

          return (
            <div
              key={s.id}
              className="grid grid-cols-7 items-center px-6 py-4 border-b text-sm hover:bg-gray-50 transition"
            >
              <div className="font-medium text-gray-700">#{s.id}</div>

              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                  {(s.customer_name || "W")[0]}
                </div>
                <span className="font-medium">
                  {s.customer_name || "Walk-in"}
                </span>
              </div>

              <div className="font-semibold text-gray-700">
                Rs {s.total_amount}
              </div>

              <div className="text-green-600 font-semibold">
                Rs {s.paid_amount}
              </div>

              <div
                className={`font-semibold ${
                  remaining > 0 ? "text-red-500" : "text-gray-400"
                }`}
              >
                {remaining > 0 ? `Rs ${remaining}` : "-"}
              </div>

              <div className="text-gray-500 text-xs">
                {new Date(s.created_at).toLocaleString()}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => onView(s)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-600 hover:text-white transition"
                >
                  <Eye size={14} />
                  View
                </button>
              </div>
            </div>
          );
        })}

        {sales.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            No sales found
          </div>
        )}
      </div>

      {/* 🔥 PAGINATION FOOTER */}
      {sales.length > 0 && (
        <div className="flex justify-between items-center px-6 py-3 text-xs text-gray-500">

          {/* LEFT */}
          <div>
            Showing {startIndex + 1}–
            {Math.min(startIndex + perPage, sales.length)} of {sales.length}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2">

            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded border hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>

            <span className="px-3 py-1 bg-blue-600 text-white rounded text-xs">
              {page}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 rounded border hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

export default SalesTable;