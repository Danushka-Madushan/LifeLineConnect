import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const BankInventory = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/blood-bank/inventory');
      if (res.data.success) {
        setInventory(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await api.get('/blood-bank/reports/inventory', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Inventory_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download report', err);
    }
  };

  const filteredInventory = inventory.filter(item => {
    if (filter === 'ALL') return true;
    if (filter === 'EXPIRED') return item.status === 'EXPIRED';
    if (filter === 'AVAILABLE') return item.status === 'AVAILABLE';
    return item.bloodGroup === filter;
  });

  return (
    <div className="max-w-[1440px] mx-auto px-space-2xl py-space-xl">
      <div className="flex justify-between items-center border-b border-surface-container pb-space-md mb-space-xl">
        <h1 className="font-heading text-3xl font-bold text-on-surface">Blood Inventory</h1>
        <button onClick={handleDownloadPdf} className="flex items-center gap-space-sm bg-surface-container-high text-on-surface px-space-md py-space-sm rounded-lg hover:bg-surface-container-highest transition-colors font-semibold">
          <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
          Export Report
        </button>
      </div>

      <div className="flex gap-space-sm mb-space-lg overflow-x-auto pb-space-xs">
        {['ALL', 'AVAILABLE', 'EXPIRED', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-space-md py-space-xs rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === f ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-secondary hover:bg-surface-container'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center p-space-2xl"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low text-secondary text-sm font-label uppercase">
              <tr>
                <th className="p-space-md font-semibold border-b border-surface-container">Unit Code</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Blood Group</th>
                <th className="p-space-md font-semibold border-b border-surface-container hidden md:table-cell">Collected</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Expiry</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredInventory.length === 0 ? (
                <tr><td colSpan={5} className="p-space-xl text-center text-secondary">No inventory matches filter.</td></tr>
              ) : filteredInventory.map((i) => (
                <tr key={i.bloodUnitId} className="border-b border-surface-container last:border-0 hover:bg-surface/50">
                  <td className="p-space-md font-mono text-secondary">{i.unitCode}</td>
                  <td className="p-space-md font-bold text-primary text-lg">{i.bloodGroup}</td>
                  <td className="p-space-md text-on-surface hidden md:table-cell">{new Date(i.collectionDate).toLocaleDateString()}</td>
                  <td className="p-space-md text-on-surface">{new Date(i.expiryDate).toLocaleDateString()}</td>
                  <td className="p-space-md">
                    <span className={`px-space-sm py-[2px] rounded-full text-xs font-bold ${
                      i.status === 'AVAILABLE' ? 'bg-[#059669]/10 text-[#059669]' : 
                      i.status === 'EXPIRED' ? 'bg-error-container text-error' : 
                      'bg-surface-container-high text-secondary'
                    }`}>
                      {i.status}
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

export default BankInventory;
