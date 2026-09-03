import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const BankInventory = () => {
  const [inventory, setInventory] = useState<BloodUnitDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function fetchInventory() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (bloodGroupFilter) params.append('bloodGroup', bloodGroupFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      const res = await api.get(`/blood-bank/inventory?${params.toString()}`);
      if (res.data.success) {
        setInventory(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  }

   useEffect(() => {
    let cancelled = false;

    const loadInventory = async () => {
      try {
        const params = new URLSearchParams();

        if (bloodGroupFilter) {
          params.append('bloodGroup', bloodGroupFilter);
        }

        if (statusFilter) {
          params.append('status', statusFilter);
        }

        const res = await api.get(
          `/blood-bank/inventory?${params.toString()}`
        );

        if (!cancelled && res.data.success) {
          setInventory(res.data.data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch inventory:', err);
          setInventory([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInventory();

    return () => {
      cancelled = true;
    };
  }, [bloodGroupFilter, statusFilter]);

  async function updateStatus(id: number, newStatus: string) {
    try {
      await api.patch(`/blood-bank/inventory/${id}/status`, { status: newStatus });
      fetchInventory(); // refresh list
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    }
  };

  async function handleDownloadPdf() {
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

  return (
    <div className="max-w-360 mx-auto px-space-2xl py-space-xl">
      <div className="flex justify-between items-center border-b border-surface-container pb-space-md mb-space-xl">
        <h1 className="font-heading text-3xl font-bold text-on-surface">Blood Inventory</h1>
        <button onClick={handleDownloadPdf} className="flex items-center gap-space-sm bg-surface-container-high text-on-surface px-space-md py-space-sm rounded-lg hover:bg-surface-container-highest transition-colors font-semibold">
          <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
          Export Report
        </button>
      </div>

      <div className="flex gap-space-md mb-space-lg">
        <select 
          value={bloodGroupFilter} 
          onChange={e => setBloodGroupFilter(e.target.value)}
          className="border border-surface-container-high rounded-lg px-space-md py-space-sm bg-surface text-sm"
        >
          <option value="">All Blood Groups</option>
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
        </select>
        
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-surface-container-high rounded-lg px-space-md py-space-sm bg-surface text-sm"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="EXPIRED">Expired</option>
          <option value="ISSUED">Issued</option>
          <option value="DISCARDED">Discarded</option>
        </select>
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
                <th className="p-space-md font-semibold border-b border-surface-container">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {inventory.length === 0 ? (
                <tr><td colSpan={6} className="p-space-xl text-center text-secondary">No inventory matches filter.</td></tr>
              ) : inventory.map((i) => (
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
                  <td className="p-space-md">
                    <select 
                      className="border border-surface-container rounded px-2 py-1 text-xs"
                      value={i.status}
                      onChange={(e) => updateStatus(i.bloodUnitId, e.target.value)}
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="EXPIRED">EXPIRED</option>
                      <option value="ISSUED">ISSUED</option>
                      <option value="DISCARDED">DISCARDED</option>
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

export default BankInventory;
