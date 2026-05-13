import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL;

const authHeaders = (json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export default function SupplierReturn({ supplier, supplier_id, onClose, onSuccess }) {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  // fetch books (only active + in stock)
  useEffect(() => {
    if (!supplier_id) return;

    fetch(`${API_BASE}/api/suppliers/${supplier_id}/books`, {
      headers: authHeaders(),
    })
      .then(res => res.json())
      .then(data => setBooks(data.data || data))
      .catch(err => console.error("Supplier books fetch error", err));
  }, [supplier_id]);

  const filtered = books.filter(b =>
    (b.title || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedBook) {
      alert("Select a book");
      return;
    }

    const qty = Number(quantity);

    if (!qty || qty <= 0) {
      alert("Enter valid quantity");
      return;
    }

    if (qty > selectedBook.stock) {
      alert(`Only ${selectedBook.stock} in stock`);
      return;
    }

    const res = await fetch(`${API_BASE}/api/suppliers/return`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({
        supplier_id,
        book_id: selectedBook.id,
        quantity: qty,
        purchase_price: selectedBook.purchase_price,
        printed_price: selectedBook.printed_price,
        note,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Return failed");
      return;
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md border">

        <h2 className="text-lg font-semibold mb-4 text-red-600">Return to Supplier</h2>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
          <p className="text-xs text-gray-500">Supplier</p>
          <p className="font-semibold text-sm">{supplier?.name}</p>
        </div>

        {/* Search Book */}
        <input
          placeholder="Search book..."
          className="w-full border px-3 py-2 rounded mb-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Dropdown */}
        {search && !selectedBook && (
          <div className="border rounded max-h-40 overflow-y-auto mb-3">
            {filtered.map(b => (
              <div
                key={b.id}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => setSelectedBook(b)}
              >
                {b.title} (Stock: {b.stock})
              </div>
            ))}
          </div>
        )}

        {/* Selected Book */}
        {selectedBook && (
          <div className="mb-3 p-2 border rounded bg-gray-50">
            <p className="text-sm font-medium">{selectedBook.title}</p>
            <p className="text-xs text-gray-500">Stock: {selectedBook.stock}</p>
            <button
              className="text-xs text-red-500"
              onClick={() => setSelectedBook(null)}
            >
              Change
            </button>
          </div>
        )}

        {/* Quantity */}
        <input
          placeholder="Quantity"
          type="number"
          className="w-full border px-3 py-2 rounded mb-3"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />

        {/* Note */}
        <input
          placeholder="Reason / Note"
          className="w-full border px-3 py-2 rounded mb-3"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancel</button>

          <button
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={handleSubmit}
          >
            Save Return
          </button>
        </div>

      </div>
    </div>
  );
}