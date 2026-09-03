import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const BankTransfers = () => {
  const [transfers, setTransfers] = useState<DonationTransferDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  async function fetchTransfers() {
    try {
      const res = await api.get('/blood-bank/transfers');
      if (res.data.success) {
        setTransfers(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransfers();
  }, []);

  ;

  async function handleReceive(transferId: number) {
    if (!window.confirm('Confirm receipt of this transfer? This will unpack units into available inventory.')) return;
    setProcessing(transferId);
    try {
      await api.post(`/blood-bank/transfers/${transferId}/receive`);
      alert('Transfer received and inventory updated successfully.');
      fetchTransfers();
    } catch (err) {
      alert((err as import("axios").AxiosError<{message: string}>).response?.data?.message || 'Failed to process transfer');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="max-w-360 mx-auto px-space-2xl py-space-xl">
      <h1 className="font-heading text-3xl font-bold text-on-surface border-b border-surface-container pb-space-md mb-space-xl">Incoming Donations (Transfers)</h1>
      
      {loading ? (
        <div className="text-center p-space-2xl"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>
      ) : transfers.length === 0 ? (
        <div className="text-center p-space-2xl text-secondary bg-surface-container-lowest rounded-xl border border-surface-container">
          No transfers have been dispatched to your bank yet.
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low text-secondary text-sm font-label uppercase">
              <tr>
                <th className="p-space-md font-semibold border-b border-surface-container">Transfer Code</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Camp & Committee</th>
                <th className="p-space-md font-semibold border-b border-surface-container hidden md:table-cell">Dispatched</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Status</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {transfers.map((t) => (
                <tr key={t.transferId} className="border-b border-surface-container last:border-0 hover:bg-surface/50">
                  <td className="p-space-md font-mono text-secondary font-bold">{t.transferCode}</td>
                  <td className="p-space-md text-on-surface">
                    <div className="font-bold">{t.campTitle}</div>
                    <div className="text-xs text-secondary">{t.committeeName}</div>
                  </td>
                  <td className="p-space-md text-on-surface hidden md:table-cell">
                    {t.dispatchedAt ? new Date(t.dispatchedAt).toLocaleString() : 'N/A'}
                  </td>
                  <td className="p-space-md">
                    <span className={`px-space-sm py-[2px] rounded-full text-xs font-bold uppercase ${
                      t.status === 'RECEIVED' ? 'bg-[#059669]/10 text-[#059669]' : 
                      'bg-[#D97706]/10 text-[#D97706]'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-space-md">
                    {t.status !== 'RECEIVED' && (
                      <button 
                        onClick={() => handleReceive(t.transferId)}
                        disabled={processing === t.transferId}
                        className="bg-primary text-on-primary px-space-md py-space-sm rounded font-bold hover:bg-primary/90 text-xs disabled:opacity-50"
                      >
                        {processing === t.transferId ? 'Processing...' : 'Receive Transfer'}
                      </button>
                    )}
                    {t.status === 'RECEIVED' && (
                      <span className="text-xs font-semibold text-secondary">Logged: {t.receivedUnitCount} units</span>
                    )}
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

export default BankTransfers;
