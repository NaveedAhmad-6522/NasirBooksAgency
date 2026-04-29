import { useState, useEffect } from "react";

export default function SupplierModal({ onClose, onSave, supplier }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
  });

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name || "",
        phone: supplier.phone || "",
        city: supplier.city || "",
      });
    }
  }, [supplier]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name) {
      alert("Supplier name is required");
      return;
    }

    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg space-y-4">

        <h2 className="text-lg font-semibold">
          {supplier ? "Edit Supplier" : "Add Supplier"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">

          <input
            name="name"
            placeholder="Supplier Name"
            value={form.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg"
          />

          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg"
          />

          <input
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg"
          />

          <div className="flex justify-end gap-2 pt-2">

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              {supplier ? "Update" : "Save"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}