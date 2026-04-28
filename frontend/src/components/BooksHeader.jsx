import React from "react";

function BooksHeader({ search, setSearch, onAddBook, onExport }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      
      {/* Left Side - Search */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search by title or Publisher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Right Side - Actions */}
      <div className="flex gap-2 justify-end">
        
        {/* Export Button */}
        <button
          onClick={onExport}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Export
        </button>

        {/* Add Book Button */}
        <button
          onClick={onAddBook}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          + Add Book
        </button>
      </div>

    </div>
  );
}

export default BooksHeader;
