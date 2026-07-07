# YieldPay AI

YieldPay AI turns urban food demand into direct pre-harvest financing for Ghanaian farmers using web payments, USSD crop registration, SMS alerts, automated disbursements, and AI-assisted crop risk insurance.

**Built for the Moolre Startup Cup.**

## Architecture

YieldPay uses a Push-and-Pull model:
- **Farmers** use USSD (`*919*4018#` or similar) to register crops, update progress, and file insurance claims without internet access.
- **Urban Buyers** use the Web Marketplace to discover open crop cycles and fund them via Moolre Collections.
- **System** sends SMS alerts for funding, progress, and AI insurance payouts via Moolre SMS and Disbursements.

## Tech Stack
- **Frontend**: Next.js (App Router), Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB Atlas with Mongoose
- **Integrations**: Moolre API (Collections, Disbursements, SMS, USSD Webhooks), Google Gemini AI

## Environment Setup
Copy `.env.example` to `.env.local` and configure:

1. **MongoDB Atlas**: Get your connection string from MongoDB Atlas.
2. **Moolre**: Add your API Key, Secret Key, and Endpoint paths.
3. **Gemini**: Add your `GEMINI_API_KEY` for AI insurance processing.

## Running Locally
```bash
npm install
npm run seed  # (Optional: seeds initial farmers and crops)
npm run dev
```

## Vercel Deployment & USSD
When deploying to Vercel, ensure you add the Environment Variables in the project settings.

**USSD CALLBACK URL:**
After deploying on Vercel, use:
`https://YOUR-PRODUCTION-DOMAIN/api/ussd`

Example:
`https://yieldpay-ai.vercel.app/api/ussd`

Put this into the Moolre USSD service settings under Callback URL for your approved code.

## Demo Flow & Judging Alignment
YieldPay AI is engineered to win the Moolre Startup Cup criteria:
- **Best Integration**: Native integration with Moolre Collections, Disbursements, SMS, and USSD webhooks.
- **Practical AI**: Gemini structured JSON validates insurance claims based on severity.
- **Social Impact**: Bridges urban capital with rural agriculture directly.
- **Zagey Vision**: Creates economic pipelines that empower everyday producers.
