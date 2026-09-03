import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const BankStaff = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/blood-bank/staff');
      if (res.data.success) {
        setStaff(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-space-2xl py-space-xl">
      <h1 className="font-heading text-3xl font-bold text-on-surface border-b border-surface-container pb-space-md mb-space-xl">Assigned Medical Staff</h1>
      
      {loading ? (
        <div className="text-center p-space-2xl"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>
      ) : staff.length === 0 ? (
        <div className="text-center p-space-2xl text-secondary bg-surface-container-lowest rounded-xl border border-surface-container">
          No staff assigned to this blood bank.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
          {staff.map((s) => (
            <div key={s.staffId} className="bg-surface-container-lowest border border-surface-container rounded-2xl p-space-lg flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl uppercase">
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
              <span className={`px-space-sm py-[2px] rounded-full text-[10px] font-bold uppercase ${s.status === 'ACTIVE' ? 'bg-[#059669]/10 text-[#059669]' : 'bg-surface-container-high'}`}>
                {s.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BankStaff;
