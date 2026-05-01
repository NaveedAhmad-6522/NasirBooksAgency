import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import SupplierReturn from "./SupplierReturn";

export default function SupplierLedgerPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", note: "" });
  const [search, setSearch] = useState("");
  // const [visibleCount, setVisibleCount] = useState(20);
  const [showReturn, setShowReturn] = useState(false);
  // --- Infinite scroll states
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setHasMore(true);
    fetchInitial();
  }, [id]);

  const initialAbortRef = useRef(false);

  useEffect(() => {
    initialAbortRef.current = false;
    return () => {
      initialAbortRef.current = true;
    };
  }, [id]);

  const fetchInitial = async () => {
    try {
      const res = await fetch(
        `http://localhost:5001/api/suppliers/${id}/ledger`
      );
      const result = await res.json();
      if (initialAbortRef.current) return;
      setData(result);
      setHasMore(typeof result.hasMore === "boolean" ? result.hasMore : false);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await fetch(
        `http://localhost:5001/api/suppliers/${id}/ledger`
      );
      const result = await res.json();

      setData(result);
      setHasMore(typeof result.hasMore === "boolean" ? result.hasMore : false);
    } catch (err) {
      console.error("Ledger fetch error:", err);
    }
  };

  const fetchNextPage = async () => {
    if (loadingMore || !hasMore || !data?.nextCursor) return;

    setLoadingMore(true);

    try {
      const res = await fetch(
        `http://localhost:5001/api/suppliers/${id}/ledger?cursor=${encodeURIComponent(
          data.nextCursor
        )}`
      );
      const result = await res.json();

      setHasMore(typeof result.hasMore === "boolean" ? result.hasMore : false);

      if (initialAbortRef.current) return;

      setData((prev) => ({
        ...result,
        ledger: [...(prev.ledger || []), ...(result.ledger || [])],
      }));
    } catch (err) {
      console.error(err);
    }

    setLoadingMore(false);
  };

  // --- Infinite scroll handler
  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        if (loadingMore || !hasMore || !data || !(data.ledger || []).length) {
          scrollTimeout = null;
          return;
        }
        if (
          window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 300
        ) {
          fetchNextPage();
        }
        scrollTimeout = null;
      }, 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, data]);

  const handleOpenInvoice = async (reference, type) => {
    // 🔥 ALWAYS derive type from reference (ignore passed type completely)
    let url = "";

    let finalType = null;
    let date = null;

    if (reference.startsWith("RINV-")) {
      finalType = "return";
      date = reference.replace("RINV-", "");
    } else if (reference.startsWith("INV-")) {
      finalType = "purchase";
      date = reference.replace("INV-", "");
    } else if (reference.startsWith("PAY-")) {
      const paymentId = reference.replace("PAY-", "");
      url = `http://localhost:5001/api/suppliers/payment/${paymentId}`;
    }

    if (!url) {
      const encodedDate = encodeURIComponent(date);
      url = `http://localhost:5001/api/suppliers/${id}/invoice/${encodedDate}?type=${finalType}`;
    }

    // 🔥 HARD DEBUG (do not remove)
    console.log("DEBUG CLICK:", {
      reference,
      derivedType: finalType,
      date,
      url
    });

    try {
      const res = await fetch(url);

      if (!res.ok) {
        const errText = await res.text();
        console.error("Invoice fetch failed:", errText);
        alert("Failed to load invoice");
        return;
      }

      const result = await res.json();

      if (!result) {
        alert("No invoice data found");
        return;
      }

      // Payment response fix
      if (finalType === null) {
        // payment response fix
        const paymentData = result.payment || result;
        setInvoiceData({
          ...paymentData,
          type: "payment"
        });
      } else {
        setInvoiceData({ ...result, type: finalType });
      }
    } catch (err) {
      console.error("Invoice fetch error:", err);
      alert("Error loading invoice");
    }
  };

  if (!data) return <div className="p-6">Loading...</div>;

  const { supplier, ledger, summary } = data;
  const totalPurchases = summary?.totalPurchases || 0;
  const totalPayments = summary?.totalPayments || 0;
  const totalReturns = summary?.totalReturns || 0;
  const payable = summary?.payable || 0;

  const finalLedger = data.ledger || [];

  // Helper to format currency (M for millions, improved logic)
  const formatCurrency = (value) => {
    const num = Number(value || 0);

    if (Math.abs(num) >= 1000000) {
      return (num / 1000000).toFixed(2).replace(/\.00$/, "") + "M";
    }

    if (Math.abs(num) >= 1000) {
      return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }

    return num.toFixed(0);
  };

  // --- FILTER LOGIC ---
  const filteredLedger = finalLedger.filter((l) => {
    const text = `${l.reference_id} ${l.type}`.toLowerCase();
    const date = new Date(l.created_at).toLocaleDateString();
    return (
      text.includes(search.toLowerCase()) ||
      date.includes(search)
    );
  });

  const visibleLedger = filteredLedger;

  return (
    <div className="p-6 space-y-6 print:p-0 print:space-y-0">

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
        <div className="flex gap-3 print:hidden items-center">
          <button
            onClick={() => {
              const rows = finalLedger.map((l) => ({
                Date: new Date(l.created_at).toLocaleDateString(),
                Type: l.type,
                Reference: l.reference_id,
                Purchase:
                  l.type === "purchase" || l.type === "return"
                    ? l.amount
                    : "",
                Payment: l.type === "payment" ? l.amount : "",
                Balance: l.balance,
              }));

              const csv =
                "Date,Type,Reference,Purchase,Payment,Balance\n" +
                rows
                  .map((r) => Object.values(r).map((v) => `"${v}"`).join(","))
                  .join("\n");

              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);

              const a = document.createElement("a");
              a.href = url;
              a.download = `supplier-ledger-${supplier.name}.csv`;
              a.click();
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-100 transition"
          >
            Export
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-100 transition"
          >
            Print
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition"
          >
            + Add Payment
          </button>
          <button
            onClick={() => setShowReturn(true)}
            className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium shadow-sm transition"
          >
            + Return
          </button>
        </div>
      </div>

      {/* 📊 SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-xs text-gray-500">Total Purchases</p>
          <h2 className="text-lg font-semibold mt-1">
            Rs. {formatCurrency(totalPurchases)}
          </h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-xs text-gray-500">Total Payments</p>
          <h2 className="text-lg font-semibold mt-1">
            Rs. {formatCurrency(totalPayments)}
          </h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-xs text-gray-500">Current Payable</p>
          <h2
            className={`text-lg font-semibold mt-1 ${
              payable > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            Rs. {formatCurrency(payable)}
          </h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-xs text-gray-500">Transactions</p>
          <h2 className="text-lg font-semibold mt-1">
          {data.totalTransactions || 0}
          </h2>
        </div>
      </div>

      {/* 📋 LEDGER TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">

        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-sm font-semibold">Transaction Ledger</h2>

          <input
            placeholder="Search by date, ref, type..."
            className="border px-3 py-1.5 rounded-lg text-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Reference</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-right">Purchase / Return (Dr)</th>
              <th className="px-4 py-3 text-right">Payment (Cr)</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>

          <tbody>
            {visibleLedger.map((l) => (
              <tr key={l.reference_id + l.created_at} className="border-t hover:bg-indigo-50 transition even:bg-gray-50/30">

                <td className="px-4 py-3">
                  {new Date(l.created_at).toLocaleDateString()}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      l.type === "purchase"
                        ? "bg-blue-100 text-blue-600"
                        : l.type === "return"
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {l.type === "purchase"
                      ? "Invoice"
                      : l.type === "return"
                      ? "Return"
                      : "Payment"}
                  </span>
                </td>

                <td
                  className="px-4 py-3 text-indigo-600 cursor-pointer hover:underline"
                  onClick={() => handleOpenInvoice(l.reference_id, l.type)}
                >
                  {l.reference_id}
                </td>

                <td className="px-4 py-3 text-gray-500">
                  {l.type === "purchase"
                    ? "Daily Purchase Invoice"
                    : l.type === "return"
                    ? "Return Invoice"
                    : "Payment Receipt"}
                </td>

                {/* Purchase */}
                <td className="px-4 py-3 text-right">
                  {l.type === "purchase"
                    ? `Rs. ${Number(l.amount).toLocaleString()}`
                    : l.type === "return"
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
                  Rs. {formatCurrency(l.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    {/* Payment Modal */}
    {showPaymentModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl w-full max-w-md border">

          <h2 className="text-lg font-semibold mb-4">Add Payment</h2>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
            <p className="text-xs text-gray-500">Supplier</p>
            <p className="font-semibold text-sm">{supplier?.name}</p>
            <p className="text-xs text-gray-400">{supplier?.phone || "-"} • {supplier?.city || "-"}</p>
          </div>

          <input
            placeholder="Amount (use negative for refund)"
            className="w-full border px-3 py-2 rounded mb-3"
            value={paymentForm.amount}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, amount: e.target.value })
            }
          />

          <input
            placeholder="Note"
            className="w-full border px-3 py-2 rounded mb-3"
            value={paymentForm.note}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, note: e.target.value })
            }
          />

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowPaymentModal(false)}>Cancel</button>

            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded"
              onClick={async () => {
                const amount = Number(paymentForm.amount);
                if (isNaN(amount) || amount === 0) {
                  alert("Enter a valid amount");
                  return;
                }
                const res = await fetch("http://localhost:5001/api/suppliers/payment", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    supplier_id: id,
                    amount: amount, // allow negative or positive
                    note: paymentForm.note,
                  }),
                });

                if (!res.ok) {
                  const err = await res.json();
                  alert(err.error || "Payment failed");
                  return;
                }

                setShowPaymentModal(false);
                setPaymentForm({ amount: "", note: "" });
                fetchInitial();
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Invoice Modal */}
    {invoiceData && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto print:bg-white print:block">
        <div className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto print:shadow-none print:w-full print:max-w-full print:rounded-none print:max-h-none print:overflow-visible print:p-2">

          {/* HEADER */}
          <div className="flex justify-between items-start border-b pb-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-indigo-700">NASIR BOOK AGENCY</h1>
              <p className="text-xs text-gray-500">All Kinds of Books & Educational Publishers</p>
              <p className="text-xs text-gray-400 mt-1">Peshawar • 03408056511</p>
            </div>

            <div className="text-right">
              <h2 className="text-lg font-semibold">{invoiceData.type === "purchase"
                ? "INVOICE"
                : invoiceData.type === "return"
                ? "RETURN INVOICE"
                : "PAYMENT"}</h2>
              <p className="text-xs text-gray-500 mt-1">
                {invoiceData.type === "purchase" || invoiceData.type === "return"
                  ? (invoiceData.invoice_date || new Date(invoiceData.created_at).toLocaleDateString())
                  : new Date(invoiceData.created_at).toLocaleDateString()}
              </p>
              <button onClick={() => setInvoiceData(null)} className="mt-2 text-gray-400 hover:text-black">✕</button>
            </div>
          </div>

          <div className={`flex justify-between mb-6 ${invoiceData.type === "payment" ? "print:hidden" : ""}`}>
            <div>
              <p className="text-xs text-gray-500">Supplier</p>
              <p className="font-semibold">{supplier?.name}</p>
              <p className="text-sm text-gray-500">{supplier?.city}</p>
              <p className="text-sm text-gray-500">{supplier?.phone}</p>
            </div>

            {(invoiceData.type === "purchase" || invoiceData.type === "return") && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Invoice Total</p>
                <p className="text-xl font-bold text-indigo-600">
                  Rs. {formatCurrency((invoiceData.items || []).reduce((s,i)=>s+Number(i.total || 0),0))}
                </p>
              </div>
            )}
          </div>

          {/* PURCHASE/RETURN TABLE */}
          {(invoiceData.type === "purchase" || invoiceData.type === "return") && (
            <table className="w-full text-sm border rounded-xl overflow-hidden print:break-inside-avoid">
              <thead className="bg-indigo-600 text-white text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Book</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">
                    {invoiceData.type === "return" ? "Return" : "Purchase"}
                  </th>
                  <th className="px-3 py-2 text-right">Printed</th>
                  <th className="px-3 py-2 text-right">%</th>
                  <th className="px-3 py-2 text-right">
                    {invoiceData.type === "return" ? "Return Value" : "Discounted Price"}
                  </th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {(invoiceData.items || []).map((item, i) => (
                  <tr key={i} className="border-t print:break-inside-avoid">
                    <td className="px-3 py-2">{i+1}</td>
                    <td className="px-3 py-2">{item.book_name}</td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(item.purchase_price)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(item.printed_price || 0)}</td>
                    <td className="px-3 py-2 text-right">
                      {invoiceData.type === "return"
                        ? "-"
                        : item.printed_price
                        ? ((1 - Number(item.purchase_price) / Number(item.printed_price)) * 100).toFixed(2)
                        : 0}%
                    </td>
                    <td className="px-3 py-2 text-right text-green-600">
                      {invoiceData.type === "return"
                        ? "-"
                        : formatCurrency(
                            Math.round(
                              (Number(item.printed_price || 0) - Number(item.purchase_price)) *
                              Number(item.quantity || 0)
                            )
                          )}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="bg-gray-100 font-semibold border-t-4 border-black">
                <tr>
                  <td colSpan="2" className="px-3 py-2 text-right">Totals</td>

                  <td className="px-3 py-2 text-right">
                    {(invoiceData.items || []).reduce((s,i)=>s+Number(i.quantity || 0),0)}
                  </td>

                <td className="px-3 py-2 text-right">
                    {formatCurrency((invoiceData.items || []).reduce((s,i)=>s+Number((i.purchase_price || 0) * (i.quantity || 0)),0))}
                  </td>

                  <td className="px-3 py-2 text-right">
                    {formatCurrency((invoiceData.items || []).reduce((s,i)=>s+Number((i.printed_price || 0) * (i.quantity || 0)),0))}
                  </td>

                  <td className="px-3 py-2 text-right">
                    -
                  </td>

                  <td className="px-3 py-2 text-right text-green-600">
                    {formatCurrency((invoiceData.items || []).reduce((s,i)=>{
                      const printed = Number(i.printed_price || 0);
                      const purchase = Number(i.purchase_price || 0);
                      const qty = Number(i.quantity || 0);
                      if (Number(i.total) < 0) return s; // ignore returns
                      return s + ((printed - purchase) * qty);
                    },0))}
                  </td>

                  <td className="px-3 py-2 text-right text-indigo-700">
                    {formatCurrency((invoiceData.items || []).reduce((s,i)=>s+Number(i.total || 0),0))}
                  </td>
                </tr>

                {/* DISCOUNT ROW */}
                <tr>
                  <td colSpan="7" className="px-3 py-2 text-right text-gray-500">Discount</td>
                  <td className="px-3 py-2 text-right text-red-600">
                    {formatCurrency((invoiceData.items || []).reduce((s,i)=>{
                      const printed = Number(i.printed_price || 0);
                      const purchase = Number(i.purchase_price || 0);
                      const qty = Number(i.quantity || 0);
                      if (Number(i.total) < 0) return s;
                      return s + ((printed - purchase) * qty);
                    },0))}
                  </td>
                </tr>

                {/* FINAL AMOUNT */}
                <tr className="bg-indigo-50">
                  <td colSpan="7" className="px-3 py-3 text-right font-bold">Final Amount</td>
                  <td className="px-3 py-3 text-right font-bold text-indigo-700 text-lg">
                    {formatCurrency((invoiceData.items || []).reduce((s,i)=>s+Number(i.total || 0),0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* PAYMENT UI */}
          {invoiceData.type === "payment" && (
            <div className="space-y-6 text-center">
              <div className="bg-gray-50 p-4 rounded-xl text-left space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-semibold">{new Date(invoiceData.created_at).toLocaleString()}</p>

                  <p className="text-sm text-gray-500 mt-2">Note</p>
                  <p className="font-semibold">{invoiceData.note || "-"}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Amount Paid</p>
                <h2 className="text-3xl font-bold text-green-600">
                  Rs. {formatCurrency(Number(invoiceData.amount || 0))}
                </h2>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="flex justify-between items-center mt-6 border-t pt-4">
            <p className="text-xs text-gray-400">Thank you for your business!</p>

            <div className="flex gap-2">
              <button onClick={() => window.print()} className="px-4 py-2 border rounded-lg text-sm">Print</button>
              <button onClick={() => setInvoiceData(null)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Close</button>
            </div>
          </div>

        </div>
      </div>
    )}
    {showReturn && (
      <SupplierReturn
        supplier={supplier}
        supplier_id={id}
        onClose={() => setShowReturn(false)}
        onSuccess={() => {
          setShowReturn(false);
          fetchInitial();
        }}
      />
    )}
  </div>
  );
}