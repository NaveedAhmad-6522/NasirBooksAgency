import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const style = document.createElement("style");
style.innerHTML = `
  @media print {
    body {
      background: white !important;
    }
    table {
      font-size: 12px;
    }
  }
`;
document.head.appendChild(style);

function Invoice({ cart = [], customer = null, paid = 0, mode }) {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (mode === "pos") return; // skip API in POS
    if (!id || id === "undefined") return; // prevent undefined

    fetch(`http://localhost:5001/api/sales/${id}`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error(err));
  }, [id, mode]);

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

  // 🔥 CALCULATIONS
  const previousBalance = Number(customer?.balance || data?.previous_balance || 0);
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
  const grandTotal = netTotal + previousBalance;

  const paidAmount = Number(sale.paid_amount || 0);
  const remaining = grandTotal - paidAmount;

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex justify-center print:bg-white print:p-0">
      <div className="bg-white w-[800px] rounded-xl shadow-lg p-6 space-y-6 print:w-full print:shadow-none print:rounded-none print:p-2">

        {/* HEADER */}
        <div className="flex justify-between items-start border-b pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-wide">NASIR BOOK AGENCY</h1>
            <div className="text-sm text-gray-500 mt-1">Sales Invoice</div>
            <div className="text-xs text-gray-600 mt-2 leading-relaxed">
              Dhakki Nalbandi, Peshawar<br/>
              Phone: 0300-0000000
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
            <div>Phone: {customer?.phone || "-"}</div>
            <div>City: {customer?.city || "-"}</div>
          </div>

          <div className="text-right">
            <div><span className="font-medium">Payment:</span> {sale.payment_method}</div>
          </div>
        </div>

        {/* ITEMS */}
        <div>
          <table className="w-full text-sm border-collapse mt-6">
            <thead className="bg-gray-50 border-y">
              <tr>
                <th className="py-3 text-left font-semibold">#</th>
                <th className="py-3 text-left font-semibold">Item</th>
                <th className="py-3 text-left font-semibold">Qty</th>
                <th className="py-3 text-left font-semibold">Price</th>
                <th className="py-3 text-left font-semibold">Total</th>
                <th className="py-3 text-left font-semibold">%</th>
                <th className="py-3 text-left font-semibold">Discount</th>
                <th className="py-3 text-left font-semibold">Amount</th>
              </tr>
            </thead>

            <tbody>
              {items.map((i, idx) => {
                const price = Number(i.current_price || i.printed_price || i.price || 0);
                const qty = Number(i.quantity || 0);
                const disc = parseFloat(i.discount || 0) || 0;

                const total = price * qty;
                const discountAmount = (total * disc) / 100;
                const final = total - discountAmount;

                return (
                  <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3">{idx + 1}</td>
                    <td className="py-3">{i.title}</td>
                    <td className="py-3 text-right">{qty}</td>
                    <td className="py-3 text-right">Rs {price.toFixed(2)}</td>
                    <td className="py-3 text-right">Rs {total.toFixed(2)}</td>
                    <td className="py-3 text-right">{disc}%</td>
                    <td className="py-3 text-right">Rs {discountAmount.toFixed(2)}</td>
                    <td className="py-3 text-right font-medium">Rs {final.toFixed(2)}</td>
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
              {previousBalance > 0 && (
                <tr>
                  <td className="py-1 text-gray-500">Previous Dues</td>
                  <td className="py-1 text-right">Rs {previousBalance.toFixed(2)}</td>
                </tr>
              )}

              <tr>
                <td className="py-1 text-gray-500">Subtotal</td>
                <td className="py-1 text-right">Rs {subtotal.toFixed(2)}</td>
              </tr>

              <tr>
                <td className="py-1 text-gray-500">Discount</td>
                <td className="py-1 text-right">- Rs {totalDiscount.toFixed(2)}</td>
              </tr>

              <tr className="border-t">
                <td className="py-2 font-semibold">Net Total</td>
                <td className="py-2 text-right font-semibold">Rs {netTotal.toFixed(2)}</td>
              </tr>

              {previousBalance > 0 && (
                <tr>
                  <td className="py-1 text-gray-500">Grand Total</td>
                  <td className="py-1 text-right font-semibold">Rs {grandTotal.toFixed(2)}</td>
                </tr>
              )}

              <tr>
                <td className="py-1 text-gray-500">Paid</td>
                <td className="py-1 text-right">Rs {paidAmount.toFixed(2)}</td>
              </tr>

              {remaining > 0 && (
                <tr className="border-t">
                  <td className="py-2 font-bold text-red-600">Remaining</td>
                  <td className="py-2 text-right font-bold text-red-600">
                    Rs {remaining.toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-6 border-t text-xs text-gray-500">
          <div>Thank you for your business</div>
          <div>Nasir Book Agency</div>
        </div>

      </div>
    </div>
  );
}

export default Invoice;