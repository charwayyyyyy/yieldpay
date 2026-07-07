import { headers } from "next/headers";
import { CropCard } from "@/components/CropCard";
import { EmptyState } from "@/components/EmptyState";
import { LayoutDashboard, Wallet, TrendingUp } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getMySubscriptions() {
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  
  try {
    const res = await fetch(`${protocol}://${host}/api/buyer/subscriptions`, { 
      cache: 'no-store',
      // Simulating a logged-in buyer for demo purposes
      headers: { 'x-user-email': 'buyer@yieldpay.com' }
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error("Failed to fetch subscriptions", e);
    return [];
  }
}

export default async function Dashboard() {
  const subscriptions = await getMySubscriptions();
  const totalInvested = subscriptions.reduce((acc: number, sub: any) => acc + sub.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-moolre-navy flex items-center gap-3">
            <LayoutDashboard className="w-10 h-10 text-moolre-gold" />
            Buyer Dashboard
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Monitor the progress of your funded agricultural cycles.</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
         <div className="bg-gradient-to-br from-moolre-navy to-gray-900 rounded-3xl p-6 text-white shadow-lg border border-gray-800">
           <div className="flex justify-between items-start mb-4">
             <div className="bg-white/10 p-3 rounded-2xl">
               <Wallet className="w-6 h-6 text-moolre-gold" />
             </div>
           </div>
           <p className="text-gray-400 text-sm font-semibold mb-1">Total Funded (GHS)</p>
           <h3 className="text-3xl font-bold">₵{totalInvested.toLocaleString()}</h3>
         </div>
         <div className="bg-gradient-to-br from-moolre-green to-emerald-900 rounded-3xl p-6 text-white shadow-lg border border-emerald-800">
           <div className="flex justify-between items-start mb-4">
             <div className="bg-white/10 p-3 rounded-2xl">
               <TrendingUp className="w-6 h-6 text-emerald-300" />
             </div>
           </div>
           <p className="text-emerald-100/70 text-sm font-semibold mb-1">Active Farms Supported</p>
           <h3 className="text-3xl font-bold">{subscriptions.length}</h3>
         </div>
      </div>

      <h2 className="text-2xl font-bold text-moolre-navy mb-6">Your Portfolio</h2>

      {subscriptions.length === 0 ? (
        <EmptyState 
          title="No active investments" 
          description="You haven't funded any farms yet. Head over to the marketplace to start!" 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subscriptions.map((sub: any) => (
            <CropCard key={sub._id} crop={sub.cropCycleId} />
          ))}
        </div>
      )}
    </div>
  );
}
