import { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

function AddBook({ existingBook, onSuccess, onCancel }) {
  const [book, setBook] = useState({
    title: existingBook?.title || "",
    publisher: existingBook?.publisher || "",
    category: existingBook?.category || "",
    edition: existingBook?.edition || "",
    printed_price: existingBook?.printed_price || "",
    purchase_price: existingBook?.purchase_price || "",
    stock: existingBook?.stock || "",
    level: existingBook?.level ?? "",
    supplier_id: existingBook?.supplier_id || "",
    percentage: existingBook?.percentage || "",
  });

  const [suppliers] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState(existingBook?.supplier_name || "");
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const cacheRef = useRef({});
  const controllerRef = useRef(null);
  const dropdownRef = useRef();

  useEffect(() => {
    if (!supplierSearch.trim()) {
      setFilteredSuppliers([]);
      return;
    }

    if (cacheRef.current[supplierSearch]) {
      setFilteredSuppliers(cacheRef.current[supplierSearch]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        if (controllerRef.current) controllerRef.current.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        const res = await fetch(
          `${API_BASE}/api/suppliers?search=${supplierSearch}&filter=active&limit=10`,
          {
            signal: controller.signal,
            headers: authHeaders(),
          }
        );

        const data = await res.json();
        const rows = data.data || data;

        cacheRef.current[supplierSearch] = rows;
        setFilteredSuppliers(rows);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Supplier search error", err);
        }
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [supplierSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...book, [name]: value };

    const printed = parseFloat(updated.printed_price);
    const purchase = parseFloat(updated.purchase_price);
    const percentage = parseFloat(updated.percentage);

    // If percentage changed → calculate purchase price
    if ((name === "percentage" || name === "printed_price") && printed) {
      if (!isNaN(percentage)) {
        const calcPurchase = printed * (1 - percentage / 100);
        updated.purchase_price = calcPurchase.toFixed(2);
      }
    }

    // If purchase price changed → calculate percentage
    if ((name === "purchase_price" || name === "printed_price") && printed) {
      if (!isNaN(purchase) && printed > 0) {
        const calcPercentage = (1 - purchase / printed) * 100;
        updated.percentage = calcPercentage.toFixed(2);
      }
    }

    console.log("LEVEL CHANGE:", name === "level" ? value : book.level);

    setBook(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log("BOOK STATE BEFORE SUBMIT:", book);

      if (!existingBook && !book.supplier_id) {
        alert("Please select a supplier");
        return;
      }

      const url = existingBook
        ? `${API_BASE}/api/books/${existingBook.id}`
        : `${API_BASE}/api/books/add`;

      const method = existingBook ? "PUT" : "POST";

      const payload = {
        ...book,
        printed_price: book.printed_price ? Number(book.printed_price) : null,
        purchase_price: book.purchase_price ? Number(book.purchase_price) : null,
        stock: book.stock ? Number(book.stock) : 0,
        supplier_id: book.supplier_id || null,
        percentage: book.percentage ? Number(book.percentage) : null,
        level: book.level?.trim() || null,
      };

      console.log("FINAL PAYLOAD:", payload);

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed");
      }

      alert(existingBook ? "Book Updated Successfully" : "Book Added Successfully");

      if (onSuccess) onSuccess();

      if (!existingBook) {
        setBook({
          title: "",
          publisher: "",
          category: "",
          edition: "",
          printed_price: "",
          purchase_price: "",
          stock: "",
          level: "",
          supplier_id: "",
          percentage: "",
        });
      }

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {existingBook ? "Edit Book" : "Add New Book"}
            </h2>
            <p className="text-xs text-gray-500">
              Manage your book details
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-700 text-lg"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Info</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input name="title" value={book.title} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none" required />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Publisher</label>
                <input name="publisher" value={book.publisher} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Category</label>
                <input name="category" value={book.category} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none" />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Edition</label>
                <input name="edition" value={book.edition} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none" />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Printed Price</label>
                <input type="number" name="printed_price" value={book.printed_price} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none" required />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Supplier</label>
                {existingBook ? (
                  <input
                    type="text"
                    value={supplierSearch || ""}
                    disabled
                    className="w-full border rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
                  />
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    <input
                      placeholder="Search supplier..."
                      value={supplierSearch}
                      onChange={(e) => {
                        setSupplierSearch(e.target.value);
                        setBook(prev => ({ ...prev, supplier_id: "" }));
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                    />

                    {showDropdown && supplierSearch && !book.supplier_id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute z-50 w-full bg-white border rounded-lg mt-1 max-h-40 overflow-y-auto shadow"
                      >
                        {filteredSuppliers.map(s => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setBook(prev => ({ ...prev, supplier_id: s.id }));
                              setSupplierSearch(s.name);
                              setFilteredSuppliers([]);
                              setShowDropdown(false);
                            }}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                          >
                            {s.name}
                          </div>
                        ))}

                        {filteredSuppliers.length === 0 && (
                          <div className="px-3 py-2 text-gray-400 text-sm">
                            No supplier found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Purchase Price</label>
                <input type="number" name="purchase_price" value={book.purchase_price} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none" required />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Percentage (%)</label>
                <input
                  type="number"
                  name="percentage"
                  value={book.percentage}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Stock</label>
                <input type="number" name="stock" value={book.stock} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none" />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Level (Class/Grade)
                </label>

                <select
                  name="level"
                  value={book.level || ""}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none bg-white"
                >
                  <option value="">Select Level</option>
                  <option value="Primary">Primary</option>
                  <option value="Middle">Middle</option>
                  <option value="Matric">Matric</option>
                  <option value="FSC">FSC</option>
                  <option value="BS">BS</option>
                  <option value="Quran">Quran</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-5 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
          >
            {existingBook ? "Update" : "Add Book"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddBook;