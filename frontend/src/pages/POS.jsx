import { useEffect, useState, useRef } from "react";
import { getBooks, createSale } from "../services/api";
import { createCustomer } from "../services/customerApi";
import { getCustomerDiscount } from "../services/discountApi";

import ConfirmSaleModal from "../components/ConfirmSaleModal";
import Invoice from "../components/Invoice";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import BookGrid from "../components/BookGrid";
import Filters from "../components/Filters";
import Cart from "../components/Cart";
import CustomerModal from "../components/CustomerModal";

const API_BASE = import.meta.env.VITE_API_URL;

const authHeaders = (json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

function POS() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [paid, setPaid] = useState(0);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customer, setCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [toast, setToast] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    city: "",
    balance: 0
  });
  const [showInvoice, setShowInvoice] = useState(false);

  const [category, setCategory] = useState("All");

  const [invoiceData, setInvoiceData] = useState(null);

  const searchRef = useRef(null);
  const customerSearchTimeout = useRef(null);

  // PRINT CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-area, .print-area * {
          visibility: visible;
        }
        .print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0;
          padding: 0;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    loadBooks();

    const handleKey = (e) => {
      if (e.key === "F9") handleCheckout();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);
  useEffect(() => {
    if (!toast) return;
  
    const timer = setTimeout(() => {
      setToast("");
    }, 2000);
  
    return () => clearTimeout(timer);
  }, [toast]);
  const loadBooks = async () => {
    try {
      const data = await getBooks({ limit: 20 });

      const activeBooks = (data || []).filter(
        (b) => Number(b.is_active ?? 1) === 1
      );

      setBooks(activeBooks);
    } catch (err) {
      console.error("LOAD BOOKS ERROR:", err);
    }
  };

  const searchTimeout = useRef(null);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        if (!value) {
          // 🔥 load limited books instead of all
          const data = await getBooks({ limit: 20 });
          const activeBooks = (data || []).filter(
            (b) => Number(b.is_active ?? 1) === 1
          );
          setBooks(activeBooks);
          return;
        }

        // 🔥 backend search (title + publisher)
        const res = await fetch(
          `${API_BASE}/api/books?search=${value}&limit=20`,
          {
            headers: authHeaders(),
          }
        );

        const data = await res.json();

        const activeBooks = (data || []).filter(
          (b) => Number(b.is_active ?? 1) === 1
        );

        setBooks(activeBooks);
      } catch (err) {
        console.error("POS SEARCH ERROR:", err);
      }
    }, 300);
  };

  const searchCustomers = (value) => {
    setCustomerQuery(value);

    // clear previous timer
    if (customerSearchTimeout.current) {
      clearTimeout(customerSearchTimeout.current);
    }

    // debounce API call
    customerSearchTimeout.current = setTimeout(async () => {
      if (!value) {
        setCustomers([]);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/api/customers?q=${value}`,
          {
            headers: authHeaders(),
          }
        );

        const data = await res.json();

        setCustomers(Array.isArray(data) ? data : data.data || []);
        console.log("CUSTOMERS API:", data);
      } catch (err) {
        console.error("Customer search error:", err);
      }
    }, 300);
  };
  const addToCart = async (book) => {
    const existing = cart.find((i) => i.id === book.id);
    const debugCustomerId = customer?.id || null;
    console.log("Sending:", debugCustomerId, book.id);
    if (existing) {
      const newQty = existing.quantity + 1;

      if (newQty > Number(book.stock || 0)) {
        setToast(`Stock limit reached (${book.stock})`);
        return;
      }

      setCart(
        cart.map((i) =>
          i.id === book.id
            ? { ...i, quantity: newQty }
            : i
        )
      );
      return;
    }

    let discount = 0;

    if (customer?.id) {
      try {
        const res = await getCustomerDiscount(customer.id, book.id);

        console.log("DISCOUNT API:", res);

        // ✅ FIXED (clean)
        discount = Number(res?.[0]?.discount || 0);

      } catch (err) {
        console.error("Discount fetch error:", err);
      }
    }

    if (Number(book.stock || 0) < 1) {
      setToast("Out of stock");
      return;
    }

    setCart([
      ...cart,
      {
        ...book,
        quantity: 1,
        discount: discount,
      },
    ]);
  };
  const subtotal = cart.reduce(
    (sum, i) => sum + Number(i.current_price) * Number(i.quantity),
    0
  );

  const discount = cart.reduce(
    (sum, i) =>
      sum +
      ((Number(i.current_price) * Number(i.discount)) / 100) *
      Number(i.quantity),
    0
  );
  //printing bill
  // ❌ Deprecated: replaced by invoice page route
  // Removed openInvoicePreview function as per instructions

  const total = subtotal - discount;

  // ✅ SAVE CUSTOMER
  const handleSaveCustomer = async () => {
    try {
      const data = await createCustomer(newCustomer);

      setCustomer(data);

      setNewCustomer({
        name: "",
        phone: "",
        city: "",
        balance: 0
      });

      setShowCustomerModal(false);

    } catch (err) {
      console.error(err);
      alert("Error saving customer");
    }
  };

  // ✅ CHECKOUT
  // ✅ CHECKOUT (UPDATED WITH WALK-IN SUPPORT)
  const handleCheckout = () => {
    if (cart.length === 0) {
      setToast("Cart is empty");
      return;
    }
    // ✅ ONLY OPEN MODAL
    setShowConfirm(true);
  };

  // confirming 
  const confirmCheckout = async () => {
    setShowConfirm(false);
  
    const items = cart.map((i) => ({
      book_id: i.id,
      quantity: i.quantity,
      printed_price: i.current_price,
      discount: i.discount,
    }));
  
    const finalPaid = Number(paid || 0);
  
    try {
      const finalCustomerId = customer?.id ?? null;

      const res = await createSale({
        customer_id: finalCustomerId,
        items,
        payment_method: "cash",
        paid: finalPaid,
      });
  
      if (customer) {
        setCustomer((prev) => ({
          ...prev,
          balance: Number(res.newBalance),
        }));
      }
  
      setBooks((prevBooks) =>
        prevBooks.map((b) => {
          const soldItem = items.find((i) => i.book_id === b.id);
          if (!soldItem) return b;
  
          return {
            ...b,
            stock: Math.max(0, Number(b.stock) - Number(soldItem.quantity)),
          };
        })
      );
  
      // ✅ Save snapshot BEFORE clearing
      setInvoiceData({ cart, customer, paid });

      setShowInvoice(true);
      setToast("Sale Completed!");
  
      // clear POS after showing invoice
      setCart([]);
      setPaid(0);
      setCustomer(null);
      setCustomerQuery("");
      setCustomers([]);
  
    } catch (err) {
      console.error(err);
      setToast("Error saving sale ");
    }
  };
  // 🔥 UPDATE DISCOUNT WHEN CUSTOMER CHANGES
  useEffect(() => {
    if (!customer?.id || cart.length === 0) return;
  
    const updateDiscounts = async () => {
      try {
        const updatedCart = await Promise.all(
          cart.map(async (item) => {
            const res = await getCustomerDiscount(customer.id, item.id);
  
            return {
              ...item,
              discount: Number(res?.[0]?.discount || 0), // ✅ FIXED
            };
          })
        );
  
        setCart(updatedCart);
      } catch (err) {
        console.error("Discount update error:", err);
      }
    };
  
    updateDiscounts();
  }, [customer]);
  // Prevent manual quantity overflow in Cart
  const updateQuantity = (id, qty, stock) => {
    if (qty > stock) {
      setToast(`Only ${stock} in stock`);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: qty } : item
      )
    );
  };
  return (
    <div className="h-screen flex bg-gray-100 text-sm">

      <Sidebar />

      <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">

        {/* HEADER */}
        <Header
          customerQuery={customerQuery}
          setCustomerQuery={setCustomerQuery}
          customers={customers}
          setCustomers={setCustomers}
          setCustomer={setCustomer}
          searchCustomers={searchCustomers}
          setShowCustomerModal={setShowCustomerModal}
          customer={customer}
        />

        {/* FILTER */}
        <Filters category={category} setCategory={setCategory} />

        {/* CONTENT */}
        <div className="flex flex-1 gap-3 overflow-hidden">

          {/* LEFT */}
          <div className="flex-[2.3] flex flex-col gap-3 overflow-hidden">

            <div className="bg-white rounded-xl shadow-sm p-3">
              <input
                type="text"
                placeholder="Search book..."
                value={query}
                onChange={handleSearch}
                className="w-full bg-gray-100 rounded-lg px-3 py-2 outline-none"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm flex-1 overflow-y-auto">
              <BookGrid
                books={books}
                category={category}
                addToCart={addToCart}
              />
            </div>

            <Footer />
          </div>

          {/* RIGHT */}
          <Cart
            cart={cart}
            setCart={setCart}
            updateQuantity={updateQuantity}
            subtotal={subtotal}
            discount={discount}
            total={total}
            handleCheckout={handleCheckout}
            paid={paid}
            setPaid={setPaid}
            customer={customer}
            className="flex-[1.7] h-full overflow-hidden"
          />

        </div>

      </div>

      {/* MODAL */}
      <CustomerModal
        show={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSave={handleSaveCustomer}
        newCustomer={newCustomer}
        setNewCustomer={setNewCustomer}
      />
      <ConfirmSaleModal
        show={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmCheckout}
        customer={customer}
        total={total}
        paid={paid}
      />
      {toast && (
        <div className="fixed bottom-5 right-5 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
      {/* Hidden Invoice for printing (POS mode) */}
      {/* Removed hidden print-area block as per instructions */}

      {showInvoice && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-start overflow-auto print:bg-white">
          <div className="relative bg-white mt-10 p-6 rounded-xl shadow-lg w-[800px] print:w-full print:shadow-none print:rounded-none print:mt-0 print:p-0">

            <button
              onClick={() => setShowInvoice(false)}
              className="absolute top-3 right-3 no-print w-9 h-9 rounded-full bg-gray-100 hover:bg-red-500 hover:text-white transition flex items-center justify-center text-lg font-bold"
            >
              ×
            </button>

            <div className="print-area">
              <Invoice
                cart={invoiceData?.cart || []}
                customer={invoiceData?.customer || null}
                paid={invoiceData?.paid || 0}
                mode="pos"
              />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default POS;