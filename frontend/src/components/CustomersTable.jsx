import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";

/* 🔥 DATE FORMATTER */
function formatDate(date) {
  const d = new Date(date);
  const now = new Date();

  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;

  return d.toLocaleDateString();
}

function CustomersTable({ customers, onViewLedger }) {
  const navigate = useNavigate();

  /* 🔥 FILTER + SORT */
  const filteredCustomers = customers
    .filter((c) => c.name && c.name !== "Walk-in")
    .sort((a, b) => {
      const balanceA = Number(a.balance || 0);
      const balanceB = Number(b.balance || 0);

      if (balanceA > 0 && balanceB === 0) return -1;
      if (balanceA === 0 && balanceB > 0) return 1;

      return balanceB - balanceA;
    });

  return (
    <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-hidden">

      {/* 🔥 SCROLL FIX */}
      <div className="overflow-x-auto">

        <table className="w-full min-w-[1000px]">

          {/* HEADER */}
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr className="text-gray-500 text-[13px] font-medium">
              <th className="px-5 py-3 text-left">#</th>
              <th className="px-5 py-3 text-left">Customer</th>
              <th className="px-5 py-3 text-left">Phone</th>
              <th className="px-5 py-3 text-left">City</th>
              <th className="px-5 py-3 text-right">Remaining</th>
              <th className="px-5 py-3 text-right">Status</th>
              <th className="px-5 py-3 text-right">Last Activity</th>
              <th className="px-6 py-3 text-right pr-8">Action</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {filteredCustomers.map((c, index) => {
              const balance = Number(c.balance || 0);
              const isDue = balance > 0;

              return (
                <tr
                  key={c.id}
                  onClick={() => onViewLedger(c)}
                  className={`border-b border-gray-100 transition cursor-pointer group
                    ${isDue ? "bg-red-50/20 hover:bg-red-50/40" : "hover:bg-gray-50"}
                  `}
                >

                  {/* INDEX */}
                  <td className="px-5 py-3 text-gray-400 text-sm">
                    {index + 1}
                  </td>

                  {/* CUSTOMER */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">

                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                        {(c.name || "W")[0].toUpperCase()}
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition">
                          {c.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID #{c.id}
                        </div>
                      </div>

                    </div>
                  </td>

                  {/* PHONE */}
                  <td className="px-5 py-3 text-gray-600 text-sm">
                    {c.phone || "—"}
                  </td>
                  {/* CITY */}
                  <td className="px-5 py-3 text-gray-600 text-sm">
                    {c.city || "—"}
                  </td>

                  {/* REMAINING */}
                  <td className="px-5 py-3 text-right text-sm font-semibold">
                    <span className={isDue ? "text-red-500" : "text-green-600"}>
                      Rs {balance.toLocaleString()}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full
                        ${isDue
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                        }`}
                    >
                      {isDue ? "Due" : "Paid"}
                    </span>
                  </td>

                  {/* LAST ACTIVITY */}
                  <td className="px-5 py-3 text-right text-gray-500 text-sm">
                    {c.last_activity
                      ? formatDate(c.last_activity)
                      : "—"}
                  </td>

                  {/* ACTION */}
                  <td
                    className="px-4 pr-8 py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onViewLedger && onViewLedger(c)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 px-3 py-1.5 rounded-md transition"
                    >
                      <Eye size={14} />
                      Ledger
                    </button>
                  </td>

                </tr>
              );
            })}
          </tbody>

        </table>

      </div>

      {/* EMPTY */}
      {filteredCustomers.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          No customers found
        </div>
      )}
      

    </div>
    
  );
}

export default CustomersTable;