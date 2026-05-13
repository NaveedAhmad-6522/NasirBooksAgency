const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const authHeaders = (json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const getCustomerDiscount = async (customer_id, book_id) => {
    const res = await fetch(
      `${API_BASE}/discount?customer_id=${customer_id}&book_id=${book_id}`,
      {
        headers: authHeaders(),
      }
    );
    return res.json();
  };
  
  export const saveCustomerDiscount = async (customer_id, book_id, discount) => {
    const res = await fetch(`${API_BASE}/discount`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({
        customer_id,
        book_id,
        discount,
      }),
    });
  
    return res.json();
  };