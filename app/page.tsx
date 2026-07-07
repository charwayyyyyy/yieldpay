import Image from "next/image";
import { CropCard } from "@/components/CropCard";
import { EmptyState } from "@/components/EmptyState";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

async function getCrops() {
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  
  try {
    const res = await fetch(`${protocol}://${host}/api/crops`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error("Failed to fetch crops internally", e);
    return [];
  }
}

export default async function Home() {
  const crops = await getCrops();

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="relative w-8 h-8">
                {/* Fallback icon if logo not found */}
                <div className="absolute inset-0 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">Y</div>
             </div>
             <span className="font-bold text-xl text-gray-900 tracking-tight">Yield<span className="text-green-600">Pay</span></span>
          </div>
          <nav>
            <a href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
              Buyer Dashboard
            </a>
          </nav>
        </div>
      </header>

      <section className="bg-green-900 text-white py-16 px-4 mb-12">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Fund a Farmer. Share the Yield.
          </h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto mb-8 font-light">
            Directly finance pre-harvest operations for Ghanaian farmers via mobile money. We use AI and USSD to ensure your capital grows securely.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
             <span className="px-4 py-2 bg-green-800 rounded-full flex items-center gap-2">📱 USSD Registered</span>
             <span className="px-4 py-2 bg-green-800 rounded-full flex items-center gap-2">💳 Moolre Secured</span>
             <span className="px-4 py-2 bg-green-800 rounded-full flex items-center gap-2">🛡️ AI Insured</span>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Available Harvests</h2>
            <p className="text-gray-500 mt-1">Fund active farmers seeking operating capital</p>
          </div>
        </div>

        {crops.length === 0 ? (
          <EmptyState 
            title="No active crops right now" 
            description="Farmers haven't registered any new crops via USSD recently. Check back soon!" 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crops.map((crop: any) => (
              <CropCard key={crop._id} crop={crop} />
            ))}
          </div>
        )}
      </section>
      
      <footer className="mt-24 border-t border-gray-200 py-8 text-center text-gray-500 text-sm">
         <p>Powered by <span className="font-bold text-gray-900">Moolre</span></p>
         <p className="mt-2">&copy; {new Date().getFullYear()} YieldPay AI - Moolre Startup Cup</p>
      </footer>
    </main>
  );
}
