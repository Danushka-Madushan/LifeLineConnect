import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const BankHospitalRequests = () => {
  const [requests, setRequests] = useState<HospitalRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState<number | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const res = await api.get('/blood-bank/hospital-requests');
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  async function handleAllocate(requestId: number) {
    setAllocating(requestId);
    try {
      const res = await api.post(`/blood-bank/hospital-requests/${requestId}/allocate`);
      if (res.data.success) {
        alert(res.data.data || 'Allocation complete');
        fetchRequests();
      }
    } catch {
      alert('Allocation failed or not enough stock.');
    } finally {
      setAllocating(null);
    }
  };

  async function handleDownloadPdf() {
    try {
      const res = await api.get('/blood-bank/reports/hospital-requests', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Hospital_Requests_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download report', err);
    }
  };

  return (
    <div className="max-w-360 mx-auto px-space-2xl py-space-xl">
      <div className="flex justify-between items-center border-b border-surface-container pb-space-md mb-space-xl">
        <h1 className="font-heading text-3xl font-bold text-on-surface">Hospital Blood Requests</h1>
        <button onClick={handleDownloadPdf} className="flex items-center gap-space-sm bg-surface-container-high text-on-surface px-space-md py-space-sm rounded-lg hover:bg-surface-container-highest transition-colors font-semibold">
          <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
          Export Report
        </button>
      </div>
      
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
                <th className="p-space-md font-semibold border-b border-surface-container">Needed By</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Priority</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Status</th>
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
                  <td className="p-space-md font-bold">{r.status}</td>
                  <td className="p-space-md flex items-center gap-2">
                    <button 
                      onClick={() => handleAllocate(r.requestId)}
                      disabled={allocating === r.requestId || r.status === 'FULFILLED' || r.status === 'CLOSED' || r.status === 'CANCELLED'}
                      className="bg-primary text-on-primary px-3 py-1 rounded font-bold hover:bg-primary/90 text-xs disabled:opacity-50 whitespace-nowrap"
                    >
                      {allocating === r.requestId ? '...' : 'Auto-Allocate'}
                    </button>
                    <select 
                      className="border border-surface-container rounded px-2 py-1 text-xs"
                      value={r.status}
                      onChange={async (e) => {
                        try {
                          await api.patch(`/blood-bank/hospital-requests/${r.requestId}/status`, { status: e.target.value });
                          fetchRequests();
                        } catch {
                          alert('Failed to update status');
                        }
                      }}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="ALLOCATED">ALLOCATED</option>
                      <option value="PARTIALLY_FULFILLED">PARTIALLY FULFILLED</option>
                      <option value="FULFILLED">FULFILLED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
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
