function BookGrid({ books = [], category, addToCart }) {

  const filteredBooks = books.filter((b) => {
    if (category === "All") return true;
    return b.level?.toLowerCase() === category.toLowerCase();
  });

  return (
    <div className="bg-white rounded-xl shadow-sm m-3 overflow-hidden">

      {/* HEADER */}
      <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_0.8fr_0.8fr] text-xs font-semibold text-gray-500 px-6 py-3 border-b bg-gray-50">
        <div>Book Title</div>
        <div>Publisher</div>
        <div>Category</div>
        <div>Price</div>
        <div>Stock</div>
        <div className="text-right">Action</div>
      </div>

      {/* EMPTY */}
      {filteredBooks.length === 0 && (
        <div className="p-6 text-center text-gray-400">
          No books found
        </div>
      )}

      {/* ROWS */}
      {filteredBooks.slice(0, 50).map((b) => {

        const isOut = Number(b.stock) <= 0;

        return (
          <div
            key={b.id}
            className={`grid grid-cols-[2fr_1.2fr_1fr_1fr_0.8fr_0.8fr] items-center px-6 py-4 border-b transition
            ${isOut ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"}`}
          >

            {/* TITLE */}
            <div className="pr-6 min-w-0">
              <div className="text-sm font-semibold text-gray-800 break-words leading-tight">
                {b.title}
              </div>

              <div className="text-xs text-gray-500 flex gap-2 flex-wrap mt-1">
                {b.level && <span className="bg-gray-100 px-2 rounded">{b.level}</span>}
                {b.edition && <span className="bg-blue-100 text-blue-600 px-2 rounded">{b.edition}</span>}
              </div>
            </div>

            {/* PUBLISHER */}
            <div className="text-xs text-gray-500 pr-6 truncate" title={b.publisher}>
              {b.publisher}
            </div>

            {/* CATEGORY */}
            <div className="pr-6">
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium">
                {b.category || "—"}
              </span>
            </div>

            {/* PRICE */}
            <div className="pr-6">
              <span className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-lg whitespace-nowrap">
                Rs {Math.round(Number(b.current_price || b.price || 0)).toLocaleString()}
              </span>
            </div>

            {/* STOCK */}
            <div className="pr-6">
              {b.stock <= 0 ? (
                <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">
                  Out
                </span>
              ) : b.stock <= 5 ? (
                <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                  {b.stock}
                </span>
              ) : (
                <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                  {b.stock}
                </span>
              )}
            </div>

            {/* ACTION */}
            <div className="flex justify-end">
              <button
                onClick={() => addToCart(b)}
                disabled={isOut}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 shadow-sm
                ${
                  isOut
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white"
                }`}
              >
                +
              </button>
            </div>

          </div>
        );
      })}

    </div>
  );
}

export default BookGrid;