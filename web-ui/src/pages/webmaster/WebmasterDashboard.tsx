import { useState, useEffect } from 'react';

import { api } from '../../lib/api';

interface DashboardStats {
  totalDonors: number;
  totalBanks: number;
  totalCommittees: number;
  ongoingCamps: number;
  completedCamps: number;
  totalDonations: number;
  pendingRequests: number;
}

interface OverviewStats {
  activeAppeals: number;
  totalCommunityThreads: number;
  systemHealth: string;
  uptime: string;
}

const WebmasterDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, overRes] = await Promise.all([
          api.get('/webmaster/dashboard'),
          api.get('/webmaster/overview')
        ]);
        if (dashRes.data.success) setStats(dashRes.data.data);
        if (overRes.data.success) setOverview(overRes.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load webmaster data. Are you authorized?');
      }
    };
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="p-space-2xl text-center">
        <div className="inline-block p-space-lg bg-error-container text-on-error-container rounded-lg">
          <span className="material-symbols-outlined text-4xl mb-space-sm block">error</span>
          {error}
        </div>
      </div>
    );
  }

  if (!stats || !overview) {
    return <div className="p-space-2xl text-center flex flex-col items-center gap-space-sm">
      <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
      <p>Loading global statistics...</p>
    </div>;
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-space-4xl py-space-3xl flex flex-col gap-space-4xl">
      <div className="flex flex-col gap-space-sm border-b border-surface-container pb-space-lg">
        <h1 className="font-heading text-4xl font-bold text-on-surface flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-[36px] text-primary">monitoring</span>
          Webmaster Dashboard
        </h1>
        <p className="font-body text-lg text-secondary">Global System Health & Overview (Read-Only)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg">
        <StatCard icon="diversity_1" title="Total Donors" value={stats.totalDonors} color="text-primary" />
        <StatCard icon="local_hospital" title="Blood Banks" value={stats.totalBanks} color="text-[#059669]" />
        <StatCard icon="corporate_fare" title="Committees" value={stats.totalCommittees} color="text-[#0284C7]" />
        <StatCard icon="campaign" title="Ongoing Camps" value={stats.ongoingCamps} color="text-[#D97706]" />
        <StatCard icon="check_circle" title="Completed Camps" value={stats.completedCamps} color="text-[#4F46E5]" />
        <StatCard icon="bloodtype" title="Total Donations" value={stats.totalDonations} color="text-[#E11D48]" />
        <StatCard icon="pending_actions" title="Pending Hospital Reqs" value={stats.pendingRequests} color="text-[#C026D3]" />
        <StatCard icon="emergency" title="Active Appeals" value={overview.activeAppeals} color="text-error" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-xl">
        <div className="p-space-xl rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col gap-space-lg">
          <h2 className="font-heading text-xl font-bold text-on-surface border-b border-surface-container pb-space-sm">System Health</h2>
          <div className="flex flex-col gap-space-md">
            <div className="flex justify-between items-center">
              <span className="font-label text-secondary">Status</span>
              <span className={`font-bold ${overview.systemHealth === 'GOOD' ? 'text-[#059669]' : 'text-error'}`}>
                {overview.systemHealth}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-label text-secondary">Uptime</span>
              <span className="font-bold text-on-surface">{overview.uptime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-label text-secondary">Oracle Database</span>
              <span className="font-bold text-[#059669]">Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-label text-secondary">MongoDB Cluster</span>
              <span className="font-bold text-[#059669]">Connected</span>
            </div>
          </div>
        </div>

        <div className="p-space-xl rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col gap-space-lg">
          <h2 className="font-heading text-xl font-bold text-on-surface border-b border-surface-container pb-space-sm">Community Overview</h2>
          <div className="flex flex-col gap-space-md">
            <div className="flex justify-between items-center">
              <span className="font-label text-secondary">Total Threads</span>
              <span className="font-bold text-on-surface">{overview.totalCommunityThreads}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-surface-container p-space-xl rounded-2xl">
        <h2 className="font-heading text-2xl font-bold mb-space-lg text-on-surface">Administration & Reports</h2>
        <div className="flex gap-space-md flex-wrap">
          <button 
            onClick={async () => {
              try {
                const res = await api.get('/webmaster/users');
                if (res.data.success) {
                  console.table(res.data.data);
                  alert(`Loaded ${res.data.data.length} users in console.`);
                }
              } catch(e) { alert("Failed to fetch users"); }
            }}
            className="flex items-center gap-space-sm bg-surface-container px-space-md py-space-sm rounded-lg hover:bg-surface-container-high transition-colors font-semibold"
          >
            <span className="material-symbols-outlined text-[20px]">manage_accounts</span> View All Users
          </button>
          
          <button 
            onClick={async () => {
              const title = prompt("Guideline Title:");
              if (!title) return;
              const desc = prompt("Description:");
              const type = prompt("Category (e.g. ELIGIBILITY, PRE_DONATION):", "PRE_DONATION");
              try {
                await api.post('/webmaster/guidelines', { title, description: desc, category: type, isActive: true });
                alert("Medical guideline published successfully.");
              } catch(e) { alert("Failed to publish guideline"); }
            }}
            className="flex items-center gap-space-sm bg-surface-container px-space-md py-space-sm rounded-lg hover:bg-surface-container-high transition-colors font-semibold"
          >
            <span className="material-symbols-outlined text-[20px]">health_and_safety</span> Publish Medical Guideline
          </button>

          <button 
            onClick={async () => {
              try {
                const res = await api.get('/webmaster/reports/system', { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'System_Audit_Report.pdf');
                document.body.appendChild(link);
                link.click();
                link.remove();
              } catch (e) {
                console.error(e);
              }
            }}
            className="flex items-center gap-space-sm bg-primary text-on-primary px-space-md py-space-sm rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span> Export System Audit Report
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color }: { icon: string, title: string, value: number, color: string }) => (
  <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container hover:shadow-sm transition-shadow flex items-center gap-space-md">
    <div className={`p-space-md rounded-full bg-surface-container ${color} flex items-center justify-center`}>
      <span className="material-symbols-outlined text-[28px]">{icon}</span>
    </div>
    <div className="flex flex-col">
      <span className="font-label text-xs uppercase tracking-wider text-secondary">{title}</span>
      <span className="font-heading text-2xl font-bold text-on-surface">{value.toLocaleString()}</span>
    </div>
  </div>
);

export default WebmasterDashboard;

