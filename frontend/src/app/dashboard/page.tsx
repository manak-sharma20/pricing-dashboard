"use client";
import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, pending: 0, executed: 0 });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const prodRes = await fetch(getApiUrl("/api/products/"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const products = await prodRes.json();

        const recRes = await fetch(getApiUrl("/api/recommendations/"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const recommendations = await recRes.json();

        const pendingCount = recommendations.filter((r: { status: string }) => r.status === "pending").length;
        const executedCount = recommendations.filter((r: { status: string }) => r.status === "auto_executed").length;

        setStats({
          products: products.length || 0,
          pending: pendingCount,
          executed: executedCount,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Summary of your pricing intelligence and actions required.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Total Products Managed</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.products}</dd>
        </div>

        <div className="overflow-hidden rounded-lg bg-blue-50 px-4 py-5 shadow border border-blue-200 sm:p-6">
          <dt className="truncate text-sm font-medium text-blue-800">Pending Recommendations</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-blue-900">{stats.pending}</dd>
        </div>

        <div className="overflow-hidden rounded-lg bg-green-50 px-4 py-5 shadow border border-green-200 sm:p-6">
          <dt className="truncate text-sm font-medium text-green-800">Auto-Executed Changes (30d)</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-900">{stats.executed}</dd>
        </div>
      </div>
    </div>
  );
}
