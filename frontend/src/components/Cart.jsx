import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { saveCustomerDiscount } from "../services/discountApi";
function Cart({
  cart,
  setCart,
  subtotal,
  discount,
  total,
  handleCheckout,
  paid,
  setPaid,
  customer,
  className = ""
}) {

  const [tempPaid, setTempPaid] = useState(paid);

  useEffect(() => {
    setTempPaid(paid);
  }, [paid]);

  const format = (num) =>
    Number(num || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
    });

  // ✅ SAFE CALCULATIONS
  const previousBalance = Number(customer?.balance) || 0;
  const billRemaining = Number(total) - Number(paid || 0);
  const finalBalance = previousBalance + billRemaining;
  const handleDiscountChange = async (item, value) => {
    const newDiscount = value === "" ? "" : Number(value);
  
    // ✅ Update UI instantly
    setCart(cart.map(c =>
      c.id === item.id
        ? { ...c, discount: newDiscount }
        : c
    ));
  
    // ❌ Don't save empty
    if (newDiscount === "") return;
  
    // ✅ Save to DB
    if (customer?.id) {
      try {
        await saveCustomerDiscount(customer.id, item.id, newDiscount);
        console.log("Discount saved ✅");
      } catch (err) {
        console.error("Save error:", err);
      }
    }
  };
  return (
    <div className={`h-full overflow-y-auto bg-white rounded-xl shadow-sm print:overflow-visible print:h-auto print:break-inside-avoid print:shadow-none print:rounded-none print:m-0 print:p-0 ${className}`}>

      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white border-b">

        <div className="px-5 py-3 flex justify-between items-center">
          <h2 className="text-[15px] font-semibold text-gray-800">
            Cart ({cart.length})
          </h2>

          <button
            onClick={() => setCart([])}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Clear
          </button>
        </div>

        <div className="grid grid-cols-[1.8fr_1fr_1fr_1fr_1fr_0.6fr] px-5 py-2 text-[11px] text-gray-400 bg-gray-50 border-t">
          <div>Book</div>
          <div className="text-center">Quantity</div>
          <div className="text-center">Price</div>
          <div className="text-center">Disc%</div>
          <div className="text-right">Total</div>
          <div></div>
        </div>

      </div>

      {/* EMPTY */}
      {cart.length === 0 && (
        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
          No items in cart
        </div>
      )}

      {/* ITEMS */}
      {cart.map((i) => {

        const price = Number(i.current_price) || 0;
        const qty = Number(i.quantity) || 0;
        const disc = Number(i.discount) || 0;

        const itemTotal = price * qty;
        const discountAmount = (itemTotal * disc) / 100;
        const final = itemTotal - discountAmount;

        return (
          <div
            key={i.id}
            className="grid grid-cols-[1.8fr_1fr_1fr_1fr_1fr_0.6fr] items-center px-5 py-2 border-b hover:bg-gray-50 print:break-inside-avoid"
          >

            {/* BOOK */}
            <div className="min-w-0">
              <div className="text-[13px] text-gray-700 truncate">
                {i.title}
              </div>

              <div className="flex items-center gap-2 mt-[2px] flex-wrap">
                
                {/* Publisher */}
                <span className="px-2 py-[2px] text-[10px] rounded-md bg-gray-100 text-gray-600 font-medium">
                  {i.publisher}
                </span>

                {/* Edition / Level */}
                {i.level && (
                  <span className="px-2 py-[2px] text-[10px] rounded-md bg-blue-50 text-blue-600 font-medium">
                    {i.level}
                  </span>
                )}

                {/* Discount indicator */}
                {i.discount > 0 && (
                  <span className="px-2 py-[2px] text-[10px] rounded-md bg-green-50 text-green-600 font-medium">
                    Discount
                  </span>
                )}

              </div>
            </div>

            {/* QTY */}
            <div className="flex justify-center items-center">
  <input
    type="number"
    value={i.quantity}
    onChange={(e) => {
      const value = e.target.value === "" ? "" : Number(e.target.value);

      // allow empty temporarily
      if (value === "") {
        setCart(cart.map(c =>
          c.id === i.id ? { ...c, quantity: "" } : c
        ));
        return;
      }

      const stock = Number(i.stock || 0);

      if (value > stock) {
        alert(`Only ${stock} in stock`);
        return;
      }

      setCart(cart.map(c =>
        c.id === i.id
          ? { ...c, quantity: value }
          : c
      ));
    }}
    onBlur={() => {
      const stock = Number(i.stock || 0);

      setCart(cart.map(c => {
        if (c.id !== i.id) return c;

        let qty = c.quantity === "" ? 1 : Number(c.quantity);

        if (qty > stock) {
          alert(`Only ${stock} in stock`);
          qty = stock;
        }

        return { ...c, quantity: qty };
      }));
    }}
    className="w-16 border rounded-lg text-center text-[13px] py-1 focus:ring-2 focus:ring-blue-500 outline-none"
  />
</div>

            {/* PRICE */}
            <div className="text-center text-[12px] font-medium text-gray-800">
              {format(price)}
            </div>

            {/* DISCOUNT */}
            <div className="text-center">
              <input
                type="number"
                value={i.discount === 0 ? "" : i.discount}
                onChange={(e) => {
                  const val = e.target.value;
                  handleDiscountChange(i, val === "" ? "" : Number(val));
                }}
                onBlur={() =>
                  setCart(cart.map(c =>
                    c.id === i.id
                      ? {
                        ...c,
                        discount: c.discount === "" ? 0 : c.discount
                      }
                      : c
                  ))
                }
                className="w-12 border rounded text-center text-[12px]"
              />
            </div>

            {/* TOTAL */}
            <div className="text-right text-[13px] font-semibold text-gray-900">
              {format(final)}
            </div>

            {/* DELETE */}
            <div className="flex justify-end">
              <button
                onClick={() =>
                  setCart(cart.filter(c => c.id !== i.id))
                }
                className="p-1 rounded hover:bg-red-100 text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>

          </div>
        );
      })}

      {/* SUMMARY */}
      <div className="p-5 border-t bg-gradient-to-b from-white to-gray-50 space-y-4 rounded-b-xl print:break-inside-avoid print:pb-0">

        <div className="flex justify-between text-[13px] text-gray-500">
          <span>Sub Total</span>
          <span className="font-medium text-gray-800">{format(subtotal)}</span>
        </div>

        <div className="flex justify-between text-[13px] text-amber-500">
          <span>Discount Applied</span>
          <span className="font-medium text-amber-600">- {format(discount)}</span>
        </div>

        <div className="border-t"></div>

        <div className="flex justify-between text-[13px] text-gray-500">
          <span>Bill Total</span>
          <span className="font-medium text-gray-700">{format(billRemaining)}</span>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-gray-600">Amount Received</span>
            <input
              type="number"
              value={tempPaid === 0 ? "" : tempPaid}
              onChange={(e) => {
                const val = e.target.value;
                setTempPaid(val === "" ? "" : Number(val));
              }}
              onBlur={() => {
                const finalVal = tempPaid === "" ? 0 : Number(tempPaid);
                setPaid(finalVal);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const finalVal = tempPaid === "" ? 0 : Number(tempPaid);
                  setPaid(finalVal);
                  e.currentTarget.blur();
                }
              }}
              className="w-28 border rounded-lg px-3 py-2 text-right text-[14px] font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex justify-between text-[13px] text-gray-600">
            <span>Outstanding Balance</span>
            <span>{format(previousBalance)}</span>
          </div>
          <div className="flex justify-between text-[13px] text-gray-500">
            <span>Remaining</span>
            <span className="font-medium text-gray-700">{format(billRemaining)}</span>
          </div>
        </div>

        <div className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <span className="text-[14px] font-semibold text-gray-700">Final Payable</span>
          <span className="text-[18px] font-bold text-gray-900">
            {format(finalBalance)}
          </span>
        </div>

        <button
          onClick={() =>
            handleCheckout({
              paid: Number(paid || 0),
              subtotal: Number(subtotal || 0),
              discount: Number(discount || 0),
              total: Number(total || 0),
            })
          }
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl mt-2 text-[14px] font-semibold shadow-md hover:shadow-lg transition"
        >
          COMPLETE SALE
        </button>

      </div>

      <div className="hidden print:block print:h-0"></div>

    </div>
  );
}

export default Cart;