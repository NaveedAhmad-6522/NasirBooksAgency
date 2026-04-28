const BASE_URL = "http://localhost:5001/api";

// GET ALL BOOKS
export const getBooks = async () => {
  const res = await fetch(`${BASE_URL}/books`);
  return res.json();
};

// SEARCH BOOKS
export const searchBooks = async (query) => {
  const res = await fetch(`${BASE_URL}/books/search?q=${query}`);
  return res.json();
};

export const createSale = async (data) => {
    const res = await fetch("http://localhost:5001/api/sales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  
    return res.json();
  };

  export const getSales = async () => {
    const res = await fetch("http://localhost:5001/api/sales");
    return res.json();
  };