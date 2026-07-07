"use client";
import React, { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { HarvestProgress } from './HarvestProgress';
import { MapPin, Calendar, CheckCircle } from 'lucide-react';

export function CropCard({ crop }: { crop: any }) {
  const [isFunding, setIsFunding] = useState(false);

  const handleFundClick = () => {
    setIsFunding(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col">
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{crop.acres} Acres of {crop.cropType}</h3>
            <div className="flex items-center text-gray-500 text-sm mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {crop.region} Region, {crop.district}
            </div>
          </div>
          <StatusBadge status={crop.status} />
        </div>

        <HarvestProgress funded={crop.fundedAmount} required={crop.fundingRequired} />

        <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-1.5 text-green-600" />
            <span className="font-medium">Harvest: {new Date(crop.expectedHarvestDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-gray-600">
             <CheckCircle className="w-4 h-4 mr-1.5 text-blue-600" />
             <span>{crop.stage}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 border-t border-gray-100">
        {crop.status !== 'funded' && crop.status !== 'harvested' && crop.status !== 'completed' ? (
          isFunding ? (
            <form action="/api/payments/create" method="POST" className="flex flex-col gap-2">
              <input type="hidden" name="cropCycleId" value={crop._id} />
              <input required type="text" name="buyerName" placeholder="Your Name" className="w-full px-3 py-2 border rounded-md text-sm" />
              <input required type="tel" name="buyerPhone" placeholder="Phone (e.g. 024...)" className="w-full px-3 py-2 border rounded-md text-sm" />
              <input required type="email" name="buyerEmail" placeholder="Email" className="w-full px-3 py-2 border rounded-md text-sm" />
              <div className="flex items-center gap-2">
                 <span className="text-gray-500 font-medium">GHS</span>
                 <input required type="number" name="amount" min="10" max={crop.fundingRequired - crop.fundedAmount} placeholder="Amount" className="w-full px-3 py-2 border rounded-md text-sm" />
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setIsFunding(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md font-medium text-sm hover:bg-gray-300 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-md font-medium text-sm hover:bg-green-700 transition-colors">Proceed to Pay</button>
              </div>
            </form>
          ) : (
            <button 
              onClick={handleFundClick}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center"
            >
              Fund this Harvest
            </button>
          )
        ) : (
          <button disabled className="w-full bg-gray-200 text-gray-500 py-2.5 rounded-lg font-semibold cursor-not-allowed">
            Fully Funded
          </button>
        )}
      </div>
    </div>
  );
}
