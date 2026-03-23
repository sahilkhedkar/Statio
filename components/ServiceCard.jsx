"use client";

import ResponseChart from "./ResponseChart";

function formatUptime(history) {
  if (!history.length) {
    return "0%";
  }

  const upCount = history.filter((entry) => entry.status === "UP").length;
  return `${Math.round((upCount / history.length) * 100)}%`;
}

function formatCheckedAt(timestamp) {
  if (!timestamp) {
    return "Awaiting first check";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(timestamp));
}

export default function ServiceCard({ service, onRemove }) {
  const isUp = service.latestStatus === "UP";
  const hasData = service.history.length > 0;

  return (
    <article className="panel group rounded-[24px] p-4 transition-transform duration-200 hover:-translate-y-0.5 sm:rounded-[28px] sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="min-w-0 break-all text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              {service.url}
            </h2>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                isUp
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-red-50 text-red-700 ring-1 ring-red-200"
              }`}
            >
              {service.loading ? "Checking..." : service.latestStatus}
            </span>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Last checked {formatCheckedAt(service.lastCheckedAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(service.id)}
          className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-colors duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 md:w-auto"
        >
          Remove
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
          <p className="text-sm text-slate-500">Response time</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {hasData ? `${service.latestResponseTime} ms` : "--"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
          <p className="text-sm text-slate-500">Uptime</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {formatUptime(service.history)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
          <p className="text-sm text-slate-500">Recent checks</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {service.history.length}
          </p>
        </div>
      </div>

      <div className="mt-6">
        {hasData ? (
          <ResponseChart history={service.history} />
        ) : (
          <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 text-sm text-slate-400">
            Waiting for the first API check.
          </div>
        )}
      </div>
    </article>
  );
}
