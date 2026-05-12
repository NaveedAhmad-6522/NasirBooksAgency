import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const style = document.createElement("style");
style.innerHTML = `
  @media print {
    body {
      background: white !important;
      margin: 0;
    }

    @page {
      margin: 10mm;
    }

    table {
      font-size: 12px;
    }

    button {
      display: none !important;
    }
  }
`;
document.head.appendChild(style);

function Invoice({ cart = [], customer = null, paid = 0, mode }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [booksMap, setBooksMap] = useState({});
  const [customerInfo, setCustomerInfo] = useState(null);

  useEffect(() => {
    if (mode === "pos") return; // skip API in POS
    if (!id || id === "undefined") return; // prevent undefined

    fetch(`http://localhost:5001/api/sales/${id}`)
      .then((res) => res.json())
      .then(res => {
        console.log("SALE DATA:", res);
        setData(res);
      })
      .catch((err) => console.error(err));
  }, [id, mode]);

  useEffect(() => {
    if (!data?.sale?.customer_id) return;

    fetch(`http://localhost:5001/api/customers/${data.sale.customer_id}`)
      .then(res => res.json())
      .then(setCustomerInfo)
      .catch(() => {});
  }, [data]);

  useEffect(() => {
    // fetch minimal books list once (or when id changes)
    fetch(`http://localhost:5001/api/books?fields=id,title,publisher,edition`)
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
  const previousBalance = 0;
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

  console.log("INVOICE CUSTOMER DEBUG:", { data, sale, customerData, customer });

  return (
    <div className="p-6 bg-gray-100 flex flex-col items-center print:bg-white print:p-4 print:min-h-0 print:h-auto">
      <div className="w-[800px] print:w-full print:max-w-[750px] print:h-auto">
        <div className="bg-white w-full rounded-xl shadow-lg p-6 space-y-6 relative print:w-full print:shadow-none print:rounded-none print:p-4 print:break-inside-avoid">


        {/* HEADER */}
        <div className="flex justify-between items-start border-b pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-wide text-gray-900">NASIR BOOK AGENCY</h1>
            <div className="text-sm text-gray-500 mt-1">Sales Invoice</div>
            <div className="text-xs text-gray-600 mt-2 leading-relaxed space-y-1">
              <div>Dhakki Nalbandi, Qissa Khwani Bazar Peshawar</div>
              <div className="flex items-center gap-2">
                <span>📞</span>
                <span>091-2572277</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💬</span>
                <span>0302-8884377</span>
                
              </div>
              <div className="flex items-center gap-2">
                <span>💬</span>
                <span>0311-3888849</span>
                
              </div>
            </div>
          </div>

          <div className="text-right text-sm">
            <div className="font-semibold text-lg">
              Invoice #{sale?.id || "N/A"}
            </div>
            <div className="text-gray-500 mt-1">
              {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : ""}
            </div>
          </div>
        </div>

        {/* CUSTOMER */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-800 mt-4">
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
          <table className="w-full text-sm border-collapse mt-6">
            <thead className="bg-gray-50 border-y text-xs uppercase">
              <tr>
                <th className="py-3 text-left">#</th>
                <th className="py-3 text-left">Item</th>
                <th className="py-3 text-center">Qty</th>
                <th className="py-3 text-right">Unit Price</th>
                <th className="py-3 text-right">%</th>
                <th className="py-3 text-right">Disc Price</th>
                <th className="py-3 text-right">Total</th>
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
                    <td className="py-3">{idx + 1}</td>

                    <td className="py-3 font-medium">
                      <div>{name}</div>
                      {(publisher || edition) && (
                        <div className="text-xs text-gray-500">
                          {publisher ? publisher : ""}
                          {publisher && edition ? " • " : ""}
                          {edition ? `Edition: ${edition}` : ""}
                        </div>
                      )}
                    </td>

                    <td className="py-3 text-center">{qty}</td>

                    <td className="py-3 text-right">
                      Rs {price.toLocaleString()}
                    </td>

                    <td className="py-3 text-right">
                      {disc}%
                    </td>

                    <td className="py-3 text-right text-gray-700">
                      Rs {discounted.toLocaleString()}
                    </td>

                    <td className="py-3 text-right font-semibold">
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
          <table className="w-[320px] text-sm mt-4">
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

              {remaining > 0 && (
                <tr className="border-t">
                  <td className="py-2 font-bold text-red-600">Remaining</td>
                  <td className="py-2 text-right font-bold text-red-600">
                    Rs {remaining.toLocaleString()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-6 border-t text-xs text-gray-400">
          <div>Thank you for your business</div>
          <div>Nasir Book Agency</div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default Invoice;