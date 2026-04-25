"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Recommendation { id: number; current_price: number; recommended_price: number; confidence_score: number; status: string; rationale: string; agent_outputs: string; }

export default function RecommendationDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [overridePrice, setOverridePrice] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const fetchRec = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`http://localhost:8000/api/recommendations/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setRec(data);
        setOverridePrice(data.recommended_price.toString());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRec();
  }, [id]);

  const handleApprove = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/recommendations/${id}/approve`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ override_price: parseFloat(overridePrice) }),
      });
      if (res.ok) router.push("/dashboard/recommendations");
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) return alert("Please provide a rejection reason");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/recommendations/${id}/reject`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ rejection_reason: rejectReason }),
      });
      if (res.ok) router.push("/dashboard/recommendations");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!rec) return <div>Recommendation not found.</div>;

  let agents: Record<string, unknown> = {};
  try {
    agents = JSON.parse(rec.agent_outputs);
  } catch (e) {}

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recommendation Review</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Review AI reasoning and take action.</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            rec.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            rec.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {rec.status.toUpperCase()}
          </span>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Current Price</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">${rec.current_price.toFixed(2)}</dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Recommended Price</dt>
              <dd className="mt-1 text-sm font-bold text-blue-600 sm:col-span-2 sm:mt-0">${rec.recommended_price.toFixed(2)}</dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Confidence Score</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{(rec.confidence_score * 100).toFixed(0)}%</dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6 bg-blue-50">
              <dt className="text-sm font-medium text-blue-900">Agent Rationale</dt>
              <dd className="mt-1 text-sm text-blue-900 sm:col-span-2 sm:mt-0">{rec.rationale}</dd>
            </div>
            
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Market Intelligence</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(agents.market_intelligence, null, 2)}</pre>
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Demand Forecasting</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(agents.demand_forecasting, null, 2)}</pre>
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Inventory & Cost</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(agents.inventory_cost, null, 2)}</pre>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {rec.status === "pending" && (
        <div className="bg-white shadow sm:rounded-lg p-6 space-y-4">
          <h4 className="text-md font-medium text-gray-900">Take Action</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Override Price (Optional)</label>
              <input
                type="number"
                value={overridePrice}
                onChange={(e) => setOverridePrice(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
              />
              <button
                onClick={handleApprove}
                className="w-full justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Approve & Execute
              </button>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
              <input
                type="text"
                placeholder="Why are you rejecting this?"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
              />
              <button
                onClick={handleReject}
                className="w-full justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Reject Recommendation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
