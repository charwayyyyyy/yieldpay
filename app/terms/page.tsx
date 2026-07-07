import React from 'react';

export default function TermsOfUse() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-fraunces font-bold text-moolre-navy mb-8">Terms of Use</h1>
      <p className="text-gray-700 mb-4">Last updated: July 2026</p>
      <p className="text-gray-700 mb-4">By using YieldPay AI, you agree to the following terms:</p>
      <ul className="list-disc pl-6 text-gray-700 space-y-2">
        <li><strong>For Buyers:</strong> Investments in agricultural crop cycles carry inherent natural risks. YieldPay AI acts as a technology intermediary and does not guarantee crop yields.</li>
        <li><strong>For Farmers:</strong> You agree to provide accurate updates on crop progress via USSD and use funds strictly for operating capital.</li>
        <li><strong>Payments:</strong> All transactions are securely processed by Moolre. YieldPay AI does not hold funds.</li>
      </ul>
    </div>
  );
}
