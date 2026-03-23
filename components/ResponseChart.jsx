"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function formatLabel(timestamp) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(timestamp));
}

export default function ResponseChart({ history }) {
  const data = history.map((entry) => ({
    label: formatLabel(entry.checkedAt),
    responseTime: entry.responseTime
  }));

  return (
    <div className="chart-shell h-40 w-full rounded-2xl border border-slate-200/80 bg-white/80 p-2 sm:h-44 sm:p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 6" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            minTickGap={28}
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={42}
            tickFormatter={(value) => `${value}ms`}
          />
          <Tooltip
            cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
            formatter={(value) => [`${value} ms`, "Response"]}
            labelFormatter={(value) => value}
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 18px 32px -20px rgba(15, 23, 42, 0.25)"
            }}
          />
          <Line
            type="monotone"
            dataKey="responseTime"
            stroke="#0f172a"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#0f172a", stroke: "#ffffff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
