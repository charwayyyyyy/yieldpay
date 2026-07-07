import dbConnect from '@/lib/db';
import { Farmer } from '@/models/Farmer';
import { CropCycle } from '@/models/CropCycle';
import { Transaction } from '@/models/Transaction';
import { WebhookEvent } from '@/models/WebhookEvent';
import { DisbursementLog } from '@/models/DisbursementLog';
import { SMSLog } from '@/models/SMSLog';
import { USSDSession } from '@/models/USSDSession';
import { InsuranceClaim } from '@/models/InsuranceClaim';
import { ShieldAlert, Activity, CheckCircle, Smartphone, Map, CreditCard, Send, Zap } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }: { searchParams: { key?: string } }) {
  const adminKey = process.env.ADMIN_DEMO_KEY;
  if (!adminKey || searchParams.key !== adminKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500">Provide the correct ?key= parameter to view the Admin Evidence Dashboard.</p>
        </div>
      </div>
    );
  }

  await dbConnect();

  // Fetch counts
  const totalFarmers = await Farmer.countDocuments();
  const activeCrops = await CropCycle.countDocuments({ status: { $in: ['open', 'partially_funded'] } });
  const totalCollections = await Transaction.countDocuments({ type: 'collection' });
  const totalDisbursements = await DisbursementLog.countDocuments();
  const totalWebhooks = await WebhookEvent.countDocuments();
  const totalSMS = await SMSLog.countDocuments();
  const totalUSSD = await USSDSession.countDocuments();
  const totalClaims = await InsuranceClaim.countDocuments();
  const aiApprovedClaims = await InsuranceClaim.countDocuments({ decision: 'approved' });

  // Fetch recent data
  const webhooks = await WebhookEvent.find().sort({ createdAt: -1 }).limit(10).lean();
  const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(10).populate('farmerId', 'name').populate('cropCycleId', 'cropType').lean();
  const disbursements = await DisbursementLog.find().sort({ createdAt: -1 }).limit(10).populate('farmerId', 'name').lean();
  const smsLogs = await SMSLog.find().sort({ createdAt: -1 }).limit(10).lean();
  const ussdSessions = await USSDSession.find().sort({ updatedAt: -1 }).limit(10).lean();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-moolre-navy text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2">
          <Activity className="text-moolre-green w-6 h-6" />
          <span className="font-fraunces font-bold text-xl">YieldPay Evidence Dashboard</span>
        </div>
        <Link href="/" className="text-sm hover:text-moolre-gold transition">Back to App</Link>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">System Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-12">
          <StatCard title="Farmers" value={totalFarmers} icon={<Map className="text-blue-500 w-5 h-5"/>} />
          <StatCard title="Active Crops" value={activeCrops} icon={<LeafIcon className="text-green-500 w-5 h-5"/>} />
          <StatCard title="Collections" value={totalCollections} icon={<CreditCard className="text-purple-500 w-5 h-5"/>} />
          <StatCard title="Disbursements" value={totalDisbursements} icon={<CheckCircle className="text-teal-500 w-5 h-5"/>} />
          <StatCard title="Webhooks" value={totalWebhooks} icon={<Zap className="text-orange-500 w-5 h-5"/>} />
          <StatCard title="SMS Sent" value={totalSMS} icon={<Send className="text-blue-400 w-5 h-5"/>} />
          <StatCard title="USSD Sessions" value={totalUSSD} icon={<Smartphone className="text-gray-600 w-5 h-5"/>} />
          <StatCard title="Total Claims" value={totalClaims} icon={<ShieldAlert className="text-red-500 w-5 h-5"/>} />
          <StatCard title="AI Approved" value={aiApprovedClaims} icon={<CheckCircle className="text-moolre-gold w-5 h-5"/>} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <TableCard title="Recent Moolre Webhooks">
            <table className="min-w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr><th>Date</th><th>Event</th><th>Reference</th><th>Processed</th></tr>
              </thead>
              <tbody>
                {webhooks.map((w: any) => (
                  <tr key={w._id} className="border-b">
                    <td className="py-2">{new Date(w.createdAt).toLocaleTimeString()}</td>
                    <td className="font-medium text-gray-900">{w.eventType}</td>
                    <td className="truncate max-w-[120px]">{w.reference}</td>
                    <td>{w.processed ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          <TableCard title="Recent Transactions">
             <table className="min-w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr><th>Ref</th><th>Type</th><th>Amt</th><th>Status</th></tr>
              </thead>
              <tbody>
                {transactions.map((t: any) => (
                  <tr key={t._id} className="border-b">
                    <td className="py-2 truncate max-w-[100px]">{t.reference}</td>
                    <td>{t.type}</td>
                    <td className="font-semibold text-gray-900">GHS {t.amount}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs ${t.status === 'success' ? 'bg-green-100 text-green-800' : t.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <TableCard title="SMS Logs">
             <table className="min-w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr><th>Phone</th><th>Status</th></tr>
              </thead>
              <tbody>
                {smsLogs.map((s: any) => (
                  <tr key={s._id} className="border-b">
                    <td className="py-2 truncate max-w-[100px]">{s.phoneNumber}</td>
                    <td>{s.status === 'sent' ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          <TableCard title="USSD Sessions">
            <table className="min-w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr><th>Phone</th><th>Step</th></tr>
              </thead>
              <tbody>
                {ussdSessions.map((u: any) => (
                  <tr key={u._id} className="border-b">
                    <td className="py-2 truncate max-w-[100px]">{u.phoneNumber}</td>
                    <td>{u.currentStep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
          
          <TableCard title="Disbursements">
             <table className="min-w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {disbursements.map((d: any) => (
                  <tr key={d._id} className="border-b">
                    <td className="py-2 font-semibold text-gray-900">GHS {d.amount}</td>
                    <td>{d.status === 'success' ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: any }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function TableCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function LeafIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 14 6h7v7a7 7 0 0 1-7 7Z"/>
      <path d="M11 20a7 7 0 0 0 7-7"/>
      <path d="M14 20a7 7 0 0 1-7-7"/>
    </svg>
  );
}
