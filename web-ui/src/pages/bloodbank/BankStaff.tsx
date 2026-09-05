import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const BankStaff = () => {
  const [staff, setStaff] = useState<BankStaffDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', positionTitle: '', email: '', phone: '' });

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    try {
      const res = await api.get('/blood-bank/staff');
      if (res.data.success) {
        setStaff(res.data.data.filter((s: BankStaffDto) => s.status === 'ACTIVE'));
      }
    } finally {
      setLoading(false);
    }
  };

  async function submitAddStaff(e: React.FormEvent) {
    e.preventDefault();
    if (formData.fullName && formData.positionTitle) {
      try {
        await api.post('/blood-bank/staff', formData);
        fetchStaff();
        setShowModal(false);
        setFormData({ fullName: '', positionTitle: '', email: '', phone: '' });
      } catch {
        toast.error('Failed to add staff');
      }
    }
  }

  async function handleRemove(id: number) {
    if (window.confirm("Remove this staff member?")) {
      try {
        await api.delete(`/blood-bank/staff/${id}`);
        fetchStaff();
      } catch {
        toast.error('Failed to remove staff');
      }
    }
  };

  return (
    <div className="max-w-250 mx-auto px-space-2xl py-space-xl">
      <div className="flex justify-between items-center border-b border-surface-container pb-space-md mb-space-xl">
        <h1 className="font-heading text-3xl font-bold text-on-surface">Assigned Medical Staff</h1>
        <button onClick={() => setShowModal(true)} className="bg-primary text-on-primary px-space-md py-space-sm rounded-lg font-bold flex items-center gap-1 hover:bg-primary/90">
          <span className="material-symbols-outlined text-[20px]">person_add</span> Add Staff
        </button>
      </div>
      
      {loading ? (
        <div className="text-center p-space-2xl"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>
      ) : staff.length === 0 ? (
        <div className="text-center p-space-2xl text-secondary bg-surface-container-lowest rounded-xl border border-surface-container">
          No active staff assigned to this blood bank.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
          {staff.map((s) => (
            <div key={s.staffId} className="bg-surface-container-lowest border border-surface-container rounded-2xl p-space-lg flex items-center gap-space-md hover:shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl uppercase shrink-0">
                {s.fullName.charAt(0)}
              </div>
              <div className="flex flex-col flex-1">
                <span className="font-bold text-on-surface">{s.fullName}</span>
                <span className="text-xs text-secondary font-semibold">{s.positionTitle || 'Staff Member'}</span>
                <div className="flex items-center gap-space-sm mt-space-xs text-xs text-secondary">
                  {s.phone && <span>{s.phone}</span>}
                  {s.email && <span>{s.email}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-space-sm py-[2px] rounded-full text-[10px] font-bold uppercase ${s.status === 'ACTIVE' ? 'bg-[#059669]/10 text-[#059669]' : 'bg-surface-container-high'}`}>
                  {s.status}
                </span>
                <button onClick={() => handleRemove(s.staffId)} className="px-3 py-1 bg-error-container text-error rounded hover:bg-error hover:text-white text-xs font-bold transition-colors">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md">
            <h2 className="font-heading text-xl font-bold mb-4">Add Staff</h2>
            <form onSubmit={submitAddStaff} className="flex flex-col gap-4">
              <input type="text" placeholder="Full Name" required className="p-2 border border-surface-container rounded" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              <input type="text" placeholder="Position Title (e.g. Phlebotomist, Manager)" required className="p-2 border border-surface-container rounded" value={formData.positionTitle} onChange={e => setFormData({...formData, positionTitle: e.target.value})} />
              <input type="email" placeholder="Email" className="p-2 border border-surface-container rounded" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <input type="tel" placeholder="Phone" className="p-2 border border-surface-container rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
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

export default BankStaff;
