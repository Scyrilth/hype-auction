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

export default function AdminOverviewCharts({
  gmvByMonth,
  usersByMonth,
  categoryGmv,
  statusCounts,
  solUsdRate,
}: {
  gmvByMonth: AdminGmvMonth[];
  usersByMonth: AdminUsersMonth[];
  categoryGmv: AdminCategoryGmv[];
  statusCounts: AdminStatusCount[];
  solUsdRate: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-border bg-surface/60 p-4">
        <h3 className="mb-3 text-sm font-medium text-white">GMV over time</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gmvByMonth}>
              <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.[0] ? (
                    <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs">
                      <p className="text-white">{label}</p>
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
              <Bar dataKey="valueSol" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface/60 p-4">
        <h3 className="mb-3 text-sm font-medium text-white">New users</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={usersByMonth}>
              <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface/60 p-4">
        <h3 className="mb-3 text-sm font-medium text-white">GMV by category</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categoryGmv} dataKey="valueSol" nameKey="category" innerRadius={45} outerRadius={70}>
                {categoryGmv.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend formatter={(v) => <span className="text-xs text-muted">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface/60 p-4">
        <h3 className="mb-3 text-sm font-medium text-white">Transaction status</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusCounts} dataKey="count" nameKey="status" innerRadius={45} outerRadius={70}>
                {statusCounts.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend formatter={(v) => <span className="text-xs text-muted">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
