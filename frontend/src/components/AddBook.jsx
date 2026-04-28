import { useState, useEffect } from "react";

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

  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5001/api/suppliers")
      .then(res => res.json())
      .then(data => setSuppliers(Array.isArray(data) ? data : data?.data || []))
      .catch(err => console.error("Supplier fetch error", err));
  }, []);

  useEffect(() => {
    if (existingBook?.id) {
      fetch(`http://localhost:5001/api/books/${existingBook.id}`)
        .then(res => res.json())
        .then(data => {
          setBook({
            title: data.title || "",
            publisher: data.publisher || "",
            category: data.category || "",
            edition: data.edition || "",
            printed_price: data.printed_price || "",
            purchase_price: data.purchase_price || "",
            stock: data.stock || "",
            level: data.level ?? "",
            supplier_id: data.supplier_id || "",
            percentage: data.percentage || "",
          });
        })
        .catch(err => console.error("Fetch book for edit error", err));
    }
  }, [existingBook]);

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

      const url = existingBook
        ? `http://localhost:5001/api/books/${existingBook.id}`
        : "http://localhost:5001/api/books/add";

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
        headers: { "Content-Type": "application/json" },
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
                <select
                  name="supplier_id"
                  value={book.supplier_id}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                  required
                >
                  <option value="">Select Supplier</option>
                  {(Array.isArray(suppliers) ? suppliers : []).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
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
                <label className="block text-xs text-gray-500 mb-1">Level (Class/Grade)</label>
                <input name="level" value={book.level || ""} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none" />
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