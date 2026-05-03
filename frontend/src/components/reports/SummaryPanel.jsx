


export default function SummaryPanel() {
  return (
    <div className="space-y-3">

      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Total Orders</span>
        <span className="font-medium">32</span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Total Received</span>
        <span className="font-medium text-green-600">Rs 245,680</span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Total Paid</span>
        <span className="font-medium text-red-600">Rs 128,450</span>
      </div>

      <div className="border-t pt-3 flex justify-between text-sm">
        <span className="text-gray-700 font-medium">Net Balance</span>
        <span className="font-semibold">Rs 117,230</span>
      </div>

    </div>
  );
}