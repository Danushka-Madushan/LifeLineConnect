import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

const CommitteeDashboard = () => {
  const [stats, setStats] = useState<CommitteeDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', url: '' });

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

  async function submitMaterial(e: React.FormEvent) {
    e.preventDefault();
    if (formData.title) {
      try {
        await api.post('/committee/awareness', { title: formData.title, description: formData.description, url: formData.url, published: true, mediaType: 'image' });
        toast("Awareness material published to the public portal!");
        setShowModal(false);
        setFormData({ title: '', description: '', url: '' });
      } catch {
        toast.error("Failed to publish.");
      }
    }
  }

  if (loading) return <div className="p-space-2xl text-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>;

  return (
    <div className="max-w-360 mx-auto px-space-2xl py-space-xl">
      <h1 className="font-heading text-3xl font-bold text-on-surface border-b border-surface-container pb-space-md mb-space-xl">Organizing Committee Hub</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg mb-space-xl">
        <div className="p-space-xl rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-space-md">
          <span className="font-label text-sm text-secondary uppercase">Active Camps</span>
          <span className="font-heading text-4xl font-bold text-primary">{stats?.activeCamps}</span>
          <Link to="/committee/camps" className="inline-block mt-space-sm px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors">Manage Camps </Link>
        </div>
        
        <div className="p-space-xl rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-space-md">
          <span className="font-label text-sm text-secondary uppercase">Total Donor Registrations</span>
          <span className="font-heading text-4xl font-bold text-on-surface">{stats?.totalRegistrations}</span>
        </div>

        <div className="p-space-xl rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-space-md">
          <span className="font-label text-sm text-secondary uppercase">Pending Transfers</span>
          <span className="font-heading text-4xl font-bold text-[#D97706]">{stats?.pendingTransfers}</span>
          <Link to="/committee/transfers" className="inline-block mt-space-sm px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors">View Transfers </Link>
        </div>

        <div className="p-space-xl rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-space-md">
          <span className="font-label text-sm text-secondary uppercase">Active Venues</span>
          <span className="font-heading text-4xl font-bold text-[#059669]">{stats?.activeVenues}</span>
          <Link to="/committee/venues" className="inline-block mt-space-sm px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors">Manage Venues</Link>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-surface-container p-space-xl rounded-2xl mt-space-2xl">
        <h2 className="font-heading text-xl font-bold mb-space-md">Quick Actions & Tools</h2>
        <div className="flex gap-space-md flex-wrap">
          <Link to="/committee/staff" className="flex items-center gap-space-sm bg-surface-container px-space-md py-space-sm rounded-lg hover:bg-surface-container-high transition-colors font-semibold">
            <span className="material-symbols-outlined text-[20px]">group</span> Manage Committee Staff
          </Link>
          <button 
            onClick={() => setShowModal(true)}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md">
            <h2 className="font-heading text-xl font-bold mb-4">Add Material</h2>
            <form onSubmit={submitMaterial} className="flex flex-col gap-4">
              <input type="text" placeholder="Title of the material" required className="p-2 border border-surface-container rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              <input type="text" placeholder="Description" className="p-2 border border-surface-container rounded" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <input type="text" placeholder="Media/Image URL" className="p-2 border border-surface-container rounded" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-surface-container rounded font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded font-bold">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitteeDashboard;
