import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

const CommitteeDashboard = () => {
  const [stats, setStats] = useState<CommitteeDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/committee/dashboard');
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
      <h1 className="font-heading text-3xl font-bold text-on-surface border-b border-surface-container pb-space-md mb-space-xl">Organizing Committee Hub</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg mb-space-xl">
        <div className="p-space-xl rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-space-md">
          <span className="font-label text-sm text-secondary uppercase">Active Camps</span>
          <span className="font-heading text-4xl font-bold text-primary">{stats?.activeCamps}</span>
          <Link to="/committee/camps" className="text-primary text-sm font-bold hover:underline mt-auto">Manage Camps →</Link>
        </div>
        
        <div className="p-space-xl rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-space-md">
          <span className="font-label text-sm text-secondary uppercase">Total Donor Registrations</span>
          <span className="font-heading text-4xl font-bold text-on-surface">{stats?.totalRegistrations}</span>
        </div>

        <div className="p-space-xl rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-space-md">
          <span className="font-label text-sm text-secondary uppercase">Pending Transfers</span>
          <span className="font-heading text-4xl font-bold text-[#D97706]">{stats?.pendingTransfers}</span>
          <Link to="/committee/transfers" className="text-[#D97706] text-sm font-bold hover:underline mt-auto">View Transfers →</Link>
        </div>

        <div className="p-space-xl rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-space-md">
          <span className="font-label text-sm text-secondary uppercase">Active Venues</span>
          <span className="font-heading text-4xl font-bold text-[#059669]">{stats?.activeVenues}</span>
          <Link to="/committee/venues" className="text-[#059669] text-sm font-bold hover:underline mt-auto">Manage Venues →</Link>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-surface-container p-space-xl rounded-2xl mt-space-2xl">
        <h2 className="font-heading text-xl font-bold mb-space-md">Quick Actions & Tools</h2>
        <div className="flex gap-space-md flex-wrap">
          <Link to="/committee/staff" className="flex items-center gap-space-sm bg-surface-container px-space-md py-space-sm rounded-lg hover:bg-surface-container-high transition-colors font-semibold">
            <span className="material-symbols-outlined text-[20px]">group</span> Manage Committee Staff
          </Link>
          <button 
            onClick={async () => {
              const title = prompt("Title of the material:");
              if (!title) return;
              const desc = prompt("Description:");
              const url = prompt("Media/Image URL:");
              try {
                await api.post('/committee/awareness', { title, description: desc, url, published: true, mediaType: 'image' });
                toast("Awareness material published to the public portal!");
              } catch {
                toast.error("Failed to publish.");
              }
            }}
            className="flex items-center gap-space-sm bg-surface-container px-space-md py-space-sm rounded-lg hover:bg-surface-container-high transition-colors font-semibold">
            <span className="material-symbols-outlined text-[20px]">campaign</span> Post Awareness Material
          </button>
          <button 
            onClick={async () => {
              try {
                const res = await api.get('/committee/reports/camps', { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'Camps_Report.pdf');
                document.body.appendChild(link);
                link.click();
                link.remove();
              } catch (e) {
                console.error(e);
              }
            }}
            className="flex items-center gap-space-sm bg-surface-container px-space-md py-space-sm rounded-lg hover:bg-surface-container-high transition-colors font-semibold">
            <span className="material-symbols-outlined text-[20px]">summarize</span> Export Camps Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommitteeDashboard;
