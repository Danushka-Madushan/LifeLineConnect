import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const CommitteeVenues = () => {
  const [venues, setVenues] = useState<VenueDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ venueName: '', address: '', capacity: 100 });

  async function fetchVenues() {
    try {
      const res = await api.get('/committee/venues');
      if (res.data.success) {
        setVenues(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVenues();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/committee/venues', form);
      if (res.data.success) {
        setShowModal(false);
        setForm({ venueName: '', address: '', capacity: 100 });
        toast.success("Venue added successfully");
        fetchVenues();
      }
    } catch {
      toast.error("Failed to add venue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-300 mx-auto px-space-2xl py-space-xl">
      <div className="flex justify-between items-center border-b border-surface-container pb-space-md mb-space-xl">
        <h1 className="font-heading text-3xl font-bold text-on-surface">Managed Venues</h1>
        <button onClick={() => setShowModal(true)} className="bg-primary text-on-primary px-space-md py-space-sm rounded-lg font-bold flex items-center gap-1 hover:bg-primary/90">
          <span className="material-symbols-outlined text-[20px]">add</span> Add Venue
        </button>
      </div>
      
      {loading ? (
        <div className="text-center p-space-2xl"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>
      ) : venues.length === 0 ? (
        <div className="text-center p-space-2xl text-secondary bg-surface-container-lowest rounded-xl border border-surface-container">
          No venues registered. Click "Add Venue" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
          {venues.map((v) => (
            <div key={v.venueId} className="bg-surface-container-lowest border border-surface-container rounded-2xl p-space-lg flex flex-col gap-space-sm">
              <div className="flex justify-between items-start">
                <span className={`px-space-sm py-[2px] rounded-full text-[10px] font-bold uppercase ${v.status === 'ACTIVE' ? 'bg-[#059669]/10 text-[#059669]' : 'bg-error-container text-error'}`}>
                  {v.status}
                </span>
                <span className="text-xs font-mono text-secondary">CAP: {v.capacity}</span>
              </div>
              <h3 className="font-heading text-xl font-bold text-on-surface mt-space-xs">{v.venueName}</h3>
              <div className="flex items-start gap-space-xs text-sm text-secondary mt-space-xs">
                <span className="material-symbols-outlined text-[16px] mt-[2px]">location_on</span>
                <span>{v.address}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-space-md backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-space-xl shadow-lg border border-surface-container">
            <h2 className="font-heading text-2xl font-bold text-on-surface mb-space-lg">Add New Venue</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <label className="text-xs font-bold text-secondary">Venue Name</label>
                <input required value={form.venueName} onChange={e => setForm({...form, venueName: e.target.value})} className="border border-surface-container rounded-lg p-2 bg-transparent" />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="text-xs font-bold text-secondary">Address</label>
                <input required value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="border border-surface-container rounded-lg p-2 bg-transparent" />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="text-xs font-bold text-secondary">Capacity (Donors)</label>
                <input type="number" required min="1" value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value) || 0})} className="border border-surface-container rounded-lg p-2 bg-transparent" />
              </div>
              <div className="flex justify-end gap-space-md mt-space-md">
                <button type="button" onClick={() => setShowModal(false)} className="px-space-md py-space-sm rounded-lg font-bold hover:bg-surface-container">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-primary text-on-primary px-space-md py-space-sm rounded-lg font-bold hover:bg-primary/90">{submitting ? 'Adding...' : 'Add Venue'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitteeVenues;
