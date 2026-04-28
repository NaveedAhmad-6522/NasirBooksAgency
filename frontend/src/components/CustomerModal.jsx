import { useEffect, useRef } from "react";

function CustomerModal({
  show,
  onClose,
  onSave,
  newCustomer,
  setNewCustomer
}) {
  const nameRef = useRef(null);

  // 🔥 Auto focus
  useEffect(() => {
    if (show) {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">

      {/* MODAL */}
      <div className="bg-white w-[400px] rounded-2xl shadow-2xl p-6 space-y-5 animate-[fadeIn_.2s_ease]">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Add Customer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* FORM */}
        <div className="space-y-4">

          {/* NAME */}
          <div>
            <label className="text-xs text-gray-500">Customer Name</label>
            <input
              ref={nameRef}
              placeholder="Enter full name"
              value={newCustomer.name}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, name: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* PHONE */}
          <div>
            <label className="text-xs text-gray-500">Phone Number</label>
            <input
              placeholder="03xx-xxxxxxx"
              value={newCustomer.phone}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, phone: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* CITY */}
          <div>
            <label className="text-xs text-gray-500">City</label>
            <input
              placeholder="e.g. Lahore"
              value={newCustomer.city}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, city: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* BALANCE */}
          <div>
            <label className="text-xs text-gray-500">
            Opening Dues
            </label>

            <div className="flex items-center border rounded-lg mt-1 overflow-hidden">
              <span className="px-3 text-gray-500 text-sm">Rs</span>

              <input
                type="number"
                placeholder="0"
                value={newCustomer.balance === 0 ? "" : newCustomer.balance}
                onChange={(e) =>
                  setNewCustomer({
                    ...newCustomer,
                    balance: e.target.value === "" ? 0 : Number(e.target.value)
                  })
                }
                className="w-full px-2 py-2 outline-none"
              />

              {/* DR / CR INDICATOR */}
              {newCustomer.balance !== 0 && (
                <span
                  className={`px-3 text-xs font-semibold ${
                    newCustomer.balance > 0
                      ? "text-red-500"
                      : "text-green-600"
                  }`}
                >
                  {newCustomer.balance > 0 ? "DR" : "CR"}
                </span>
              )}
            </div>
          </div>

        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 pt-2">

          <button
            onClick={onClose}
            className="flex-1 border py-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 shadow"
          >
            Save Customer
          </button>

        </div>

      </div>
    </div>
  );
}

export default CustomerModal;