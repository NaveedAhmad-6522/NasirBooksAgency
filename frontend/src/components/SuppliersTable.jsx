import { Eye, Pencil, Trash2, BookOpen } from "lucide-react";

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB");
};

const formatCurrency = (num) => {
  if (!num) return "Rs. 0";
  num = Number(num);
  if (num >= 10000000) return `Rs. ${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `Rs. ${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `Rs. ${(num / 1000).toFixed(2)} K`;
  return `Rs. ${num}`;
};

export default function SuppliersTable({ suppliers, onLedger, onEdit, onDelete, onToggleStatus }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <table className="w-full text-sm">

        {/* HEADER */}
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3 text-left">#</th>
            <th className="px-4 py-3 text-left">Supplier</th>
            <th className="px-4 py-3 text-left">Phone</th>
            <th className="px-4 py-3 text-left">City</th>
            <th className="px-4 py-3 text-right">Books</th>
            <th className="px-4 py-3 text-right">Payable</th>
            <th className="px-4 py-3 text-center">Last Supply</th>
            <th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {suppliers.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-gray-400" colSpan="9">
                No suppliers found
              </td>
            </tr>
          ) : (
            suppliers.map((s, index) => {
              const hasTransactions = Number(s.totalAmount || 0) > 0 || Number(s.totalPayments || 0) > 0;
              const isActive = s.status ? s.status !== "inactive" : Number(s.is_active) === 1;
              return (
              <tr
                key={s.id}
                className="border-t hover:bg-gray-50/70 transition-all duration-200"
              >
                <td className="px-4 py-4 text-gray-400">{index + 1}</td>

                {/* NAME */}
                <td className="px-4 py-4 font-medium text-gray-800">
                  {s.name}
                </td>

                {/* PHONE */}
                <td className="px-4 py-4 text-gray-600">{s.phone}</td>

                {/* CITY */}
                <td className="px-4 py-4 text-gray-500">
                  {s.city || "-"}
                </td>

                {/* BOOKS */}
                <td className="px-4 py-4 text-right font-medium text-gray-700">
                  {s.totalBooks}
                </td>

                {/* PAYABLE */}
                <td className="px-4 py-4 text-right font-semibold">
                  <span
                    className={`${
                      Number(
                        s.balance ?? (Number(s.totalAmount || 0) - Number(s.totalPayments || 0))
                      ) > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {formatCurrency(
                      s.balance ?? (Number(s.totalAmount || 0) - Number(s.totalPayments || 0))
                    )}
                  </span>
                </td>

                {/* DATE */}
                <td className="px-4 py-4 text-center text-gray-500">
                  {formatDate(s.lastSupply)}
                </td>

                {/* STATUS */}
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to ${isActive ? "deactivate" : "activate"} this supplier?`)) {
                        onToggleStatus && onToggleStatus(s);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      isActive
                        ? "bg-green-100 text-green-600 hover:bg-green-200"
                        : "bg-red-100 text-red-600 hover:bg-red-200"
                    }`}
                    title="Click to toggle status"
                  >
                    {isActive ? "Active" : "Inactive"}
                  </button>
                </td>

                {/* ACTIONS */}
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-2">

                    <button
                      type="button"
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition cursor-pointer"
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Edit clicked:", s);
                        onEdit && onEdit(s);
                      }}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition cursor-pointer"
                    >
                      <Pencil size={16} />
                    </button>

                    {/* PREMIUM LEDGER BUTTON */}
                    <button
                      onClick={() => onLedger && onLedger(s.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] transition"
                    >
                      <BookOpen size={14} />
                      Ledger
                    </button>

                    <button
                      onClick={() => {
                        if (hasTransactions) {
                          alert("Cannot delete supplier with transactions or payments");
                          return;
                        }
                        onDelete && onDelete(s.id);
                      }}
                      disabled={hasTransactions}
                      className={`p-2 rounded-lg border transition ${
                        hasTransactions
                          ? "border-gray-100 text-gray-300 cursor-not-allowed"
                          : "border-gray-200 hover:bg-red-50 text-red-500"
                      }`}
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>
                </td>
              </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}