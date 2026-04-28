import React from "react";
import { useParams } from "react-router-dom";
import {
  X,
  User,
  Phone,
  MapPin,
  TrendingUp,
  ArrowDown,
  Scale
} from "lucide-react";

const handlePrint = (customer, totals) => {
  const table = document.querySelector(".print-area table")?.outerHTML || "";
  const win = window.open("", "", "width=900,height=700");

  const statusLabel = totals.net > 0 ? "Amount Payable" : "Advance Balance";

  win.document.write(`
    <html>
      <head>
        <title>Customer Ledger</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 30px;
            color: #111;
          }

          .header {
            border-bottom: 2px solid #111;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }

          h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 700;
          }

          h2 {
            margin: 4px 0 0;
            font-size: 14px;
            color: #555;
          }

          .meta {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }

          .customer-box {
            margin-top: 15px;
            padding: 12px 0;
            border-bottom: 1px solid #ddd;
            line-height: 1.6;
          }

          .stats {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            gap: 10px;
          }

          .stat {
            flex: 1;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 6px;
          }

          .red { color: #dc2626; }
          .green { color: #16a34a; }
          .blue { color: #2563eb; }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
          }

          th {
            background: #111827;
            color: white;
            padding: 10px;
            font-size: 12px;
            text-transform: uppercase;
          }

          td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
          }

          tr:nth-child(even) {
            background: #f9fafb;
          }

          .right { text-align: right; }

          .footer {
            margin-top: 40px;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            color: #666;
          }

          button {
            display: none !important;
          }
          .no-print {
            display: none !important;
          }

          @media print {
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
          }
        </style>
      </head>
      <body>

        <div class="header">
          <h1>NASIR BOOK AGENCY</h1>
          <h2>Customer Ledger Report</h2>
          <div class="meta">Generated on: ${new Date().toLocaleString()}</div>
        </div>

        <div class="customer-box">
          <strong>Customer:</strong> ${customer.name || "-"}<br/>
          <strong>Phone:</strong> ${customer.phone && customer.phone !== "__" ? customer.phone : "-"}<br/>
          <strong>City:</strong> ${customer.city && customer.city !== "__" ? customer.city : "-"}
        </div>

        <div class="stats">
          <div class="stat">
            <div>Total Debit</div>
            <strong class="red">Rs ${totals.debit.toLocaleString()}</strong>
          </div>

          <div class="stat">
            <div>Total Credit</div>
            <strong class="green">Rs ${totals.credit.toLocaleString()}</strong>
          </div>

          <div class="stat">
            <div>Net Balance</div>
            <strong class="blue">Rs ${totals.net.toLocaleString()}</strong>
          </div>

          <div class="stat" style="background:#fff7ed;border-color:#fb923c">
            <div><strong>${statusLabel}</strong></div>
            <strong style="color:#ea580c;font-size:18px;">
              Rs ${Math.abs(totals.net).toLocaleString()}
            </strong>
          </div>
        </div>

        ${table}

        <div style="
          margin-top:20px;
          padding:12px;
          border:2px dashed #ea580c;
          background:#fff7ed;
          text-align:center;
          font-size:16px;
        ">
          <strong>${statusLabel}: Rs ${Math.abs(totals.net).toLocaleString()}</strong>
        </div>

        <div class="footer">
          <div>NASIR BOOK AGENCY</div>
          <div>Authorized Signature</div>
        </div>

      </body>
    </html>
  `);

  win.document.close();

  // 🔥 WAIT FOR CONTENT TO LOAD BEFORE PRINTING (FIX PARTIAL PRINT ISSUE)
  setTimeout(() => {
    win.focus();
    win.print();
    win.close();
  }, 500);
};

