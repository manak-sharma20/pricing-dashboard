"use client";

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage organization-wide configurations.</p>
      </div>

      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Automation Settings</h3>
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Auto-Execute Confidence Threshold</label>
            <p className="text-sm text-gray-500 mb-2">Recommendations with a confidence score above this threshold will be executed automatically without human review.</p>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="90"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-gray-900 font-medium w-12">90%</span>
            </div>
          </div>
          <div className="pt-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
