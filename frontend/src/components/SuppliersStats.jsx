export default function SuppliersStats({ suppliers, statsData }) {
    const formatCurrency = (num) => {
      const n = Number(num) || 0;
      if (n >= 1_000_000_000) return `Rs. ${(n / 1_000_000_000).toFixed(2)} Bn`;
      if (n >= 1_000_000) return `Rs. ${(n / 1_000_000).toFixed(2)} M`;
      if (n >= 1_000) return `Rs. ${(n / 1_000).toFixed(2)} K`;
      return `Rs. ${n}`;
    };

    const formatNumber = (num) => {
      const n = Number(num || 0);
      if (n === 0) return "0";
      if (n >= 10000000) return (n / 10000000).toFixed(1) + " Cr";
      if (n >= 100000) return (n / 100000).toFixed(1) + " L";
      if (n >= 1000) return (n / 1000).toFixed(1) + " K";
      return n.toString();
    };

    const totalSuppliers = statsData?.total_suppliers ?? 0;
  
    const totalBooks = statsData?.total_purchases ?? 0;
  
    const totalAmount = statsData?.total_amount ?? 0;
  
    const topSupplier = statsData?.top_supplier ?? "--";
  
    const stats = [
      {
        label: "Total Suppliers",
        value: totalSuppliers,
        color: "bg-blue-50 text-blue-600",
      },
      {
        label: "Total Books",
        value: totalBooks,
        color: "bg-green-50 text-green-600",
      },
      {
        label: "Total Amount",
        value: formatCurrency(totalAmount),
        color: "bg-yellow-50 text-yellow-600",
      },
      {
        label: "Top Supplier",
        value: topSupplier,
        color: "bg-purple-50 text-purple-600",
      },
    ];
  
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: "Total Suppliers",
            value: totalSuppliers,
            sub: "Active suppliers",
            bg: "bg-green-100",
            icon: "👤",
          },
          {
            label: "Total Purchases",
            value: totalBooks,
            sub: "All time purchases",
            bg: "bg-blue-100",
            icon: "🛒",
          },
          {
            label: "Total Purchase Amount",
            value: formatCurrency(totalAmount),
            sub: "All time amount",
            bg: "bg-yellow-100",
            icon: "💰",
          },
          {
            label: "Most Active Supplier",
            value: topSupplier,
            sub: "Top performer",
            bg: "bg-purple-100",
            icon: "🏅",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4"
          >
            {/* ICON */}
            <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-xl ${item.bg}`}>
              {item.icon}
            </div>
  
            {/* CONTENT */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">{item.label}</span>
              <span className="text-xl font-semibold">
                {item.label === "Total Purchases" ? (
                  <span className="relative group cursor-default">
                    {formatNumber(item.value)}
                    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-xs rounded-md bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-lg">
                      {Number(item.value || 0).toLocaleString()}
                    </span>
                  </span>
                ) : item.label === "Total Purchase Amount" ? (
                  <span className="relative group cursor-default">
                    {item.value}
                    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-xs rounded-md bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-lg">
                      Rs. {Number(totalAmount || 0).toLocaleString()}
                    </span>
                  </span>
                ) : (
                  item.value ?? "--"
                )}
              </span>
              <span className="text-xs text-gray-400">{item.sub}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }