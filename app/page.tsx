import { CropCard } from "@/components/CropCard";
import { EmptyState } from "@/components/EmptyState";
import { headers } from "next/headers";
import { ArrowRight, ShieldCheck, Smartphone, Leaf } from "lucide-react";

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

async function getStats() {
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  try {
    const res = await fetch(`${protocol}://${host}/api/stats`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function Home() {
  const crops = await getCrops();
  const stats = await getStats();

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      {/* Stunning Hero Section */}
      <section className="relative overflow-hidden bg-moolre-navy text-white pt-24 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-moolre-green/80 to-moolre-navy opacity-90 z-0"></div>
        
        {/* Abstract background shapes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-moolre-gold rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow z-0"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-moolre-green rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse-slow z-0" style={{ animationDelay: '1s' }}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center animate-fade-in-up">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-moolre-gold/20 text-moolre-gold mb-6 border border-moolre-gold/30">
            <Leaf className="w-4 h-4 mr-2" />
            Moolre Startup Cup &apos;26
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            Fund a Farmer. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-moolre-gold to-yellow-200">
              Share the Yield.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-10 font-light leading-relaxed">
            Directly finance pre-harvest operations for Ghanaian farmers. 
            We leverage <span className="font-semibold text-white">USSD offline access</span>, 
            <span className="font-semibold text-white"> Gemini AI Insurance</span>, and 
            <span className="font-semibold text-white"> Moolre Payments</span> to bridge the gap between urban capital and rural agriculture.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
             <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
               <Smartphone className="w-5 h-5 text-moolre-gold" />
               <span>USSD Registered</span>
             </div>
             <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
               <ShieldCheck className="w-5 h-5 text-moolre-green" />
               <span>AI Crop Insured</span>
             </div>
          </div>

          {stats && (
            <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-4 text-center border-t border-white/20 pt-8 max-w-4xl mx-auto">
              <div>
                <p className="text-3xl font-bold text-white">{stats.farmers}</p>
                <p className="text-sm text-gray-300">Farmers</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.acres}</p>
                <p className="text-sm text-gray-300">Acres Supported</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-moolre-gold">GHS {stats.funded.toLocaleString()}</p>
                <p className="text-sm text-gray-300">Total Funded</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.cycles}</p>
                <p className="text-sm text-gray-300">Crop Cycles</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.sms}</p>
                <p className="text-sm text-gray-300">SMS Alerts</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Marketplace Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-20 w-full">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-moolre-navy">Active Harvests</h2>
              <p className="text-gray-500 mt-2 text-lg">Select a farm below to inject capital instantly via Moolre.</p>
            </div>
            <a href="#how-it-works" className="flex items-center text-moolre-green font-semibold hover:text-moolre-navy transition-colors">
              How it works <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>

          {crops.length === 0 ? (
            <EmptyState 
              title="No active crops right now" 
              description="Farmers haven't registered any new crops via USSD recently. Check back soon!" 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {crops.map((crop: any) => (
                <CropCard key={crop._id} crop={crop} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
