"use client";
import { useEffect, useState } from "react";

interface Product { id: number; name: string; sku: string; current_price: number; cost_of_goods: number; stock_level: number; }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:8000/api/products/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAnalyze = async (productId: number) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/products/${productId}/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to analyze");
      alert("Analysis complete! Check recommendations.");
    } catch (err) {
      console.error(err);
      alert("Error running analysis.");
    }
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-2 text-sm text-gray-700">A list of all products in your catalog including SKU, price, and stock level.</p>
        </div>
      </div>
      
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">SKU</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Price</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Cost</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Stock</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Analyze</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{product.name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.sku}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${product.current_price.toFixed(2)}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${product.cost_of_goods.toFixed(2)}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.stock_level}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleAnalyze(product.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Run Agent Analysis<span className="sr-only">, {product.name}</span>
                        </button>
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
