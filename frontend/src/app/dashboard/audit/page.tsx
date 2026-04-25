"use client";
import { useEffect, useState } from "react";

interface AuditLog { id: number; created_at: string; product_id: number; old_price: number; new_price: number; executed_by: number | null; recommendation_id: number | null; }

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:8000/api/audit/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <div>Loading audit logs...</div>;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Audit Log</h1>
          <p className="mt-2 text-sm text-gray-700">A complete history of all pricing changes in your organization.</p>
        </div>
      </div>
      
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Product ID</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Old Price</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">New Price</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Executed By</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Recommendation Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">PROD-{log.product_id}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 line-through">${log.old_price.toFixed(2)}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-green-600">${log.new_price.toFixed(2)}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {log.executed_by ? `User ${log.executed_by}` : "System (Auto)"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-blue-600 hover:underline">
                        {log.recommendation_id ? `REC-${log.recommendation_id}` : "Manual"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