function CustomerLedgerPage({ onViewSale }) {
  const { id } = useParams();
  const [data, setData] = React.useState(null);

  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState(null);

  React.useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:5001/api/customers/${id}/ledger`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Ledger fetch error:", err));
  }, [id]);

  const [localLedger, setLocalLedger] = React.useState([]);

  React.useEffect(() => {
    if (data?.ledger) {
      setLocalLedger(data.ledger);
    }
  }, [data]);

  if (!data) {
    return <div className="p-6">Loading ledger...</div>;
  }

  const customer = data?.customer || {};
  const ledger = data?.ledger || [];

  // 🔥 SHOW LATEST FIRST (DO NOT MUTATE ORIGINAL)
  const displayLedger = Array.isArray(localLedger) ? [...localLedger].reverse() : [];

  const totalDebit = localLedger
    .filter((l) => l.type === "sale" || l.type === "opening")
    .reduce((sum, l) => {
      if (l.type === "opening") return sum + Number(l.balance || 0);
      return sum + Number(l.amount);
    }, 0);

  const totalCredit = localLedger
    .filter((l) => l.type === "payment")
    .reduce((sum, l) => sum + Number(l.amount), 0);

  const net = totalDebit - totalCredit;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      <div className="print-area bg-white w-full rounded-2xl shadow p-6 space-y-6">

        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">NASIR BOOK AGENCY</h1>
          <div className="text-sm text-gray-500">
            Customer Ledger Report
          </div>
          <div className="text-sm mt-1">
            Generated on: {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* HEADER */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <User size={18} /> Customer Ledger
            </h2>
            <p className="text-sm text-gray-400">
              Detailed statement of account
            </p>
          </div>

        </div>

        {/* CUSTOMER */}
        <div className="flex justify-between items-center">

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center text-xl font-bold shadow">
              {(customer.name || "C")[0]}
            </div>

            <div>
              <div className="text-lg font-semibold text-gray-800">
                {customer.name}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone size={14} /> {customer.phone && customer.phone !== "__" ? customer.phone : "-"}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={14} /> {customer.city && customer.city !== "__" ? customer.city : "-"}
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 px-6 py-4 rounded-xl text-right shadow-sm">
            <div className="text-xs text-gray-500">Total Remaining</div>
            <div className="text-red-600 text-2xl font-bold">
              Rs {Number(customer.balance || 0).toLocaleString()}
            </div>
          </div>

        </div>

        {/* STATS */}
        <div className="bg-gray-50 rounded-xl p-5 grid grid-cols-3 gap-6 border">

          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <TrendingUp size={18} className="text-red-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Total Debit</div>
              <div className="text-red-600 font-bold text-lg">
                Rs {totalDebit.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <ArrowDown size={18} className="text-green-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Total Credit</div>
              <div className="text-green-600 font-bold text-lg">
                Rs {totalCredit.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Scale size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Net Remaining</div>
              <div className="text-blue-600 font-bold text-lg">
                Rs {net.toLocaleString()}
              </div>
            </div>
          </div>

        </div>


        {/* TABLE */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

          {/* Removed the grid header for cleaner print layout */}

          {displayLedger.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto print:max-h-none print:overflow-visible">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900 text-white text-xs uppercase tracking-wide">
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Ref</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3 text-right">Debit</th>
                    <th className="p-3 text-right">Credit</th>
                    <th className="p-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {displayLedger.map((l, i) => {
                    if (!l) return null;

                    const isSale = l.type === "sale";
                    const isPayment = l.type === "payment";
                    const isOpening = l.type === "opening";
                    const refLabel = isOpening ? "OPENING" : `INV-${String(l.id).padStart(4, "0")}`;

                    return (
                      <tr
                        key={i}
                        className={`border-b transition ${isSale || isPayment ? "hover:bg-gray-50" : ""}`}
                      >
                        <td className="p-3 text-gray-600">
                          {isOpening ? "-" : new Date(l.created_at).toLocaleDateString()}
                        </td>
                        <td
                          className={`p-3 font-medium ${
                            isSale
                              ? "text-blue-600 cursor-pointer hover:underline"
                              : isPayment
                              ? "text-indigo-600 cursor-pointer hover:underline"
                              : "text-gray-800"
                          }`}
                          onClick={() => {
                            if (isSale) {
                              window.open(`/sales/${l.id}`, "_blank");
                            } else if (isPayment) {
                              setSelectedPayment(l);
                              setShowPaymentModal(true);
                            }
                          }}
                        >
                          {refLabel}
                        </td>
                        <td className="p-3 text-gray-600 font-medium">
                          {isOpening ? "Opening" : isSale ? "Sale" : "Payment"}
                        </td>
                        <td className="p-3 text-gray-600">
                          {isOpening && "Opening Balance"}
                          {isSale && `Invoice #${l.id} `}
                          {isPayment && "Payment Received"}
                        </td>
                        <td
                          className="p-3 text-right font-semibold"
                          style={{color: isSale ? "#dc2626" : "#999"}}
                        >
                          {isSale ? `Rs ${Number(l.amount).toLocaleString()}` : "-"}
                        </td>
                        <td
                          className="p-3 text-right font-semibold"
                          style={{color: isPayment ? "#16a34a" : "#999"}}
                        >
                          {isPayment ? `Rs ${Number(l.amount).toLocaleString()}` : "-"}
                        </td>
                        <td className="p-3 text-right font-bold text-gray-800">
                          Rs {Number(l.balance).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400">
              No transactions available
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex gap-3 no-print">

          <div className="text-sm text-gray-400">
            {localLedger.length} transactions
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                handlePrint(customer, {
                  debit: totalDebit,
                  credit: totalCredit,
                  net: net,
                })
              }
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Print
            </button>

          </div>

        </div>

      </div>

      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[350px] space-y-4 shadow-xl">

            <h3 className="text-lg font-semibold">Payment Details</h3>

            <div className="text-sm text-gray-600">
              <div><strong>Reference:</strong> PAY-{String(selectedPayment.id).padStart(4, "0")}</div>
              <div><strong>Date:</strong> {new Date(selectedPayment.created_at).toLocaleString()}</div>
              <div><strong>Amount:</strong> Rs {Number(selectedPayment.amount).toLocaleString()}</div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-800 text-white rounded"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default CustomerLedgerPage;