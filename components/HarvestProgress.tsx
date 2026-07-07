import React from 'react';

export function HarvestProgress({ stage }: { stage: string }) {
  const stages = ['registered', 'funded', 'planting', 'growing', 'harvesting', 'complete'];
  
  // Default to 1 if not found, to ensure something shows
  const currentIndex = Math.max(0, stages.indexOf(stage));
  const percent = Math.min(100, Math.round((currentIndex / (stages.length - 1)) * 100));

  const displayStage = stage ? stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ') : 'Registered';

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1.5 font-bold text-moolre-navy">
        <span>Lifecycle: {displayStage}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-moolre-green h-2 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
