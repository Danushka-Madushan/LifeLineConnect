import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const CommitteeTransfers = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      const res = await api.get('/committee/transfers');
      if (res.data.success) {
        setTransfers(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-space-2xl py-space-xl">
      <h1 className="font-heading text-3xl font-bold text-on-surface border-b border-surface-container pb-space-md mb-space-xl">Donation Transfers</h1>
      
      {loading ? (
        <div className="text-center p-space-2xl"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>
      ) : transfers.length === 0 ? (
        <div className="text-center p-space-2xl text-secondary bg-surface-container-lowest rounded-xl border border-surface-container">
          No transfers have been dispatched yet.
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low text-secondary text-sm font-label uppercase">
              <tr>
                <th className="p-space-md font-semibold border-b border-surface-container">Transfer Code</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Dispatched At</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Received At</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {transfers.map((t) => (
                <tr key={t.transferId} className="border-b border-surface-container last:border-0 hover:bg-surface/50">
                  <td className="p-space-md font-bold font-mono text-on-surface">{t.transferCode}</td>
                  <td className="p-space-md">{new Date(t.dispatchedAt).toLocaleString()}</td>
                  <td className="p-space-md">{t.receivedAt ? new Date(t.receivedAt).toLocaleString() : '-'}</td>
                  <td className="p-space-md">
                    <span className={`px-space-sm py-[2px] rounded-full text-[10px] font-bold uppercase ${t.status === 'RECEIVED' ? 'bg-[#059669]/10 text-[#059669]' : 'bg-[#D97706]/10 text-[#D97706]'}`}>
                      {t.status}
                    </span>
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

export default CommitteeTransfers;
