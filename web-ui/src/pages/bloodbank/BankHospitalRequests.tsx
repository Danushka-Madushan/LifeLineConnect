import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const BankHospitalRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState<number | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/blood-bank/hospital-requests');
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async (requestId: number) => {
    setAllocating(requestId);
    try {
      const res = await api.post(`/blood-bank/hospital-requests/${requestId}/allocate`);
      if (res.data.success) {
        alert(res.data.data || 'Allocation complete');
        fetchRequests();
      }
    } catch (err) {
      alert('Allocation failed or not enough stock.');
    } finally {
      setAllocating(null);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-space-2xl py-space-xl">
      <h1 className="font-heading text-3xl font-bold text-on-surface border-b border-surface-container pb-space-md mb-space-xl">Hospital Blood Requests</h1>
      
      {loading ? (
        <div className="text-center p-space-2xl"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>
      ) : requests.length === 0 ? (
        <div className="text-center p-space-2xl text-secondary bg-surface-container-lowest rounded-xl border border-surface-container">
          No hospital requests at this time.
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low text-secondary text-sm font-label uppercase">
              <tr>
                <th className="p-space-md font-semibold border-b border-surface-container">Hospital</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Blood Group</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Units Req.</th>
                <th className="p-space-md font-semibold border-b border-surface-container hidden md:table-cell">Needed By</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Priority</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {requests.map((r) => (
                <tr key={r.requestId} className="border-b border-surface-container last:border-0 hover:bg-surface/50">
                  <td className="p-space-md font-bold text-on-surface">{r.hospitalName}</td>
                  <td className="p-space-md font-bold text-error text-lg">{r.bloodGroup}</td>
                  <td className="p-space-md text-on-surface font-mono">{r.unitsRequired}</td>
                  <td className="p-space-md text-secondary hidden md:table-cell">{new Date(r.neededBy).toLocaleString()}</td>
                  <td className="p-space-md">
                    <span className={`px-space-sm py-[2px] rounded-full text-xs font-bold uppercase ${
                      r.priority === 'CRITICAL' ? 'bg-error text-on-error' : 
                      r.priority === 'HIGH' ? 'bg-[#D97706]/20 text-[#D97706]' : 'bg-surface-container-high'
                    }`}>
                      {r.priority}
                    </span>
                  </td>
                  <td className="p-space-md">
                    <button 
                      onClick={() => handleAllocate(r.requestId)}
                      disabled={allocating === r.requestId}
                      className="bg-primary text-on-primary px-space-md py-space-sm rounded font-bold hover:bg-primary/90 text-xs disabled:opacity-50"
                    >
                      {allocating === r.requestId ? 'Allocating...' : 'Auto-Allocate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BankHospitalRequests;
