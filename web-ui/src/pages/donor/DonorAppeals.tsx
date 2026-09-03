import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const DonorAppeals = () => {
  const [appeals, setAppeals] = useState<EmergencyAppealDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ patientReference: '', relationship: 'SELF', bloodGroup: 'O+', unitsRequired: 1, urgency: 'HIGH', location: '', neededBy: '', summary: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAppeals();
  }, []);

  async function fetchAppeals() {
    try {
      const res = await api.get('/donors/me/emergency-appeals');
      if (res.data.success) {
        setAppeals(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/donors/me/emergency-appeals', form);
      if (res.data.success) {
        setShowModal(false);
        alert('Appeal submitted and pending review.');
        fetchAppeals();
      }
    } catch (err) {
      alert((err as import("axios").AxiosError<{message: string}>).response?.data?.message || 'Failed to submit appeal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-300 mx-auto px-space-2xl py-space-xl relative">
      <div className="flex justify-between items-center border-b border-surface-container pb-space-md mb-space-xl">
        <h1 className="font-heading text-3xl font-bold text-on-surface">Emergency Blood Appeals</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-space-sm bg-primary text-on-primary px-space-md py-space-sm rounded-lg hover:bg-primary/90 transition-colors font-semibold">
          <span className="material-symbols-outlined text-[20px]">add_alert</span>
          Submit Appeal
        </button>
      </div>

      {loading ? (
        <div className="text-center p-space-2xl"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>
      ) : appeals.length === 0 ? (
        <div className="text-center p-space-2xl text-secondary bg-surface-container-lowest rounded-xl border border-surface-container">
          No active emergency appeals at this time.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
          {appeals.map(a => (
            <div key={a.appealId} className="bg-error-container text-on-error-container rounded-2xl p-space-lg flex flex-col gap-space-sm shadow-sm border border-error/20">
              <div className="flex justify-between items-start">
                <span className="bg-error text-on-error px-space-sm py-[2px] rounded text-xs font-bold uppercase tracking-wider">{a.urgency} URGENCY</span>
                <span className="font-heading text-2xl font-bold text-error">{a.bloodGroup}</span>
              </div>
              <p className="font-body text-sm font-semibold mt-space-sm">{a.summary}</p>
              <div className="flex items-center gap-space-xs text-xs mt-space-sm opacity-90">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                {a.location}
              </div>
              <div className="flex items-center gap-space-xs text-xs opacity-90">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                Needed by: {new Date(a.neededBy).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-space-md backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl p-space-xl shadow-lg border border-surface-container">
            <h2 className="font-heading text-2xl font-bold text-on-surface mb-space-lg">Submit Emergency Appeal</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
              <div className="grid grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <label className="text-xs font-bold">Patient Reference</label>
                  <input required value={form.patientReference} onChange={e => setForm({...form, patientReference: e.target.value})} className="border rounded p-2" />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="text-xs font-bold">Relationship</label>
                  <select value={form.relationship} onChange={e => setForm({...form, relationship: e.target.value})} className="border rounded p-2">
                    <option value="SELF">Self</option>
                    <option value="FAMILY">Family</option>
                    <option value="FRIEND">Friend</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <label className="text-xs font-bold">Required Blood Group</label>
                  <select value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})} className="border rounded p-2">
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="text-xs font-bold">Units Needed</label>
                  <input type="number" min="1" required value={form.unitsRequired} onChange={e => setForm({...form, unitsRequired: parseInt(e.target.value)})} className="border rounded p-2" />
                </div>
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="text-xs font-bold">Location / Hospital</label>
                <input required value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="border rounded p-2" />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="text-xs font-bold">Needed By</label>
                <input type="datetime-local" required value={form.neededBy} onChange={e => setForm({...form, neededBy: e.target.value})} className="border rounded p-2" />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="text-xs font-bold">Summary</label>
                <textarea required value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} className="border rounded p-2" rows={3}></textarea>
              </div>
              <div className="flex justify-end gap-space-md mt-space-md">
                <button type="button" onClick={() => setShowModal(false)} className="px-space-md py-space-sm rounded font-bold hover:bg-surface-container">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-primary text-on-primary px-space-md py-space-sm rounded font-bold hover:bg-primary/90">{submitting ? 'Submitting...' : 'Submit Appeal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorAppeals;
