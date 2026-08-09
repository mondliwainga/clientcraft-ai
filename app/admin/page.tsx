"use client";

import { useState } from "react";

interface UserData {
  email: string;
  tier: string;
  createdAt: string;
  todayUsage: number;
}

interface Stats {
  date: string;
  totalUsers: number;
  activeToday: number;
  hitLimitToday: number;
  users: UserData[];
}

export default function AdminDashboard() {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-secret": secret },
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to fetch stats");
        return;
      }
      const data = await res.json();
      setStats(data);
      setAuthenticated(true);
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    await fetchStats();
  }

  if (!authenticated) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Enter your admin password
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchStats();
            }}
            className="mt-6 space-y-4"
          >
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Admin password"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !secret}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Loading..." : "Access Dashboard"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ClientCraft AI — Admin
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Date: {stats?.date}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {stats?.totalUsers ?? 0}
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <p className="text-sm text-gray-500">Active Today</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {stats?.activeToday ?? 0}
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <p className="text-sm text-gray-500">Hit Limit Today</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">
              {stats?.hitLimitToday ?? 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">Ready to convert</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              All Users ({stats?.users.length ?? 0})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Email</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Tier</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Today&apos;s Usage</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats?.users.map((user, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-900">{user.email}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.tier === "pro"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.tier}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            user.todayUsage >= 5
                              ? "text-amber-600 font-semibold"
                              : "text-gray-900"
                          }
                        >
                          {user.todayUsage}/5
                        </span>
                        {user.todayUsage >= 5 && (
                          <span className="text-xs text-amber-600">
                            limit reached
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {user.createdAt !== "unknown"
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
                {stats?.users.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      No users yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
