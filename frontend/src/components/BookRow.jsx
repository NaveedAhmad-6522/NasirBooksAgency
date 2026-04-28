import React from "react";

function BookRow({ book, index, onToggleStatus, onEdit }) {
  return (
    <tr
      className={`border-t hover:bg-gray-50 ${
        !book.is_active ? "opacity-60 bg-gray-50" : ""
      }`}
    >
      {/* Index */}
      <td className="p-3">{index + 1}</td>

      {/* Title */}
      <td className="p-3">
        <div className="font-medium">
          {book.title}
          {!book.is_active && (
            <span className="ml-2 text-xs text-gray-500">(Hidden)</span>
          )}
        </div>
        <div className="text-xs text-gray-500">{book.level}</div>
      </td>

      {/* Category */}
      <td className="p-3">{book.category || "-"}</td>

      {/* Price */}
      <td className="p-3">
        <div className="text-green-600 font-medium">
          Rs {book.current_price}
        </div>
        <div className="text-xs text-gray-400 line-through">
          Rs {book.printed_price}
        </div>
      </td>

      {/* Stock */}
      <td className="p-3">
        <span
          className={`px-2 py-1 rounded text-xs ${
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
      <td className="p-3">
        <span
          className={`px-2 py-1 rounded text-xs ${
            book.is_active
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {book.is_active ? "Active" : "Hidden"}
        </span>
      </td>

      {/* Actions */}
      <td className="p-3 flex gap-2">
        <button
          onClick={() => onEdit(book)}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
        >
          Edit
        </button>

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
      </td>
    </tr>
  );
}

export default BookRow;
