import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

const BankDashboard = () => {
  const [stats, setStats] = useState<BankDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hospitals, setHospitals] = useState<string[]>([]);
  const [requestForm, setRequestForm] = useState({
    hospitalName: '',
    bloodGroup: '',
    unitsRequired: 1,
    priority: 'NORMAL',
    neededBy: new Date().toISOString().split('T')[0]
  });

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/blood-bank/dashboard');
      if (res.data.success) {
        setStats(res.data.data);
      }
      const hospRes = await api.get('/blood-bank/hospitals');
      if (hospRes.data.success) {
        setHospitals(hospRes.data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/blood-bank/hospital-requests', requestForm);
      if (res.data.success) {
        setShowRequestModal(false);
        setRequestForm({
          hospitalName: '',
          bloodGroup: '',
          unitsRequired: 1,
          priority: 'NORMAL',
          neededBy: new Date().toISOString().split('T')[0]
        });
        alert(res.data.message || 'Request created successfully!');
        fetchDashboard();
      }
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <Link to="/bloodbank/inventory" className="inline-block mt-space-sm px-space-md py-space-sm rounded-lg font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-all text-center">View Inventory</Link>
        </div>
        
        <div className="p-space-xl rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-space-md">
          <span className="font-label text-sm text-secondary uppercase">Incoming Transfers</span>
          <span className="font-heading text-4xl font-bold text-[#059669]">{stats?.incomingTransfers}</span>
          <Link to="/bloodbank/transfers" className="inline-block mt-space-sm px-space-md py-space-sm rounded-lg font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-all text-center">Incoming Transfers</Link>
        </div>

        <div className="p-space-xl rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-space-md">
          <span className="font-label text-sm text-secondary uppercase">Pending Hospital Reqs</span>
          <span className="font-heading text-4xl font-bold text-[#D97706]">{stats?.pendingRequests}</span>
          <Link to="/bloodbank/hospital-requests" className="inline-block mt-space-sm px-space-md py-space-sm rounded-lg font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-all text-center">Allocate Units</Link>
        </div>

        <div className={`p-space-xl rounded-2xl border flex flex-col gap-space-md ${(stats?.expiringSoon ?? 0) > 0 ? 'bg-error-container border-error text-on-error-container' : 'bg-surface-container-lowest border-surface-container'}`}>
          <span className="font-label text-sm uppercase opacity-80">Expiring Soon (&lt; 7 Days)</span>
          <span className={`font-heading text-4xl font-bold ${(stats?.expiringSoon ?? 0) > 0 ? 'text-error' : 'text-on-surface'}`}>{stats?.expiringSoon ?? 0}</span>
          <Link to="/bloodbank/inventory" className="inline-block mt-space-sm px-space-md py-space-sm rounded-lg font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-all text-center">Filter Inventory</Link>
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
            
            <button onClick={() => setShowRequestModal(true)} className="p-space-md rounded-xl bg-surface-container-lowest border border-surface-container hover:bg-surface-container transition-colors flex items-center gap-space-sm text-left">
              <span className="material-symbols-outlined text-primary">add_box</span>
              <span className="font-semibold text-sm">Request Blood</span>
            </button>
          </div>
        </div>
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl p-space-xl max-w-md w-full shadow-lg border border-surface-container">
            <div className="flex justify-between items-center mb-space-lg">
              <h3 className="font-heading text-xl font-bold text-on-surface">Request Blood Units</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateRequest} className="flex flex-col gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <label className="font-label text-sm font-semibold">Requesting Hospital Name</label>
                <input required type="text" list="hospital-list" value={requestForm.hospitalName} onChange={e => setRequestForm({...requestForm, hospitalName: e.target.value})} className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface" placeholder="e.g. General Hospital" />
                <datalist id="hospital-list">
                  {hospitals.map((h, i) => <option key={i} value={h} />)}
                </datalist>
              </div>
              
              <div className="grid grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label text-sm font-semibold">Blood Group</label>
                  <select required value={requestForm.bloodGroup} onChange={e => setRequestForm({...requestForm, bloodGroup: e.target.value})} className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface">
                    <option value="" disabled>Select...</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label text-sm font-semibold">Units</label>
                  <input required type="number" min="1" value={requestForm.unitsRequired} onChange={e => setRequestForm({...requestForm, unitsRequired: parseInt(e.target.value)})} className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label text-sm font-semibold">Priority</label>
                  <select required value={requestForm.priority} onChange={e => setRequestForm({...requestForm, priority: e.target.value})} className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface">
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label text-sm font-semibold">Needed By</label>
                  <input required type="date" value={requestForm.neededBy} onChange={e => setRequestForm({...requestForm, neededBy: e.target.value})} className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface" />
                </div>
              </div>

              <div className="mt-space-md flex justify-end gap-space-sm">
                <button type="button" onClick={() => setShowRequestModal(false)} className="px-space-md py-space-sm rounded-lg font-semibold text-secondary hover:bg-surface-container transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-space-md py-space-sm rounded-lg font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankDashboard;
