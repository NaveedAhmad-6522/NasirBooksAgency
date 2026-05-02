import React from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [data, setData] = React.useState(null);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState(null);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(50);

  // Fetch ledger utility for refresh
  const fetchLedger = () => {
    if (!id) return;
    fetch(`http://localhost:5001/api/customers/${id}/ledger?page=${page}&limit=${limit}`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Ledger fetch error:", err));
  };

  React.useEffect(() => {
    fetchLedger();
  }, [id, page]);

  // Smart scalable polling (auto-refresh)
  React.useEffect(() => {
    let timeout;

    const smartRefresh = () => {
      if (document.visibilityState === "visible") {
        fetchLedger();
      }

      timeout = setTimeout(smartRefresh, 20000); // lighter, scalable
    };

    smartRefresh();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [id, page]);

  React.useEffect(() => {
    const onFocus = () => {
      fetchLedger();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [id, page]);


  if (!data) {
    return <div className="p-6">Loading ledger...</div>;
  }

  const customer = data?.customer || {};
  const ledger = data?.ledger || [];

  // 🔥 SHOW LATEST FIRST (DO NOT MUTATE ORIGINAL)
  const displayLedger = data?.ledger || [];

  const totalDebit = data?.totals?.debit || 0;
  const totalCredit = data?.totals?.credit || 0;
  const net = data?.totals?.net || 0;

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
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedPayment(null);
                setShowPaymentModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Payment
            </button>

            <button
              onClick={() => window.open(`/customer-return/${id}`, '_blank')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Return
            </button>
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
                    const isReturn = l.type === "return";
                    const isOpening = l.type === "opening";
                    const refLabel = isOpening
                      ? "OPENING"
                      : isReturn
                      ? `RINV-${String(l.id).padStart(4, "0")}`
                      : `INV-${String(l.id).padStart(4, "0")}`;

                    return (
                      <tr
                        key={i}
                        className={`border-b transition ${
                          isSale ? "bg-red-50 hover:bg-red-100" :
                          isPayment ? "bg-green-50 hover:bg-green-100" :
                          isReturn ? "bg-orange-50 hover:bg-orange-100" :
                          "hover:bg-gray-50"
                        }`}
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
                              : isReturn
                              ? "text-green-700 cursor-pointer hover:underline"
                              : "text-gray-800"
                          }`}
                          onClick={() => {
                            if (isSale) {
                              window.open(`/sales/${l.id}`, "_blank");
                            } else if (isPayment) {
                              setSelectedPayment(l);
                            } else if (isReturn) {
                              const win = window.open("", "", "width=800,height=600");

                              // parse items BEFORE rendering
                              let parsedItems = [];
                              try {
                                if (typeof l.items === "string") {
                                  parsedItems = JSON.parse(l.items || "[]");
                                } else if (Array.isArray(l.items)) {
                                  parsedItems = l.items;
                                }
                              } catch (e) {
                                console.error("Items parse error:", e, l.items);
                              }

                              // build rows
                              const rowsHtml = parsedItems.length
                                ? parsedItems
                                    .map((it) => {
                                      const bookName =
                                        it.book_name ||
                                        it.name ||
                                        it.title ||
                                        it.bookTitle ||
                                        (it.book_id ? `Book #${it.book_id}` : "-");
                                      return `
                                        <tr>
                                          <td>${bookName}</td>
                                          <td class="center">${it.quantity}</td>
                                          <td class="right">Rs ${Number(it.original_price || it.price).toLocaleString()}</td>
                                          <td class="center">${it.discount || 0}%</td>
                                          <td class="right">Rs ${Number(it.price).toLocaleString()}</td>
                                          <td class="right">Rs ${Number(it.quantity * it.price).toLocaleString()}</td>
                                        </tr>
                                      `;
                                    })
                                    .join("")
                                : `
                                  <tr>
                                    <td colspan="6" class="center" style="color:#999;">
                                      No item details available
                                    </td>
                                  </tr>
                                `;

                              win.document.write(`
                                <html>
                                  <head>
                                    <title>Return Invoice</title>
                                    <style>
                                      body { font-family: Arial, sans-serif; padding: 20px; color:#111; }
                                      h1 { margin-bottom: 4px; }
                                      .sub { color:#555; font-size:13px; margin-bottom:10px; }
                                      .box { margin-top: 15px; line-height:1.6; }
                                      table { width:100%; border-collapse: collapse; margin-top:15px; }
                                      th { background:#111; color:#fff; padding:8px; font-size:12px; }
                                      td { padding:8px; border-bottom:1px solid #ddd; font-size:13px; }
                                      .right { text-align:right; }
                                      .center { text-align:center; }
                                      .total { margin-top:20px; font-size:18px; font-weight:bold; color:#16a34a; text-align:right; }
                                    </style>
                                  </head>
                                  <body>

                                    <h1>NASIR BOOK AGENCY</h1>
                                    <div class="sub">Return Invoice</div>

                                    <div class="box">
                                      <div class="row"><strong>Customer:</strong> ${customer.name || "-"}</div>
                                      <div class="row"><strong>Phone:</strong> ${customer.phone && customer.phone !== "__" ? customer.phone : "-"}</div>
                                      <div class="row"><strong>City:</strong> ${customer.city && customer.city !== "__" ? customer.city : "-"}</div>
                                      <div class="row"><strong>Date:</strong> ${new Date(l.created_at).toLocaleString()}</div>
                                      <div class="row"><strong>Invoice #:</strong> RINV-${String(l.id).padStart(4, "0")}</div>
                                    </div>

                                    <div class="box">
                                      <div class="row"><strong>Type:</strong> Book Return</div>
                                    </div>

                                    <table border="1" cellspacing="0" cellpadding="8">
                                      <thead>
                                        <tr>
                                          <th>Book</th>
                                          <th>Qty</th>
                                          <th>Original</th>
                                          <th>Disc</th>
                                          <th>Price</th>
                                          <th>Total</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        ${rowsHtml}
                                      </tbody>
                                    </table>

                                    <div class="total">
                                      Total Refund: Rs ${Number(l.amount).toLocaleString()}
                                    </div>

                                  </body>
                                </html>
                              `);

                              win.document.close();
                              // Add manual print button instead of auto-print
                              const printBtn = win.document.createElement('button');
                              printBtn.innerText = 'Print Invoice';
                              printBtn.style.marginTop = '20px';
                              printBtn.style.padding = '10px 20px';
                              printBtn.style.background = '#111827';
                              printBtn.style.color = '#fff';
                              printBtn.style.border = 'none';
                              printBtn.style.cursor = 'pointer';
                              printBtn.onclick = () => win.print();

                              win.document.body.appendChild(printBtn);
                            }
                          }}
                        >
                          {refLabel}
                        </td>
                        <td className="p-3">
                          {isOpening && <span className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">Opening</span>}
                          {isSale && <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Sale</span>}
                          {isPayment && <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Payment</span>}
                          {isReturn && <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-700">Return</span>}
                        </td>
                        <td className="p-3 text-gray-600">
                          {isOpening && "Opening Balance"}
                          {isSale && `Invoice #${l.id}`}
                          {isReturn && `Return Invoice #${l.id}`}
                          {isPayment && "Payment Received"}
                        </td>
                        <td
                          className="p-3 text-right font-semibold"
                          style={{ color: isSale ? "#dc2626" : "#999" }}
                        >
                          {isSale ? `Rs ${Number(l.amount).toLocaleString()}` : "-"}
                        </td>
                        <td
                          className="p-3 text-right font-semibold"
                          style={{ color: isPayment || isReturn ? "#16a34a" : "#999" }}
                        >
                          {isPayment || isReturn ? `Rs ${Number(l.amount).toLocaleString()}` : "-"}
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
            {data?.pagination?.total || 0} total transactions
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

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[350px] space-y-4 shadow-xl">

            <h3 className="text-lg font-semibold">Add Payment</h3>

            <div className="text-sm text-gray-500">
              Customer: <strong>{customer.name}</strong>
            </div>

            <input
              type="number"
              placeholder="Enter amount"
              className="w-full border p-2 rounded"
              id="paymentAmount"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  const amount = document.getElementById("paymentAmount").value;

                  if (!amount) return alert("Enter amount");

                  await fetch("http://localhost:5001/api/customers/payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      customer_id: id,
                      amount: Number(amount),
                      payment_method: "cash"
                    })
                  });

                  setShowPaymentModal(false);
                  fetchLedger();
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

      {selectedPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[350px] space-y-4 shadow-xl">

            <h3 className="text-lg font-semibold">Payment Details</h3>

            <div className="text-sm text-gray-500">
              Customer: <strong>{customer.name}</strong>
            </div>

            <div className="text-sm">
              <strong>Amount:</strong> Rs {Number(selectedPayment.amount).toLocaleString()}
            </div>

            <div className="text-sm">
              <strong>Date:</strong> {new Date(selectedPayment.created_at).toLocaleString()}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-3 py-1 border rounded"
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