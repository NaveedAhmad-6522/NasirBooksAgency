import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Printer, MessageCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

const authHeaders = (json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

function Invoice({
  cart = [],
  customer = null,
  paid = 0,
  previous_balance = 0,
  updated_balance = 0,
  mode,
}) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [booksMap, setBooksMap] = useState({});
  const [customerInfo, setCustomerInfo] = useState(null);

  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
      @media print {
        body {
          background: white !important;
          margin: 0;
        }

        @page {
          margin: 6mm;
        }

        table {
          font-size: 9px;
          line-height: 1;
        }

        td,
        th {
          padding-top: 2px !important;
          padding-bottom: 2px !important;
        }

        button {
          display: none !important;
        }
      }
    `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (mode === "pos") return; // skip API in POS
    if (!id || id === "undefined") return; // prevent undefined

    fetch(`${API_BASE}/api/sales/${id}`, {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then(res => {
        console.log("SALE DATA:", res);
        setData(res);
      })
      .catch((err) => console.error(err));
  }, [id, mode]);

  useEffect(() => {
    if (!data?.sale?.customer_id) return;

    fetch(`${API_BASE}/api/customers/${data.sale.customer_id}`, {
      headers: authHeaders(),
    })
      .then(res => res.json())
      .then(setCustomerInfo)
      .catch(() => {});
  }, [data]);

  useEffect(() => {
    if (mode === "pos") return;
    // fetch minimal books list once (or when id changes)
    fetch(`${API_BASE}/api/books?fields=id,title,publisher,edition`, {
      headers: authHeaders(),
    })
      .then(res => res.json())
      .then(list => {
        const map = {};
        (Array.isArray(list) ? list : list?.data || []).forEach(b => {
          map[b.id] = b;
        });
        setBooksMap(map);
      })
      .catch(() => {});
  }, []);

  // 🔥 Prevent infinite loading when no id (like inside POS or accidental mount)
  if (!mode && !id) return null;

  if (mode !== "pos" && id && !data) {
    return <div className="p-6">Loading...</div>;
  }

  const items = mode === "pos" ? cart : data?.items || [];

  const sale = mode === "pos"
    ? {
        id: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        created_at: new Date(),
        customer_name: customer?.name,
        payment_method: "cash",
        paid_amount: paid,
      }
    : data?.sale || {};

  const customerData = data?.customer || data?.sale?.customer || {};

  // 🔥 CALCULATIONS
  const isWalkIn = !sale.customer_name || sale.customer_name === "Walk-in Customer";

  let subtotal = 0;
  let totalDiscount = 0;

  items.forEach((i) => {
    const price = Number(i.current_price || i.printed_price || i.price || 0);
    const qty = Number(i.quantity || 0);
    const disc = parseFloat(i.discount || 0) || 0;

    const itemTotal = price * qty;
    const discount = (itemTotal * disc) / 100;

    subtotal += itemTotal;
    totalDiscount += discount;
  });

  const netTotal = subtotal - totalDiscount;
  const grandTotal = netTotal;

  const paidAmount = Number(sale.paid_amount || 0);
  const remaining = netTotal - paidAmount;

  const currentCustomerBalance = Number(
    mode === "pos"
      ? updated_balance
      : (
          sale?.customer_balance ||
          customerInfo?.balance ||
          customerData?.balance ||
          0
        )
  );

  // 🔥 backend-calculated previous balance
  const previousBalance = Number(
    mode === "pos"
      ? previous_balance
      : (
          sale?.previous_balance ||
          data?.previous_balance ||
          0
        )
  );

  console.log("INVOICE CUSTOMER DEBUG:", { data, sale, customerData, customer });

  return (
    <div className="p-4 bg-gray-100 flex flex-col items-center print:bg-white print:p-2 print:min-h-0 print:h-auto">
      <div className="w-[800px] print:w-full print:max-w-[750px] print:h-auto">
        <div className="bg-white w-full rounded-xl shadow-lg p-3 space-y-2 relative print:w-full print:shadow-none print:rounded-none print:p-1.5 print:break-inside-avoid text-[11px] leading-tight">


        {/* HEADER */}
        <div className="flex justify-between items-start border-b pb-2">
          <div>
            <h1 className="text-lg font-bold tracking-wide text-gray-900">NASIR BOOK AGENCY</h1>
            <div className="text-xs text-gray-500 mt-1">Sales Invoice</div>
            <div className="text-[10px] text-gray-600 mt-0.5 leading-tight space-y-0">
              <div>Dhakki Nalbandi, Qissa Khwani Bazar Peshawar</div>
              <div className="flex items-center gap-2">
                <span>📞</span>
                <span>091-2572277</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <MessageCircle size={14} />
                <span className="text-gray-700">0302-8884377</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <MessageCircle size={14} />
                <span className="text-gray-700">0311-3888849</span>
              </div>
            </div>
          </div>

          <div className="text-right text-sm flex flex-col items-end gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition print:hidden"
            >
              <Printer size={14} />
              Print
            </button>

            <div>
              <div className="font-semibold text-base">
                Invoice #{sale?.id || "N/A"}
              </div>

              <div className="text-gray-500 mt-1 text-xs">
                {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : ""}
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMER */}
        <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-800 mt-1">
          <div>
            <div className="font-semibold mb-1">Bill To</div>
            <div>{sale.customer_name || "Walk-in Customer"}</div>
            <div>
              Phone: {
                customerInfo?.phone ||
                customerData?.phone ||
                customerData?.phone_number ||
                data?.phone ||
                data?.customer_phone ||
                sale?.phone ||
                sale?.customer_phone ||
                customer?.phone ||
                "-"
              }
            </div>
            <div>
              City: {
                customerInfo?.city ||
                customerData?.city ||
                customerData?.city_name ||
                data?.city ||
                data?.customer_city ||
                sale?.city ||
                sale?.customer_city ||
                customer?.city ||
                "-"
              }
            </div>
          </div>

          <div className="text-right">
            <div><span className="font-medium">Payment:</span> {sale.payment_method}</div>
          </div>
        </div>

        {/* ITEMS */}
        <div>
          <table className="w-full text-[10px] border-collapse mt-1 leading-tight">
            <thead className="bg-gray-50 border-y text-[9px] uppercase">
              <tr>
                <th className="py-1 text-left">#</th>
                <th className="py-1 text-left">Item</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Unit Price</th>
                <th className="py-1 text-right">%</th>
                <th className="py-1 text-right">Disc Price</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>

            <tbody>
              {items.map((i, idx) => {
                const price = Number(i.current_price || i.printed_price || i.price || 0);
                const qty = Number(i.quantity || 0);
                const disc = parseFloat(i.discount || 0) || 0;

                const discounted = price * (1 - disc / 100);
                const total = discounted * qty;

                const meta = booksMap[i.book_id] || {};
                const name = i.book_name || i.title || meta.title || `Book #${i.book_id}`;
                const publisher = i.publisher || meta.publisher;
                const edition = i.edition || meta.edition;

                return (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-1">{idx + 1}</td>

                    <td className="py-1 font-medium">
                      <div>{name}</div>
                      {(publisher || edition) && (
                        <div className="text-[9px] text-gray-500 leading-tight">
                          {publisher ? publisher : ""}
                          {publisher && edition ? " • " : ""}
                          {edition ? `Edition: ${edition}` : ""}
                        </div>
                      )}
                    </td>

                    <td className="py-1 text-center">{qty}</td>

                    <td className="py-1 text-right">
                      Rs {price.toLocaleString()}
                    </td>

                    <td className="py-1 text-right">
                      {disc}%
                    </td>

                    <td className="py-1 text-right text-gray-700">
                      Rs {discounted.toLocaleString()}
                    </td>

                    <td className="py-1 text-right font-semibold">
                      Rs {total.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div className="flex justify-end">
          <table className="w-[250px] text-[10px] mt-1">
            <tbody>

              <tr>
                <td className="py-1 text-gray-500">Subtotal</td>
                <td className="py-1 text-right">Rs {subtotal.toLocaleString()}</td>
              </tr>

              <tr>
                <td className="py-1 text-gray-500">Discount</td>
                <td className="py-1 text-right">- Rs {totalDiscount.toLocaleString()}</td>
              </tr>

              <tr className="border-t">
                <td className="py-2 font-semibold">Net Total</td>
                <td className="py-2 text-right font-semibold">Rs {netTotal.toLocaleString()}</td>
              </tr>

              <tr>
                <td className="py-1 text-gray-500">Grand Total</td>
                <td className="py-1 text-right font-semibold">Rs {grandTotal.toLocaleString()}</td>
              </tr> 

              <tr>
                <td className="py-1 text-gray-500">Paid</td>
                <td className="py-1 text-right">Rs {paidAmount.toLocaleString()}</td>
              </tr>

              {/* CUSTOMER BALANCE DETAILS */}
              {!isWalkIn && (
                <tr>
                  <td className="py-1 text-gray-500">Previous Remaining</td>
                  <td className={`py-1 text-right ${
                    previousBalance > 0 ? "text-red-600" : "text-green-600"
                  }`}>
                    Rs {previousBalance.toLocaleString()}
                  </td>
                </tr>
              )}

              {remaining > 0 && (
                <tr>
                  <td className="py-1 text-gray-500">
                    {isWalkIn ? "Remaining" : "Current Invoice Due"}
                  </td>
                  <td className="py-1 text-right text-red-600 font-medium">
                    Rs {remaining.toLocaleString()}
                  </td>
                </tr>
              )}

              {!isWalkIn && (
                <tr className="border-t">
                  <td className="py-2 font-bold text-gray-700">Updated Balance</td>
                  <td className={`py-2 text-right font-bold ${
                    currentCustomerBalance > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}>
                    Rs {currentCustomerBalance.toLocaleString()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-2 border-t text-[9px] text-gray-400">
          <div>Thank you for your business</div>
          <div>Nasir Book Agency</div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default Invoice;