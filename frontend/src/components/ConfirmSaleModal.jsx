import React, { useEffect } from "react";

const ConfirmSaleModal = ({
  show,
  onClose,
  onConfirm,
  customer,
  total,
  paid,
  loading = false,
}) => {
  const remaining = total - paid;

  // ✅ FIXED: Hook always runs
  useEffect(() => {
    if (!show) return;

    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") onConfirm();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [show, onClose, onConfirm]);

  // ✅ AFTER hooks
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[400px] shadow-xl">

        <h2 className="text-lg font-semibold mb-4">Confirm Sale</h2>

        <div className="mb-4">
          <div className="text-xs text-gray-400">Customer</div>
          <div className="font-medium">
            {customer?.name || "Walk-in"}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <Row label="Total" value={total} />
          <Row label="Paid" value={paid} />

          <div className="flex justify-between pt-2 border-t">
            <span>Remaining</span>
            <span className={remaining > 0 ? "text-red-500" : "text-green-600"}>
              Rs {remaining.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 rounded">
            Cancel
          </button>

          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? "Processing..." : "Confirm"}
          </button>
        </div>

      </div>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between">
    <span>{label}</span>
    <span>Rs {Number(value).toLocaleString()}</span>
  </div>
);

export default ConfirmSaleModal;