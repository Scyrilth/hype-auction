"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  CategoryBreakdownPoint,
  StatusBreakdownPoint,
  TimeSeriesPoint,
  TransactionRole,
} from "@/lib/transactions";

const SELLER_COLORS = ["#7c3aed", "#a78bfa", "#c4b5fd", "#6d28d9"];
const BUYER_COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#2563eb"];
const STATUS_COLORS = {
  Released: "#34d399",
  Funded: "#a78bfa",
  Pending: "#a78bfa",
  Refunded: "#fbbf24",
  Disputed: "#ef4444",
  Completed: "#34d399",
};

const BAR_ACTIVE_BAR = {
  stroke: "rgba(139, 92, 246, 0.8)",
  strokeWidth: 2,
  fill: "rgba(139, 92, 246, 0.9)",
  radius: 4,
};

function ChartShell({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <h3 className="mb-3 text-sm font-medium text-white">{title}</h3>
      {empty ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted">
          No transactions in this period
        </div>
      ) : (
        <div className="h-48">{children}</div>
      )}
    </div>
  );
}

function ValueTooltip({
  active,
  payload,
  label,
  currency,
  solPrice,
  showCount,
}: {
  active?: boolean;
  payload?: { value?: number; payload?: { count?: number } }[];
  label?: string;
  currency: "SOL" | "USD";
  solPrice: number;
  showCount?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  const count = payload[0]?.payload?.count;
  const solValue = currency === "SOL" ? value : solPrice > 0 ? value / solPrice : 0;
  const usdValue = currency === "USD" ? value : value * solPrice;

  return (
    <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-white">{label}</p>
      <p className="text-purple-300">
        {solValue.toFixed(4)} SOL
      </p>
      <p className="text-muted">~${usdValue.toFixed(2)}</p>
      {showCount && count !== undefined && (
        <p className="mt-1 text-muted">{count} transaction{count === 1 ? "" : "s"}</p>
      )}
    </div>
  );
}

function CategoryTooltip({
  active,
  payload,
  solPrice,
}: {
  active?: boolean;
  payload?: { payload?: CategoryBreakdownPoint }[];
  solPrice: number;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-white">{data.category}</p>
      <p className="text-purple-300">{data.valueSol.toFixed(4)} SOL</p>
      <p className="text-muted">~${(data.valueSol * solPrice).toFixed(2)}</p>
      <p className="text-muted">{data.percent.toFixed(1)}% · {data.count} items</p>
    </div>
  );
}

export default function TransactionCharts({
  role,
  currency,
  solPrice,
  earningsSeries,
  volumeSeries,
  categoryBreakdown,
  statusBreakdown,
}: {
  role: TransactionRole;
  currency: "SOL" | "USD";
  solPrice: number;
  earningsSeries: TimeSeriesPoint[];
  volumeSeries: TimeSeriesPoint[];
  categoryBreakdown: CategoryBreakdownPoint[];
  statusBreakdown: StatusBreakdownPoint[];
}) {
  const accent = role === "selling" ? "#7c3aed" : "#3b82f6";
  const palette = role === "selling" ? SELLER_COLORS : BUYER_COLORS;

  const mapValue = (sol: number) =>
    currency === "USD" ? sol * solPrice : sol;

  const earningsData = earningsSeries.map((p) => ({
    ...p,
    displayValue: mapValue(p.value),
  }));

  const volumeData = volumeSeries.map((p) => ({
    ...p,
    displayValue: p.count,
  }));

  const categoryData = categoryBreakdown.map((p) => ({
    ...p,
    displayValue: mapValue(p.valueSol),
  }));

  const statusData = statusBreakdown
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s.status,
      count: s.count,
      valueSol: s.valueSol,
      displayValue: mapValue(s.valueSol),
    }));

  const earningsLabel = role === "selling" ? "Earnings over time" : "Spending over time";
  const volumeLabel = role === "selling" ? "Transaction volume" : "Purchase volume";
  const categoryLabel = "Category breakdown";
  const statusLabel = role === "selling" ? "Escrow status breakdown" : "Status breakdown";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartShell title={earningsLabel} empty={earningsData.length === 0}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={earningsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
            <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} />
            <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
            <Tooltip
              cursor={false}
              content={
                <ValueTooltip currency={currency} solPrice={solPrice} />
              }
            />
            <Bar
              dataKey="displayValue"
              fill={accent}
              radius={[4, 4, 0, 0]}
              activeBar={BAR_ACTIVE_BAR}
              animationDuration={600}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title={volumeLabel} empty={volumeData.length === 0}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={volumeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
            <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} />
            <YAxis tick={{ fill: "#71717a", fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              content={
                <ValueTooltip currency="SOL" solPrice={solPrice} showCount />
              }
            />
            <Line
              type="monotone"
              dataKey="displayValue"
              stroke={accent}
              strokeWidth={2}
              dot={{ fill: accent, r: 3 }}
              animationDuration={600}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title={categoryLabel} empty={categoryData.length === 0}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              dataKey="displayValue"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              animationDuration={600}
            >
              {categoryData.map((_, index) => (
                <Cell key={index} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip content={<CategoryTooltip solPrice={solPrice} />} />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-muted">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title={statusLabel} empty={statusData.length === 0}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={statusData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
            <XAxis type="number" tick={{ fill: "#71717a", fontSize: 10 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={{ fill: "#71717a", fontSize: 10 }}
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0]?.payload as {
                  name: string;
                  count: number;
                  valueSol: number;
                };
                return (
                  <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs shadow-lg">
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-muted">{item.count} transactions</p>
                    <p className="text-purple-300">{item.valueSol.toFixed(4)} SOL</p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              activeBar={BAR_ACTIVE_BAR}
              animationDuration={600}
            >
              {statusData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={
                    STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] ??
                    accent
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
    </div>
  );
}
