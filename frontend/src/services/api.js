const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const authHeaders = (json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// GET ALL BOOKS
export const getBooks = async () => {
  const res = await fetch(`${BASE_URL}/books`, {
    headers: authHeaders(),
  });
  return res.json();
};

// SEARCH BOOKS
export const searchBooks = async (query) => {
  const res = await fetch(`${BASE_URL}/books/search?q=${query}`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const createSale = async (data) => {
    const res = await fetch(`${BASE_URL}/sales`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(data),
    });
  
    return res.json();
  };

  export const getSales = async () => {
    const res = await fetch(`${BASE_URL}/sales`, {
      headers: authHeaders(),
    });
    return res.json();
  };