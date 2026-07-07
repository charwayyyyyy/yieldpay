'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle2, XCircle, Clock, Smartphone, Database, Globe, BrainCircuit } from 'lucide-react';

type TimelineEvent = {
  id: string;
  timestamp: string;
  type: string;
  status: string;
  source: string;
  reference: string;
  message: string;
};

export default function TraceTimeline({ adminKey }: { adminKey: string }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchTrace = async (searchQuery?: string) => {
    setLoading(true);
    setError('');
    try {
      const url = new URL('/api/admin/trace', window.location.origin);
      url.searchParams.append('key', adminKey);
      if (searchQuery) {
        url.searchParams.append('q', searchQuery);
      }

      const res = await fetch(url.toString());
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to fetch trace');
        setData(null);
      } else {
        setData(json.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrace(query);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'USSD': return <Smartphone className="w-4 h-4 text-gray-500" />;
      case 'MongoDB': return <Database className="w-4 h-4 text-blue-500" />;
      case 'Moolre': return <Globe className="w-4 h-4 text-orange-500" />;
      case 'Gemini': return <BrainCircuit className="w-4 h-4 text-purple-500" />;
      case 'Web': return <Globe className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'success' || s === 'approved' || s === 'paid' || s === '1') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (s === 'failed' || s === 'rejected') return <XCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">End-to-End System Trace</h3>
          <p className="text-sm text-gray-500">Trace a crop cycle through USSD, Moolre APIs, and AI.</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex max-w-md w-full">
          <input
            type="text"
            placeholder="Search crop ID, phone, or tx ref..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-moolre-navy"
          />
          <button type="submit" className="px-4 py-2 bg-moolre-navy text-white rounded-r-lg hover:bg-opacity-90 flex items-center">
            <Search className="w-4 h-4 mr-2" /> Search
          </button>
        </form>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-moolre-navy" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            <p>{error}</p>
          </div>
        ) : data ? (
          <div>
            <div className="mb-8 p-4 bg-blue-50 rounded-lg flex flex-col md:flex-row justify-between">
              <div>
                <p className="text-sm text-blue-800 font-semibold mb-1">Crop Cycle Details</p>
                <p className="text-gray-700"><strong>Type:</strong> {data.crop.cropType}</p>
                <p className="text-gray-700"><strong>Acres:</strong> {data.crop.acres}</p>
                <p className="text-gray-700"><strong>Status:</strong> {data.crop.status}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <p className="text-sm text-blue-800 font-semibold mb-1">Farmer Details</p>
                <p className="text-gray-700"><strong>Name:</strong> {data.farmer?.name || 'Unknown'}</p>
                <p className="text-gray-700"><strong>Phone:</strong> {data.farmer?.phone || 'Unknown'}</p>
                <p className="text-gray-700"><strong>Region:</strong> {data.crop.region}</p>
              </div>
            </div>

            <div className="relative border-l-2 border-gray-200 ml-4 md:ml-6 mt-6">
              {data.timeline.length === 0 ? (
                <p className="text-gray-500 pl-6 py-4">No events found for this trace.</p>
              ) : (
                data.timeline.map((event: TimelineEvent, idx: number) => (
                  <div key={event.id + idx} className="mb-8 pl-8 relative group">
                    <div className="absolute -left-3 top-1 bg-white">
                      {getStatusIcon(event.status)}
                    </div>
                    
                    <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm group-hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          {getSourceIcon(event.source)}
                          <span className="text-xs font-semibold text-gray-500 uppercase">{event.source}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm font-medium text-gray-900">{event.type}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{event.message}</p>
                      <div className="bg-gray-50 px-3 py-1 rounded inline-block">
                        <span className="text-xs font-mono text-gray-600">Ref: {event.reference}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
