import { useEffect, useState } from "react";
import BooksHeader from "../components/BooksHeader";
import BooksTable from "../components/BooksTable";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import AddBook from "../components/AddBook";

function Books() {
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [filterStatus, setFilterStatus] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [restockBook, setRestockBook] = useState(null);

const [restockData, setRestockData] = useState({
  supplier_id: "",
  quantity: "",
  purchase_price: "",
  percentage: "",
  printed_price: "",
});
  const [itemsPerPage, setItemsPerPage] = useState(6);
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, itemsPerPage]);

  useEffect(() => {
    const calculateItems = () => {
      // approximate available height for table rows
      const viewportHeight = window.innerHeight;

      // subtract header, filter, pagination, padding (~300px safe estimate)
      const availableHeight = viewportHeight - 300;

      // approximate single row height (~70px based on your UI)
      const rowHeight = 70;

      const items = Math.floor(availableHeight / rowHeight);

      return Math.max(4, items); // minimum 4 rows
    };

    const update = () => setItemsPerPage(calculateItems());

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:5001/api/books?status=${filterStatus}&page=${currentPage}&limit=${itemsPerPage}&search=${search}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to fetch books");
      }

      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("FETCH BOOKS ERROR:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchBooks();
    }, 300);

    return () => clearTimeout(delay);
  }, [filterStatus, currentPage, itemsPerPage, search]);

  const handleAddBook = () => {
    setSelectedBook(null);
    setShowAddModal(true);
  };

  const handleEdit = (book) => {
    setSelectedBook(book);
    setShowAddModal(true);
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await fetch(`http://localhost:5001/api/books/toggle/${id}`, {
        method: "PUT",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update status");
      }
      await fetchBooks();
    } catch (err) {
      console.error("TOGGLE ERROR:", err);
    }
  };

  const handleExport = () => {
    if (!books || books.length === 0) {
      alert("No data to export");
      return;
    }

    const rows = books.map((b) => ({
      id: b.id,
      title: b.title,
      category: b.category || "",
      price: b.current_price,
      stock: b.stock,
      status: b.is_active ? "Active" : "Hidden",
    }));

    const headers = ["id", "title", "category", "price", "stock", "status"];
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => r[h]).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "books.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredBooks = books;

  const totalPages = currentPage + (books.length === itemsPerPage ? 1 : 0);

  const paginatedBooks = filteredBooks;

  
  const submitRestock = async () => {
    try {
      const res = await fetch(
        `http://localhost:5001/api/books/${restockBook.id}/restock`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(restockData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Restock failed");
      }

      setRestockBook(null);
      fetchBooks();
    } catch (err) {
      console.error("RESTOCK ERROR:", err);
      alert(err.message);
    }
  };

  const handleRestockChange = (e) => {
    const { name, value } = e.target;

    let updated = { ...restockData, [name]: value };

    const printed = Number(updated.printed_price || restockBook?.printed_price || 0);
    const purchase = Number(updated.purchase_price);
    const percentage = Number(updated.percentage);

    if (name === "percentage" && printed) {
      const calcPurchase = printed * (1 - percentage / 100);
      updated.purchase_price = calcPurchase.toFixed(2);
    }

    if (name === "purchase_price" && printed) {
      const calcPercentage = (1 - purchase / printed) * 100;
      updated.percentage = calcPercentage.toFixed(2);
    }

    if (name === "printed_price") {
      const newPrinted = Number(value);
      const purchaseVal = Number(updated.purchase_price);

      if (purchaseVal && newPrinted) {
        const calcPercentage = (1 - purchaseVal / newPrinted) * 100;
        updated.percentage = calcPercentage.toFixed(2);
      }
    }

    setRestockData(updated);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <div className="p-6">
          <BooksHeader
            search={search}
            setSearch={setSearch}
            onAddBook={handleAddBook}
            onExport={handleExport}
          />

          <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Filter</span>

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-3 py-1 text-sm rounded-md transition ${
                    filterStatus === "all"
                      ? "bg-white shadow text-black"
                      : "text-gray-500"
                  }`}
                >
                  All
                </button>

                <button
                  onClick={() => setFilterStatus("active")}
                  className={`px-3 py-1 text-sm rounded-md transition ${
                    filterStatus === "active"
                      ? "bg-white shadow text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  Active
                </button>

                <button
                  onClick={() => setFilterStatus("hidden")}
                  className={`px-3 py-1 text-sm rounded-md transition ${
                    filterStatus === "hidden"
                      ? "bg-white shadow text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  Hidden
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Total: {books.length}
            </div>
          </div>

          {loading ? (
            <div className="text-center p-6">Loading...</div>
          ) : (
            <>
              <BooksTable
                books={paginatedBooks}
                onToggleStatus={handleToggleStatus}
                onEdit={handleEdit}
                onRestock={(book) => {
                  setRestockBook(book);
                  setRestockData({
                    supplier_id: book.supplier_id || "",
                    quantity: "",
                    purchase_price: book.purchase_price || "",
                    percentage: book.percentage || "",
                    printed_price: book.printed_price || "",
                  });
                }}
              />

              <div className="flex justify-between items-center mt-4">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Prev
                </button>

                <span className="text-sm">
                  Page {currentPage} of {totalPages || 1}
                </span>

                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        {showAddModal && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowAddModal(false);
              setSelectedBook(null);
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >

              <AddBook
                existingBook={selectedBook}
                onCancel={() => {
                  setShowAddModal(false);
                  setSelectedBook(null);
                }}
                onSuccess={() => {
                  setShowAddModal(false);
                  setSelectedBook(null);
                  fetchBooks();
                }}
              />
            </div>
          </div>
        )}

        {restockBook && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-[400px] space-y-4 shadow-lg">

              <h2 className="text-lg font-semibold">
                Restock: {restockBook.title}
              </h2>

              {/* Supplier */}
              <input
                type="text"
                value={restockBook?.supplier_name || restockBook?.supplier || restockBook?.publisher || `Supplier #${restockData.supplier_id}`}
                disabled
                className="w-full border p-2 rounded bg-gray-100 cursor-not-allowed"
              />

              {/* Quantity */}
              <input
                type="number"
                placeholder="Quantity"
                value={restockData.quantity}
                name="quantity"
                onChange={handleRestockChange}
                className="w-full border p-2 rounded"
              />

              {/* Printed Price */}
              <input
                type="number"
                placeholder="Printed Price"
                value={restockData.printed_price}
                name="printed_price"
                onChange={handleRestockChange}
                className="w-full border p-2 rounded"
              />

              {/* Purchase Price */}
              <input
                type="number"
                placeholder="Purchase Price"
                value={restockData.purchase_price}
                name="purchase_price"
                onChange={handleRestockChange}
                className="w-full border p-2 rounded"
              />

              {/* Percentage */}
              <input
                type="number"
                placeholder="Percentage"
                value={restockData.percentage}
                name="percentage"
                onChange={handleRestockChange}
                className="w-full border p-2 rounded"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setRestockBook(null)}
                  className="px-3 py-1 bg-gray-200 rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={submitRestock}
                  className="px-3 py-1 bg-black text-white rounded"
                >
                  Save
                </button>
              </div>

            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}

export default Books;