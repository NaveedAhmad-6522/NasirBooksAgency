import { useEffect, useState } from "react";

function Header({
  customerQuery,
  setCustomerQuery,
  customers,
  setCustomers,
  setCustomer,
  searchCustomers,
  setShowCustomerModal,
  customer,
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedDate = time.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedTime = time.toLocaleTimeString();

  return (
    <div className="bg-white border-b p-4 space-y-4">

      {/* 🔹 TOP ROW */}
      <div className="flex items-center justify-between">

        {/* TITLE */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            📄
          </div>
          <div>
            <div className="font-semibold text-lg">POS - Billing</div>
            <div className="text-xs text-gray-500">
              Manage your sales
            </div>
          </div>
        </div>

        {/* DATE + TIME */}
        <div className="flex items-center gap-6">

          <div className="text-right">
            <div className="text-sm font-medium">{formattedDate}</div>
            <div className="text-xs text-gray-500">{formattedTime}</div>
          </div>

          {/* USER */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div>
              <div className="text-sm font-medium">Admin</div>
              <div className="text-xs text-gray-500">Cashier</div>
            </div>
          </div>

        </div>
      </div>

      {/* 🔹 SECOND ROW */}
      <div className="flex gap-4 items-center">

        {/* CUSTOMER SELECT */}
        <div className="flex-1 bg-gray-50 border rounded-lg p-3 flex items-center gap-3">

          <div className="bg-blue-100 p-2 rounded-full">👤</div>

          <div className="flex-1 relative">
            <input
              placeholder="Search customer by name or phone..."
              value={customerQuery}
              onChange={(e) => searchCustomers(e.target.value)}
              className="w-full bg-transparent outline-none text-sm"
            />

            {customers.length > 0 && (
              <div className="absolute bg-white border w-full mt-2 rounded-lg shadow max-h-40 overflow-y-auto z-50">
                {customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setCustomer(c);
                      setCustomerQuery(c.name);
                      setCustomers([]);
                    }}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {c.name} ({c.city || "No city"})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* NEW CUSTOMER BUTTON */}
        <button
          onClick={() => setShowCustomerModal(true)}
          className="border border-blue-500 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-50"
        >
          + New Customer
        </button>

        {/* CUSTOMER CARD */}
        <div className="bg-gray-50 border rounded-lg px-5 py-3 flex items-center gap-6 min-w-[320px]">

          {customer ? (
            <>
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>

              <div>
                <div className="font-semibold text-sm">
                  {customer.name}
                </div>
                <div className="text-xs text-gray-500">
                  {customer.city} • {customer.phone}
                </div>
              </div>

              <div className="ml-auto text-right">
                <div className="text-xs text-gray-500">
                  Previous Balance
                </div>
                <div className="text-red-500 font-bold">
                  Rs {customer.balance || 0}
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-400 text-sm">
              No Customer Selected
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Header;