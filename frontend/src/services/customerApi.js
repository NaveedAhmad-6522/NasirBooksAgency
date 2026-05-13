const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const authHeaders = (json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const createCustomer = async (data) => {
    const res = await fetch(`${API_BASE}/customers`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        city: data.city,
        balance: data.balance   // ✅ ADD THIS
      })
    });
  
    return res.json();
  };