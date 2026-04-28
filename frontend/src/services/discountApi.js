export const getCustomerDiscount = async (customer_id, book_id) => {
    const res = await fetch(
      `http://localhost:5001/api/discount?customer_id=${customer_id}&book_id=${book_id}`
    );
    return res.json();
  };
  
  export const saveCustomerDiscount = async (customer_id, book_id, discount) => {
    const res = await fetch("http://localhost:5001/api/discount", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_id,
        book_id,
        discount,
      }),
    });
  
    return res.json();
  };