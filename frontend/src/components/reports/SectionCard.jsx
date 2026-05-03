

export default function SectionCard({ title, children, right }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-gray-700">
          {title}
        </h3>
        {right && (
          <div className="text-sm">
            {right}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {children}
      </div>
    </div>
  );
}