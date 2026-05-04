export default function SummaryPanel({ data = {}, compact = false }) {
  const {
    received = 0,
    paid = 0,
    customerReturns = 0,
    supplierReturns = 0,
    profit = 0
  } = data;

  const netBalance = received - paid;

  const formatCompact = (num) => {
    const n = Number(num) || 0;

    if (n >= 1_000_000_000) return `Rs ${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `Rs ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `Rs ${(n / 1_000).toFixed(1)}K`;

    return `Rs ${n}`;
  };

  const formatFull = (num) => `Rs ${Number(num || 0).toLocaleString()}`;

  return (
    <div className="space-y-3">

      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Total Received</span>
        <span
          className="font-medium text-green-600"
          title={formatFull(received)}
        >
          {formatCompact(received)}
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Total Paid</span>
        <span
          className="font-medium text-red-600"
          title={formatFull(paid)}
        >
          {formatCompact(paid)}
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Customer Returns</span>
        <span
          className="font-medium text-orange-600"
          title={formatFull(customerReturns)}
        >
          {formatCompact(customerReturns)}
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Supplier Returns</span>
        <span
          className="font-medium text-yellow-600"
          title={formatFull(supplierReturns)}
        >
          {formatCompact(supplierReturns)}
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Profit</span>
        <span
          className="font-medium text-blue-600"
          title={formatFull(profit)}
        >
          {formatCompact(profit)}
        </span>
      </div>

      <div className="border-t pt-3 flex justify-between text-sm">
        <span className="text-gray-700 font-medium">Net Balance</span>
        <span
          className="font-semibold"
          title={formatFull(netBalance)}
        >
          {formatCompact(netBalance)}
        </span>
      </div>

    </div>
  );
}