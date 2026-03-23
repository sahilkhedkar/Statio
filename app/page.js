"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ServiceCard from "../components/ServiceCard";

const STORAGE_KEY = "statio.monitored-services";
const MAX_HISTORY_POINTS = 20;
const POLL_INTERVAL_MS = 10000;

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function createService(url) {
  return {
    id: crypto.randomUUID(),
    url,
    latestStatus: "DOWN",
    latestResponseTime: null,
    lastCheckedAt: null,
    history: [],
    loading: true
  };
}

export default function HomePage() {
  const [inputValue, setInputValue] = useState("");
  const [services, setServices] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasHydrated, setHasHydrated] = useState(false);
  const servicesRef = useRef([]);

  useEffect(() => {
    servicesRef.current = services;
  }, [services]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      setHasHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        setServices(
          parsed
            .filter((entry) => typeof entry?.url === "string" && isValidHttpUrl(entry.url))
            .map((entry) => createService(entry.url))
        );
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const urls = services.map((service) => ({ url: service.url }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
  }, [hasHydrated, services]);

  useEffect(() => {
    if (!services.length) {
      return undefined;
    }

    let cancelled = false;

    async function checkService(service) {
      setServices((current) =>
        current.map((entry) =>
          entry.id === service.id
            ? {
                ...entry,
                loading: true
              }
            : entry
        )
      );

      try {
        const response = await fetch("/api/check", {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ url: service.url })
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Request failed");
        }

        if (cancelled) {
          return;
        }

        const checkedAt = Date.now();

        setServices((current) =>
          current.map((entry) => {
            if (entry.id !== service.id) {
              return entry;
            }

            const nextPoint = {
              checkedAt,
              status: payload.status,
              responseTime: payload.responseTime
            };

            return {
              ...entry,
              latestStatus: payload.status,
              latestResponseTime: payload.responseTime,
              lastCheckedAt: checkedAt,
              loading: false,
              history: [...entry.history, nextPoint].slice(-MAX_HISTORY_POINTS)
            };
          })
        );
      } catch {
        if (cancelled) {
          return;
        }

        const checkedAt = Date.now();

        setServices((current) =>
          current.map((entry) => {
            if (entry.id !== service.id) {
              return entry;
            }

            const nextPoint = {
              checkedAt,
              status: "DOWN",
              responseTime: 0
            };

            return {
              ...entry,
              latestStatus: "DOWN",
              latestResponseTime: 0,
              lastCheckedAt: checkedAt,
              loading: false,
              history: [...entry.history, nextPoint].slice(-MAX_HISTORY_POINTS)
            };
          })
        );
      }
    }

    const runChecks = () => {
      servicesRef.current.forEach((service) => {
        checkService(service);
      });
    };

    runChecks();
    const intervalId = window.setInterval(runChecks, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [services.length]);

  const totalUp = useMemo(
    () => services.filter((service) => service.latestStatus === "UP").length,
    [services]
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedUrl = inputValue.trim();

    if (!isValidHttpUrl(normalizedUrl)) {
      setErrorMessage("Enter a valid public http(s) URL.");
      return;
    }

    if (services.some((service) => service.url === normalizedUrl)) {
      setErrorMessage("That URL is already being monitored.");
      return;
    }

    setErrorMessage("");
    setServices((current) => [...current, createService(normalizedUrl)]);
    setInputValue("");
  };

  const handleRemove = (serviceId) => {
    setServices((current) => current.filter((service) => service.id !== serviceId));
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <section className="panel rounded-[32px] px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 shrink-0"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 16C4 13.7909 5.79086 12 8 12H9.5C11.7091 12 13.5 10.2091 13.5 8C13.5 5.79086 15.2909 4 17.5 4H18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="4.5" cy="16.5" r="1.5" fill="currentColor" />
                  <circle cx="9.5" cy="12.5" r="1.5" fill="currentColor" fillOpacity="0.82" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" fillOpacity="0.68" />
                </svg>
                Statio
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Statio
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                  Monitor public websites and APIs with server-side checks, real response
                  times, and a live status history that updates every ten seconds.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5">
                <p className="text-sm text-slate-500">Services</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  {services.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5">
                <p className="text-sm text-slate-500">Online</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  {totalUp}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5">
                <p className="text-sm text-slate-500">Polling</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  10s
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="service-url" className="sr-only">
              Website or API URL
            </label>
            <input
              id="service-url"
              type="url"
              inputMode="url"
              placeholder="https://google.com"
              value={inputValue}
              onChange={(event) => {
                setInputValue(event.target.value);
                if (errorMessage) {
                  setErrorMessage("");
                }
              }}
              className="h-14 flex-1 rounded-2xl border border-slate-200 bg-white px-5 text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-300 focus:shadow-[0_0_0_4px_rgba(15,23,42,0.05)]"
            />
            <button
              type="submit"
              className="inline-flex h-14 cursor-pointer items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Add service
            </button>
          </form>

          {errorMessage ? (
            <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Checks run through the internal API route only. Add any public website or API
              endpoint you want to monitor.
            </p>
          )}
        </section>

        <section className="mt-8 space-y-5">
          {services.length ? (
            services.map((service) => (
              <ServiceCard key={service.id} service={service} onRemove={handleRemove} />
            ))
          ) : (
            <div className="panel rounded-[28px] border-dashed p-10 text-center">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                No services yet
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                Start by adding a public URL. Statio will persist the service list locally
                and keep querying each endpoint through the server-side API.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
