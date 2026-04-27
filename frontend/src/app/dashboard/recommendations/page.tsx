"use client";
import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";
import Link from "next/link";

interface Recommendation { id: number; current_price: number; recommended_price: number; confidence_score: number; status: string; }

export default function RecommendationsList() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(getApiUrl("/api/recommendations/"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setRecommendations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, []);

  if (loading) return <div>Loading recommendations...</div>;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Pricing Recommendations</h1>
          <p className="mt-2 text-sm text-gray-700">AI-generated pricing recommendations pending your review.</p>
        </div>
      </div>
      
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">ID</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Current Price</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Recommended</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Confidence</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Review</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recommendations.map((rec) => (
                    <tr key={rec.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">REC-{rec.id}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${rec.current_price.toFixed(2)}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-blue-600 font-bold">${rec.recommended_price.toFixed(2)}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{(rec.confidence_score * 100).toFixed(0)}%</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          rec.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          rec.status === 'approved' ? 'bg-green-100 text-green-800' :
                          rec.status === 'auto_executed' ? 'bg-purple-100 text-purple-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link href={`/dashboard/recommendations/${rec.id}`} className="text-blue-600 hover:text-blue-900">
                          Review<span className="sr-only">, REC-{rec.id}</span>
                        </Link>
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
