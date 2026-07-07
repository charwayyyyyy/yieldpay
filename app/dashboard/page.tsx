import React from 'react';
import { headers } from "next/headers";
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

async function getSubscriptions() {
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  
  try {
    const res = await fetch(`${protocol}://${host}/api/buyer/subscriptions`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error("Failed to fetch subscriptions internally", e);
    return [];
  }
}

export default async function Dashboard() {
  const subscriptions = await getSubscriptions();

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <a href="/" className="font-bold text-xl text-gray-900 tracking-tight flex items-center gap-2 hover:opacity-80">
                <div className="relative w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">Y</div>
                Yield<span className="text-green-600">Pay</span>
             </a>
          </div>
          <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">Buyer Dashboard</span>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Portfolio</h1>
        <p className="text-gray-500 mb-8">Track the progress of the harvests you have funded.</p>

        {subscriptions.length === 0 ? (
          <EmptyState 
            title="No investments yet" 
            description="You haven't funded any crops. Go to the marketplace to start financing farmers." 
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-900 uppercase text-xs font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Crop</th>
                    <th className="px-6 py-4">Farmer Region</th>
                    <th className="px-6 py-4">Investment</th>
                    <th className="px-6 py-4">Stage</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Expected Harvest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscriptions.map((sub: any) => {
                    const crop = sub.cropCycleId;
                    if (!crop) return null; // Defensive check
                    
                    return (
                      <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">
                           {crop.acres} Acres of {crop.cropType}
                        </td>
                        <td className="px-6 py-4">{crop.region}, {crop.district}</td>
                        <td className="px-6 py-4 font-semibold text-green-700">GHS {sub.amount}</td>
                        <td className="px-6 py-4">
                           <span className="inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              {crop.stage}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <StatusBadge status={sub.status === 'active' ? crop.status : sub.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                           {new Date(crop.expectedHarvestDate).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
