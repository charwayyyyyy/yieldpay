"use client";
import React, { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { HarvestProgress } from './HarvestProgress';
import { MapPin, Calendar, CheckCircle, Sprout, ShieldAlert } from 'lucide-react';

export function CropCard({ crop }: { crop: any }) {
  const [fundingAmount, setFundingAmount] = useState(crop.pricePerShare);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFundable = crop.status === 'open' || crop.status === 'partially_funded';
  const progress = Math.min(100, Math.round((crop.fundedAmount / crop.fundingRequired) * 100));

  const handleFund = (e: React.FormEvent) => {
    setIsSubmitting(true);
    // Let the form submit normally to the Next.js API route
  };

  return (
    <div className="group bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full relative">
      
      {/* Decorative top gradient */}
      <div className="h-2 w-full bg-gradient-to-r from-moolre-green to-moolre-gold"></div>

      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 text-moolre-green font-bold text-xl mb-1">
              <Sprout className="w-5 h-5" />
              {crop.cropType}
            </div>
            <div className="text-gray-500 text-sm flex items-center gap-1 font-medium">
              <MapPin className="w-4 h-4" /> {crop.region}, {crop.district}
            </div>
          </div>
          <StatusBadge status={crop.status} />
        </div>

        <div className="bg-moolre-light rounded-2xl p-4 mb-6 border border-gray-100">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Target Capital</span>
            <span className="font-bold text-moolre-navy">GHS {crop.fundingRequired.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-500">Funded</span>
            <span className="font-bold text-moolre-green">GHS {crop.fundedAmount.toLocaleString()}</span>
          </div>
          
          {/* Custom Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1 overflow-hidden relative">
            <div 
              className="bg-gradient-to-r from-moolre-green to-moolre-gold h-2.5 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-right text-xs font-bold text-moolre-gold mt-1">{progress}% Complete</div>
        </div>

        <div className="space-y-3 mb-6 flex-grow">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="bg-green-100 p-2 rounded-full text-moolre-green">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="font-medium">Harvest: {new Date(crop.expectedHarvestDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="font-medium">{crop.acres} Acres</span>
          </div>
          {crop.insuranceClaimId && (
            <div className="flex items-center gap-3 text-sm text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100 mt-2">
              <ShieldAlert className="w-4 h-4" />
              <span className="font-semibold">AI Insurance Claim Active</span>
            </div>
          )}
        </div>

        {/* Action Area */}
        {isFundable ? (
          <form method="POST" action="/api/payments/create" onSubmit={handleFund} className="mt-auto pt-4 border-t border-gray-100">
            <input type="hidden" name="cropCycleId" value={crop._id} />
            <div className="space-y-3 mb-4">
              <input 
                type="text" 
                name="buyerName" 
                placeholder="Your Name" 
                required 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-moolre-green focus:border-transparent transition-all"
              />
              <div className="flex gap-2">
                <input 
                  type="email" 
                  name="buyerEmail" 
                  placeholder="Email" 
                  required 
                  className="w-1/2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-moolre-green focus:border-transparent transition-all"
                />
                <input 
                  type="tel" 
                  name="buyerPhone" 
                  placeholder="Phone" 
                  required 
                  className="w-1/2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-moolre-green focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">Investment Amount (GHS)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₵</span>
                  <input 
                    type="number" 
                    name="amount" 
                    value={fundingAmount} 
                    onChange={(e) => setFundingAmount(Number(e.target.value))}
                    min={crop.pricePerShare} 
                    step={crop.pricePerShare}
                    required 
                    className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-moolre-navy focus:outline-none focus:ring-2 focus:ring-moolre-green focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-moolre-navy hover:bg-moolre-green text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {isSubmitting ? 'Connecting to Moolre...' : `Fund Farm (GHS ${fundingAmount})`}
            </button>
          </form>
        ) : (
          <div className="mt-auto pt-4 border-t border-gray-100">
             <HarvestProgress stage={crop.stage} />
          </div>
        )}
      </div>
    </div>
  );
}
