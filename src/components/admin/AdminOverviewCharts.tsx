"use client";

import {
  Bar,
  BarChart,
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
  AdminCategoryGmv,
  AdminGmvMonth,
  AdminStatusCount,
  AdminUsersMonth,
} from "@/lib/admin/types";

const COLORS = ["#7c3aed", "#a78bfa", "#4ade80", "#fbbf24", "#ef4444", "#3b82f6"];

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
  emptyMessage,
}: {
  title: string;
  children: React.ReactNode;
  empty?: boolean;
  emptyMessage?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <h3 className="mb-3 text-sm font-medium text-white">{title}</h3>
      {empty ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted">
          <p>{emptyMessage ?? "No data for this period"}</p>
        </div>
      ) : (
        <div className="h-48">{children}</div>
      )}
    </div>
  );
}

const DUMMY_DATA_EMPTY_HINT =
  "No released transactions yet. Turn on Show dummy data in the top bar to include test data.";

export default function AdminOverviewCharts({
  gmvByMonth,
  usersByMonth,
  categoryGmv,
  statusCounts,
  solUsdRate,
  showDummyData,
}: {
  gmvByMonth: AdminGmvMonth[];
  usersByMonth: AdminUsersMonth[];
  categoryGmv: AdminCategoryGmv[];
  statusCounts: AdminStatusCount[];
  solUsdRate: number;
  showDummyData: boolean;
}) {
  const gmvHasData = gmvByMonth.some((point) => point.valueSol > 0);
  const categoryHasData = categoryGmv.length > 0;
  const statusSlices = statusCounts.filter((item) => item.count > 0);
  const statusHasData = statusSlices.length > 0;

  const emptyHint = showDummyData
    ? "No data for this period"
    : DUMMY_DATA_EMPTY_HINT;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartShell title="GMV over time" empty={!gmvHasData} emptyMessage={emptyHint}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={gmvByMonth}>
            <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} />
            <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
            <Tooltip
              cursor={false}
              content={({ active, payload, label }) =>
                active && payload?.[0] ? (
                  <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs shadow-lg">
                    <p className="font-medium text-white">{label}</p>
                    <p className="text-purple-300">
                      {(payload[0].value as number).toFixed(4)} SOL
                    </p>
                    <p className="text-muted">
                      ~${((payload[0].value as number) * solUsdRate).toFixed(2)}
                    </p>
                  </div>
                ) : null
              }
            />
            <Bar
              dataKey="valueSol"
              fill="#7c3aed"
              radius={[4, 4, 0, 0]}
              activeBar={BAR_ACTIVE_BAR}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title="New users">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={usersByMonth}>
            <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} />
            <YAxis tick={{ fill: "#71717a", fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="GMV by category"
        empty={!categoryHasData}
        emptyMessage={emptyHint}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryGmv}
              dataKey="valueSol"
              nameKey="category"
              innerRadius={45}
              outerRadius={70}
            >
              {categoryGmv.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend formatter={(v) => <span className="text-xs text-muted">{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Transaction status"
        empty={!statusHasData}
        emptyMessage={emptyHint}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusSlices}
              dataKey="count"
              nameKey="status"
              innerRadius={45}
              outerRadius={70}
            >
              {statusSlices.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend formatter={(v) => <span className="text-xs text-muted">{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </ChartShell>
    </div>
  );
}
