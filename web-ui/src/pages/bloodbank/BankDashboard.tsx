import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

const BankDashboard = () => {
  const [stats, setStats] = useState<BankDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/blood-bank/dashboard');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="p-space-2xl text-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>;

  return (
    <div className="max-w-360 mx-auto px-space-2xl py-space-xl">
      <h1 className="font-heading text-3xl font-bold text-on-surface border-b border-surface-container pb-space-md mb-space-xl">Blood Bank Operations</h1>
      
      {stats?.lowStockGroups && stats.lowStockGroups.length > 0 && (
        <div className="mb-space-xl p-space-md rounded bg-[#e11d48]/10 border border-[#e11d48] text-[#e11d48] font-bold">
          <span className="material-symbols-outlined align-middle mr-2">warning</span>
          Low Stock Alert: {stats.lowStockGroups.join(', ')}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg mb-space-xl">
        <div className="p-space-xl rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-space-md">
          <span className="font-label text-sm text-secondary uppercase">Available Units</span>
          <span className="font-heading text-4xl font-bold text-primary">{stats?.totalUnits}</span>
          <Link to="/bloodbank/inventory" className="text-primary text-sm font-bold hover:underline mt-auto">View Inventory →</Link>
        </div>
        
        <div className="p-space-xl rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-space-md">
          <span className="font-label text-sm text-secondary uppercase">Incoming Transfers</span>
          <span className="font-heading text-4xl font-bold text-[#059669]">{stats?.incomingTransfers}</span>
          <Link to="/bloodbank/transfers" className="text-[#059669] text-sm font-bold hover:underline mt-auto">Receive Transfers →</Link>
        </div>

        <div className="p-space-xl rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-space-md">
          <span className="font-label text-sm text-secondary uppercase">Pending Hospital Reqs</span>
          <span className="font-heading text-4xl font-bold text-[#D97706]">{stats?.pendingRequests}</span>
          <Link to="/bloodbank/hospital-requests" className="text-[#D97706] text-sm font-bold hover:underline mt-auto">Allocate Units →</Link>
        </div>

        <div className={`p-space-xl rounded-2xl border flex flex-col gap-space-md ${(stats?.expiringSoon ?? 0) > 0 ? 'bg-error-container border-error text-on-error-container' : 'bg-surface-container-lowest border-surface-container'}`}>
          <span className="font-label text-sm uppercase opacity-80">Expiring Soon (&lt; 7 Days)</span>
          <span className={`font-heading text-4xl font-bold ${(stats?.expiringSoon ?? 0) > 0 ? 'text-error' : 'text-on-surface'}`}>{stats?.expiringSoon ?? 0}</span>
          <Link to="/bloodbank/inventory" className="text-sm font-bold hover:underline mt-auto">Filter Inventory →</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-xl">
        <div className="flex flex-col gap-space-md">
          <h2 className="font-heading text-xl font-bold text-on-surface border-b border-surface-container pb-space-sm">Management</h2>
          <div className="grid grid-cols-2 gap-space-sm">
            <Link to="/bloodbank/staff" className="p-space-md rounded-xl bg-surface-container-lowest border border-surface-container hover:bg-surface-container transition-colors flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary">badge</span>
              <span className="font-semibold text-sm">Medical Staff</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankDashboard;
