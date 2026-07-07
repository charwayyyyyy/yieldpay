'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Leaf, MapPin, Target, Sprout, Share2, CheckCircle2, Loader2, Copy } from 'lucide-react';
import Link from 'next/link';

export default function FarmPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [funding, setFunding] = useState(false);

  useEffect(() => {
    async function fetchFarm() {
      try {
        const res = await fetch(`/api/crops/${id}`);
        const json = await res.json();
        if (res.ok) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to load farm.');
        }
      } catch (err) {
        setError('Network error.');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchFarm();
  }, [id]);

  const handleFund = async () => {
    if (!data) return;
    setFunding(true);
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropCycleId: data.crop._id,
          shares: 1,
          customerName: "Anonymous Donor",
          customerPhone: "0240000000",
          customerEmail: "sponsor@yieldpay.ai",
          callbackUrl: `${window.location.origin}/api/webhooks/moolre`,
          redirectUrl: `${window.location.origin}/dashboard`
        })
      });
      const json = await res.json();
      if (res.ok && json.data?.paymentUrl) {
        window.location.href = json.data.paymentUrl;
      } else {
        alert(json.error || 'Failed to initiate funding');
        setFunding(false);
      }
    } catch (err) {
      alert('Network error');
      setFunding(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = "Help fund this harvest on YieldPay AI. Support a Ghanaian farmer before harvest and track the impact.";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moolre-navy" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  if (!data) return null;

  const { crop, farmer } = data;
  const progress = Math.min((crop.fundedAmount / crop.fundingRequired) * 100, 100);
  const isFunded = crop.status === 'funded' || progress >= 100;

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="flex items-center space-x-2">
           <Leaf className="text-moolre-green w-6 h-6" />
           <span className="font-fraunces font-bold text-xl text-moolre-navy">YieldPay</span>
        </Link>
        <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-moolre-green">Dashboard</Link>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-moolre-navy to-moolre-green relative">
             <div className="absolute inset-0 bg-black/20" />
             <div className="absolute bottom-6 left-6 text-white">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm mb-3 inline-block uppercase tracking-wider">
                  {crop.cropType}
                </span>
                <h1 className="text-3xl font-fraunces font-bold">{farmer.name}&apos;s Farm</h1>
             </div>
          </div>

          <div className="p-8">
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span>{crop.region}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Target className="w-5 h-5 text-gray-400" />
                <span>{crop.acres} Acres</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Sprout className="w-5 h-5 text-gray-400" />
                <span>Harvest: {new Date(crop.expectedHarvestDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-8">
               <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Funding Goal</p>
                    <p className="text-3xl font-bold text-moolre-navy">GHS {crop.fundingRequired}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Raised</p>
                    <p className="text-xl font-bold text-moolre-green">GHS {crop.fundedAmount}</p>
                  </div>
               </div>

               <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div className="bg-moolre-green h-3 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
               </div>
               <p className="text-sm text-gray-500 text-right">{progress.toFixed(0)}% Funded</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-10">
              {isFunded ? (
                <button disabled className="flex-1 py-4 bg-gray-200 text-gray-500 rounded-xl font-semibold flex items-center justify-center cursor-not-allowed">
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Already Funded
                </button>
              ) : (
                <button 
                  onClick={handleFund} 
                  disabled={funding}
                  className="flex-1 py-4 bg-moolre-green hover:bg-opacity-90 text-white rounded-xl font-semibold transition flex items-center justify-center disabled:opacity-70"
                >
                  {funding ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                  Fund this Harvest (GHS {crop.pricePerShare})
                </button>
              )}
            </div>

            <div className="border-t border-gray-100 pt-8">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
                <Share2 className="w-4 h-4 mr-2" /> Share & Impact
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                Sharing {farmer.name}&apos;s funding page increases their chance of a successful harvest by 40%. Help secure food supply in Ghana.
              </p>
              
              <div className="flex gap-3">
                <a 
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg flex items-center justify-center transition text-sm font-medium"
                >
                  <svg className="w-4 h-4 mr-2 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg> Twitter
                </a>
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg flex items-center justify-center transition text-sm font-medium"
                >
                  <svg className="w-4 h-4 mr-2 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                <button 
                  onClick={handleCopy}
                  className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg flex items-center justify-center transition text-sm font-medium"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2 text-gray-400" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
