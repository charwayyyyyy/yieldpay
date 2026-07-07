import React from 'react';

type StatusType = 'open' | 'partially_funded' | 'funded' | 'harvested' | 'failed' | 'cancelled';

export function StatusBadge({ status }: { status: StatusType | string }) {
  const getStyles = (s: string) => {
    switch (s) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'partially_funded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'funded':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'harvested':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLabel = (s: string) => {
    switch (s) {
      case 'partially_funded': return 'Partially Funded';
      default: return s.charAt(0).toUpperCase() + s.slice(1);
    }
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyles(status)}`}>
      {getLabel(status)}
    </span>
  );
}
