import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';

const CommitteeCampDetails = () => {
  const { campId } = useParams();
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'FEEDBACK'>('ATTENDANCE');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Transfer modal
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferBankId, setTransferBankId] = useState('1'); // Mock ID for demo
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    fetchData();
  }, [campId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const attRes = await api.get(`/committee/camps/${campId}/attendance`);
      if (attRes.data.success) setAttendance(attRes.data.data);
      
      const feedRes = await api.get(`/committee/camps/${campId}/feedback`);
      if (feedRes.data.success) setFeedback(feedRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordDonation = async (donor: any) => {
    if (!window.confirm(`Log 1 unit of ${donor.bloodGroup} for ${donor.fullName}?`)) return;
    try {
      const res = await api.post(`/committee/camps/${campId}/donations`, {
        registrationId: donor.registrationId,
        donorId: donor.donorId,
        bloodGroup: donor.bloodGroup,
        units: 1
      });
      if (res.data.success) {
        fetchData(); // refresh attendance list
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record donation.');
    }
  };

  const handleDispatch = async () => {
    if (!window.confirm('Dispatch all completed donations to the selected Blood Bank?')) return;
    setTransferring(true);
    try {
      const res = await api.post(`/committee/camps/${campId}/transfers`, { bloodBankId: parseInt(transferBankId) });
      if (res.data.success) {
        alert(res.data.message);
        setShowTransfer(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispatch transfer.');
    } finally {
      setTransferring(false);
    }
  };

  if (loading) return <div className="p-space-2xl text-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>;

  return (
    <div className="max-w-[1440px] mx-auto px-space-2xl py-space-xl">
      <Link to="/committee/camps" className="text-secondary hover:text-on-surface text-sm font-bold flex items-center gap-space-xs mb-space-md">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to Camps
      </Link>
      
      <div className="flex justify-between items-center border-b border-surface-container pb-space-md mb-space-lg">
        <h1 className="font-heading text-3xl font-bold text-on-surface">Camp Operations <span className="text-secondary font-mono text-lg">#{campId}</span></h1>
        <button onClick={() => setShowTransfer(true)} className="bg-primary text-on-primary px-space-md py-space-sm rounded-lg font-bold flex items-center gap-space-xs hover:bg-primary/90">
          <span className="material-symbols-outlined text-[20px]">local_shipping</span>
          Dispatch to Bank
        </button>
      </div>

      <div className="flex gap-space-lg mb-space-lg border-b border-surface-container">
        <button 
          onClick={() => setActiveTab('ATTENDANCE')} 
          className={`pb-space-sm font-bold border-b-2 transition-colors ${activeTab === 'ATTENDANCE' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'}`}
        >
          Donor Attendance
        </button>
        <button 
          onClick={() => setActiveTab('FEEDBACK')} 
          className={`pb-space-sm font-bold border-b-2 transition-colors ${activeTab === 'FEEDBACK' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'}`}
        >
          Post-Camp Feedback
        </button>
      </div>

      {activeTab === 'ATTENDANCE' && (
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low text-secondary text-sm font-label uppercase">
              <tr>
                <th className="p-space-md font-semibold border-b border-surface-container">Donor</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Blood Grp</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Status</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {attendance.length === 0 ? (
                <tr><td colSpan={4} className="p-space-xl text-center text-secondary">No donors registered for this camp yet.</td></tr>
              ) : attendance.map((a) => (
                <tr key={a.registrationId} className="border-b border-surface-container last:border-0 hover:bg-surface/50">
                  <td className="p-space-md">
                    <div className="font-bold text-on-surface">{a.fullName}</div>
                    <div className="text-xs text-secondary font-mono">{a.nic}</div>
                  </td>
                  <td className="p-space-md font-bold text-error text-lg">{a.bloodGroup}</td>
                  <td className="p-space-md">
                    <span className={`px-space-sm py-[2px] rounded-full text-[10px] font-bold uppercase ${a.hasDonated ? 'bg-primary/10 text-primary' : 'bg-[#D97706]/10 text-[#D97706]'}`}>
                      {a.hasDonated ? 'DONATED' : a.attendanceStatus}
                    </span>
                  </td>
                  <td className="p-space-md">
                    {!a.hasDonated && a.registrationStatus !== 'CANCELLED' && (
                      <button 
                        onClick={() => handleRecordDonation(a)}
                        className="bg-[#059669] text-white px-space-sm py-[4px] rounded font-bold text-xs hover:bg-[#059669]/90"
                      >
                        Record Donation
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'FEEDBACK' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
          {feedback.length === 0 ? (
            <div className="col-span-full text-center p-space-2xl text-secondary bg-surface-container-lowest rounded-xl border border-surface-container">
              No feedback has been submitted for this camp.
            </div>
          ) : feedback.map((f: any) => (
            <div key={f.feedbackId} className="bg-surface-container-lowest border border-surface-container rounded-xl p-space-lg shadow-sm">
              <div className="flex justify-between items-start mb-space-sm">
                <span className="font-bold text-on-surface">{f.donorName}</span>
                <span className="text-sm text-secondary">{new Date(f.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-[2px] text-[#D97706] mb-space-sm">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-[18px]">
                    {i < f.rating ? 'star' : 'star_border'}
                  </span>
                ))}
              </div>
              <p className="text-sm text-on-surface italic">"{f.comment}"</p>
            </div>
          ))}
        </div>
      )}

      {showTransfer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-space-md backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-space-xl shadow-lg border border-surface-container">
            <h2 className="font-heading text-2xl font-bold text-on-surface mb-space-md">Dispatch Transfer</h2>
            <p className="text-sm text-secondary mb-space-lg">
              This will bundle all recorded donations from this camp and send a physical dispatch manifest to the selected Blood Bank.
            </p>
            <div className="flex flex-col gap-space-xs mb-space-lg">
              <label className="text-xs font-bold">Select Destination Blood Bank</label>
              <select value={transferBankId} onChange={e => setTransferBankId(e.target.value)} className="border border-surface-container-high rounded p-2">
                {/* Mocked Blood Banks. In reality, you'd fetch /api/public/blood-banks */}
                <option value="1">Central National Blood Bank (ID: 1)</option>
                <option value="2">Kandy Regional Blood Center (ID: 2)</option>
              </select>
            </div>
            <div className="flex justify-end gap-space-md">
              <button onClick={() => setShowTransfer(false)} className="px-space-md py-space-sm rounded font-bold hover:bg-surface-container text-sm">Cancel</button>
              <button onClick={handleDispatch} disabled={transferring} className="bg-primary text-on-primary px-space-md py-space-sm rounded font-bold hover:bg-primary/90 text-sm">
                {transferring ? 'Dispatching...' : 'Dispatch Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitteeCampDetails;
