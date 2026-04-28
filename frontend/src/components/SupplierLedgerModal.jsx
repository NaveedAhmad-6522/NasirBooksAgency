import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function SupplierLedgerPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      const res = await fetch(
        `http://localhost:5001/api/suppliers/${id}/ledger`
      );
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Ledger fetch error:", err);
    }
  };

  const handleOpenInvoice = async (reference) => {
    try {
      const date = reference.replace("INV-", "");

      const res = await fetch(
        `http://localhost:5001/api/suppliers/${id}/invoice/${date}`
      );

      const result = await res.json();
      setInvoiceData(result);
    } catch (err) {
      console.error("Invoice fetch error:", err);
    }
  };

  if (!data) return <div className="p-6">Loading...</div>;

  const { supplier, ledger } = data;

  // 🔥 Group purchases by date (daily invoice)
  const groupedLedger = [];
  const purchaseMap = {};

  ledger.forEach((l) => {
    const localDate = new Date(l.created_at);
    const dateKey =
      localDate.getFullYear() +
      "-" +
      String(localDate.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(localDate.getDate()).padStart(2, "0");

    if (l.type === "purchase") {
      if (!purchaseMap[dateKey]) {
        purchaseMap[dateKey] = {
          type: "purchase",
          created_at: l.created_at,
          reference_id: `INV-${dateKey}`,
          amount: 0,
          items: [],
        };
        groupedLedger.push(purchaseMap[dateKey]);
      }

      purchaseMap[dateKey].amount += Number(l.amount);
      purchaseMap[dateKey].items.push(l);
    } else {
      groupedLedger.push(l);
    }
  });

  // 🔥 Recalculate running balance
  let runningBalance = 0;
  const finalLedger = groupedLedger
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((l) => {
      if (l.type === "purchase") {
        runningBalance += Number(l.amount);
      } else {
        runningBalance -= Number(l.amount);
      }

      return { ...l, balance: runningBalance };
    });

  // 🔥 Calculations
  const totalPurchases = ledger
    .filter((l) => l.type === "purchase")
    .reduce((sum, l) => sum + Number(l.amount), 0);

  const totalPayments = ledger
    .filter((l) => l.type === "payment")
    .reduce((sum, l) => sum + Number(l.amount), 0);

  const payable = totalPurchases - totalPayments;

  return (
    <div className="p-6 space-y-6">

      {/* 🔙 Back */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-black"
      >
        ← Back to Suppliers
      </button>

      {/* 🔝 HEADER */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col md:flex-row justify-between gap-6">

        {/* Supplier Info */}
        <div>
          <h1 className="text-xl font-semibold">
            {supplier?.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {supplier?.phone || "-"} • {supplier?.city || "-"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl border text-sm">
            Export
          </button>
          <button className="px-4 py-2 rounded-xl border text-sm">
            Print
          </button>
          <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm">
            + Add Payment
          </button>
        </div>
      </div>

      {/* 📊 SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-xs text-gray-500">Total Purchases</p>
          <h2 className="text-lg font-semibold mt-1">
            Rs. {totalPurchases.toLocaleString()}
          </h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-xs text-gray-500">Total Payments</p>
          <h2 className="text-lg font-semibold mt-1">
            Rs. {totalPayments.toLocaleString()}
          </h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-xs text-gray-500">Current Payable</p>
          <h2
            className={`text-lg font-semibold mt-1 ${
              payable > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            Rs. {payable.toLocaleString()}
          </h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-xs text-gray-500">Transactions</p>
          <h2 className="text-lg font-semibold mt-1">
            {ledger.length}
          </h2>
        </div>
      </div>

      {/* 📋 LEDGER TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">

        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-sm font-semibold">Transaction Ledger</h2>

          <input
            placeholder="Search..."
            className="border px-3 py-1.5 rounded-lg text-sm"
          />
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Reference</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-right">Purchase (Dr)</th>
              <th className="px-4 py-3 text-right">Payment (Cr)</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>

          <tbody>
            {finalLedger.map((l, i) => (
              <tr key={i} className="border-t hover:bg-gray-50 transition even:bg-gray-50/30">

                <td className="px-4 py-3">
                  {new Date(l.created_at).toLocaleDateString()}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      l.type === "purchase"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {l.type === "purchase" ? "Invoice" : "Payment"}
                  </span>
                </td>

                <td
                  className={`px-4 py-3 ${l.type === "purchase" ? "text-indigo-600 cursor-pointer hover:underline" : ""}`}
                  onClick={() => {
                    if (l.type === "purchase") handleOpenInvoice(l.reference_id);
                  }}
                >
                  {l.reference_id}
                </td>

                <td className="px-4 py-3 text-gray-500">
                  {l.type === "purchase"
                    ? "Daily Purchase Invoice"
                    : "Supplier Payment"}
                </td>

                {/* Purchase */}
                <td className="px-4 py-3 text-right">
                  {l.type === "purchase"
                    ? `Rs. ${Number(l.amount).toLocaleString()}`
                    : "-"}
                </td>

                {/* Payment */}
                <td className="px-4 py-3 text-right">
                  {l.type === "payment"
                    ? `Rs. ${Number(l.amount).toLocaleString()}`
                    : "-"}
                </td>

                {/* Balance */}
                <td
                  className={`px-4 py-3 text-right font-semibold ${
                    l.balance > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  Rs. {Number(l.balance).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    {/* Invoice Modal */}
    {invoiceData && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">

          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Invoice — {invoiceData.invoice_date}
            </h2>
            <button onClick={() => setInvoiceData(null)}>✕</button>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs">
              <tr>
                <th className="px-3 py-2 text-left">Book</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Price</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>

            <tbody>
              {(invoiceData?.items || []).map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{item.book_name}</td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">
                    Rs. {Number(item.purchase_price).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    Rs. {Number(item.total).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    )}
  </div>
  );
}