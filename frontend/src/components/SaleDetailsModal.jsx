function SaleDetailsModal({ show, onClose, data }) {
    if (!show || !data) return null;
  
    const { sale, items } = data;
  
    return (
      <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
        <div className="bg-white w-[700px] rounded-xl p-6 space-y-4">
  
          <h2 className="text-xl font-bold">
            Sale #{sale.id}
          </h2>
  
          <div className="text-sm text-gray-500">
            {new Date(sale.created_at).toLocaleString()}
          </div>
  
          {/* ITEMS */}
          <div className="border rounded-lg overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Book</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-right">Discount</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
  
              <tbody>
                {items.map((i, idx) => {
                  const total =
                    i.price * i.quantity -
                    (i.price * i.quantity * i.discount) / 100;
  
                  return (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{i.title}</td>
                      <td className="p-2 text-right">{i.quantity}</td>
                      <td className="p-2 text-right">Rs {i.price}</td>
                      <td className="p-2 text-right">{i.discount}%</td>
                      <td className="p-2 text-right font-semibold">
                        Rs {total.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
  
          {/* TOTALS */}
          <div className="text-right space-y-1 mt-4">
            <div>Total: Rs {sale.total_amount}</div>
            <div className="text-green-600">
              Paid: Rs {sale.paid_amount}
            </div>
  
            {sale.remaining > 0 && (
              <div className="text-red-500">
                Remaining: Rs {sale.remaining}
              </div>
            )}
          </div>
  
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Close
            </button>
          </div>
  
        </div>
      </div>
    );
  }
  
  export default SaleDetailsModal;