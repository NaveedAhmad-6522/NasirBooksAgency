export default function StatCard({ title, value, icon, type, subtitle }) {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600",
    purple: "bg-purple-100 text-purple-600",
    teal: "bg-teal-100 text-teal-600",
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
      <div className="flex flex-col h-full justify-between">

        {/* Top Section */}
        <div className="flex items-start justify-between">

          {/* Left Content */}
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <h2 className="text-lg font-semibold text-gray-900">
              {value}
            </h2>

            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>

          {/* Icon */}
          <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${colorMap[type]}`}>
            {icon}
          </div>

        </div>

        {/* Bottom Section */}
        <div className="flex justify-end mt-2">
          <span className="text-xs text-blue-600 font-medium cursor-pointer flex items-center gap-1">
            View details
            <span>→</span>
          </span>
        </div>

      </div>
    </div>
  );
}