import React from 'react';

export function HarvestProgress({ funded, required }: { funded: number, required: number }) {
  const percent = Math.min(Math.round((funded / required) * 100), 100);

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1 font-medium text-gray-700">
        <span>GHS {funded.toLocaleString()} Funded</span>
        <span>GHS {required.toLocaleString()} Goal</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div 
          className="bg-green-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <div className="text-right text-xs text-gray-500 mt-1">{percent}% Complete</div>
    </div>
  );
}
