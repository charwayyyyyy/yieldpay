import React from 'react';

export default function ApiDocs() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-fraunces font-bold text-moolre-navy mb-8">YieldPay API & Moolre Integration Documentation</h1>
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-moolre-green mb-4">Architecture Overview</h2>
        <p className="text-gray-700 mb-4">
          YieldPay AI uses a headless architecture for money routing. We do not hold escrow funds; instead, we act as an orchestration layer using <strong>Moolre&apos;s Fintech APIs</strong>.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-moolre-green mb-4">1. Moolre Collections API (Payment Links)</h2>
        <p className="text-gray-700 mb-4">
          When an urban buyer funds a crop, we generate a Moolre payment link.
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li><strong>Endpoint:</strong> <code>/v1/collections</code> (Wrapped via <code>api.moolre.com/embed/link</code>)</li>
          <li><strong>YieldPay Implementation:</strong> <code>lib/moolre.ts -&gt; createCollectionPayment()</code></li>
          <li><strong>Flow:</strong> We create a pending <code>Transaction</code> in MongoDB, generate the payment link passing our production Webhook URL, and redirect the user to checkout.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-moolre-green mb-4">2. Moolre Webhooks</h2>
        <p className="text-gray-700 mb-4">
          YieldPay listens for asynchronous payment confirmations from Moolre.
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li><strong>Endpoint:</strong> <code>/api/webhooks/moolre</code></li>
          <li><strong>Flow:</strong> Webhook payload is received. We check idempotency using the transaction reference. If successful, we update the <code>CropCycle</code> funded amount and create a buyer <code>Subscription</code>.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-moolre-green mb-4">3. Moolre Disbursements API</h2>
        <p className="text-gray-700 mb-4">
          Once a crop cycle is fully funded, capital is routed instantly to the farmer&apos;s mobile money wallet.
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li><strong>Endpoint:</strong> <code>/v1/disbursements</code> (Wrapped via <code>api.moolre.com/open/transact/transfer</code>)</li>
          <li><strong>YieldPay Implementation:</strong> <code>lib/moolre.ts -&gt; initiateDisbursement()</code></li>
          <li><strong>Flow:</strong> The webhook triggers this. A <code>DisbursementLog</code> is created, and the funds are pushed directly to the farmer without intermediary delays.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-moolre-green mb-4">4. Moolre USSD Integration</h2>
        <p className="text-gray-700 mb-4">
          Farmers interact with YieldPay offline via USSD.
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li><strong>Endpoint:</strong> <code>/api/ussd</code> (Callback for Moolre USSD Gateway)</li>
          <li><strong>Flow:</strong> Moolre sends POST requests containing <code>sessionId</code> and <code>text</code>. YieldPay maintains session state in MongoDB (<code>USSDSession</code>), parses the inputs (like crop type and acres), and returns <code>CON</code> or <code>END</code> strings as per the standard protocol.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-moolre-green mb-4">5. Moolre SMS Integration</h2>
        <p className="text-gray-700 mb-4">
          Real-time alerts for farmers and buyers.
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li><strong>Endpoint:</strong> <code>/v1/sms</code> (Wrapped via <code>api.moolre.com/open/sms/send</code>)</li>
          <li><strong>YieldPay Implementation:</strong> <code>lib/moolre.ts -&gt; sendSMS()</code></li>
          <li><strong>Flow:</strong> Used to confirm USSD crop registration, notify farmers of received funds, and update them on AI insurance claim decisions.</li>
        </ul>
      </section>
    </div>
  );
}
