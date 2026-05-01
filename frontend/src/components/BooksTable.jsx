import React from "react";

function BooksTable({ books, onToggleStatus, onEdit, onDelete, onRestock }) {
  const handleDelete = (id) => {
    const confirmText = prompt('Type DELETE to confirm deletion');

    if (confirmText === 'DELETE') {
      if (onDelete) onDelete(id);
    } else {
      alert('Deletion cancelled');
    }
  };
  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      <table className="w-full text-sm">
        
        {/* Table Header */}
        <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
          <tr>
            <th className="p-4 text-left">#</th>
            <th className="p-4 text-left">Title</th>
            <th className="p-4 text-left">Category</th>
            <th className="p-4 text-left">Publisher</th>
            <th className="p-4 text-left">Edition</th>
            <th className="p-4 text-left">Price</th>
            <th className="p-4 text-left">Stock</th>
            <th className="p-4 text-left">Status</th>
            <th className="p-4 text-center pr-6">Actions</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {books.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center p-6 text-gray-500">
                No books found
              </td>
            </tr>
          ) : (
            books.map((book, index) => (
              <tr
                key={book.id}
                className={`border-b hover:bg-gray-50 transition ${
                  !book.is_active ? "opacity-60 bg-gray-50" : ""
                }`}
              >
                
                {/* Index */}
                <td className="p-4">{index + 1}</td>

                {/* Title */}
                <td className="p-4">
                  <div className="font-semibold text-gray-800">{book.title}</div>
                  <div className="mt-1">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                      {book.level || "-"}
                    </span>
                  </div>
                </td>

                {/* Category */}
                <td className="p-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    {book.category || "-"}
                  </span>
                </td>

                {/* Publisher */}
                <td className="p-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {book.publisher || "-"}
                  </span>
                </td>

                {/* Edition */}
                <td className="p-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {book.edition || "-"}
                  </span>
                </td>

                {/* Price */}
                <td className="p-4">
                  <div className="text-green-600 font-semibold">
                    Rs {book.printed_price || book.current_price}
                  </div>
                </td>

                {/* Stock */}
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      book.stock > 10
                        ? "bg-blue-100 text-blue-700"
                        : book.stock > 0
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {book.stock}
                  </span>
                </td>

                {/* Status */}
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      book.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {book.is_active ? "Active" : "Hidden"}
                  </span>
                </td>

                {/* Actions */}
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2 min-w-[160px]">

                    {/* Edit */}
                    <button
                      onClick={() => onEdit(book)}
                      className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                    >
                      Edit
                    </button>

                    {/* Restock */}
                    <button
                      onClick={() => onRestock && onRestock(book)}
                      className="px-2 py-1 text-xs border rounded text-blue-600 hover:bg-blue-50"
                    >
                      Restock
                    </button>

                    {/* Toggle Status */}
                    <button
                      onClick={() => onToggleStatus(book.id)}
                      className={`px-2 py-1 text-xs rounded text-white ${
                        book.is_active
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {book.is_active ? "Hide" : "Show"}
                    </button>

                    {/* Delete */}
                   

                  </div>
                </td>

              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default BooksTable;