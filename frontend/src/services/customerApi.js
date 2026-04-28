export const createCustomer = async (data) => {
    const res = await fetch("http://localhost:5001/api/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        city: data.city,
        balance: data.balance   // ✅ ADD THIS
      })
    });
  
    return res.json();
  };
  