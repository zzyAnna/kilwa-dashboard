interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  tooltip?: string;
}

export default function StatCard({ title, value, subtitle, tooltip }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div>
        <div className="group relative inline-block cursor-help">
          <p className="text-sm text-gray-700 font-medium">{title}</p>
          {tooltip && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64 z-10">
              {tooltip}
            </div>
          )}
        </div>
        <p className="text-2xl font-bold mt-1 text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
