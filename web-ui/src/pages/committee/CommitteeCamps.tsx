import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

const CommitteeCamps = () => {
  const [camps, setCamps] = useState<DonationCampDto[]>([]);
  const [venues, setVenues] = useState<DonationCampDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({ title: '', venueId: '', date: '', startTime: '', endTime: '', capacity: 100 });

  useEffect(() => {
    fetchCamps();
    fetchVenues();
  }, []);

  async function fetchCamps() {
    try {
      const res = await api.get('/committee/camps');
      if (res.data.success) setCamps(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  async function fetchVenues() {
    try {
      const res = await api.get('/committee/venues');
      if (res.data.success) setVenues(res.data.data);
    } catch {
      toast.error('Failed to fetch venues');
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        venueId: parseInt(form.venueId),
        date: form.date,
        startTime: `${form.date}T${form.startTime}:00Z`, // Simplified handling
        endTime: `${form.date}T${form.endTime}:00Z`,
        capacity: form.capacity
      };
      const res = await api.post('/committee/camps', payload);
      if (res.data.success) {
        setShowModal(false);
        fetchCamps();
      }
    } catch (err) {
      toast((err as import("axios").AxiosError<{message: string}>).response?.data?.message || 'Failed to create camp');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-360 mx-auto px-space-2xl py-space-xl">
      <div className="flex justify-between items-center border-b border-surface-container pb-space-md mb-space-xl">
        <h1 className="font-heading text-3xl font-bold text-on-surface">Manage Donation Camps</h1>
        <button onClick={() => setShowModal(true)} className="bg-primary text-on-primary px-space-md py-space-sm rounded-lg font-bold hover:bg-primary/90 flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Create New Camp
        </button>
      </div>

      {loading ? (
        <div className="text-center p-space-2xl"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>
      ) : camps.length === 0 ? (
        <div className="text-center p-space-2xl text-secondary bg-surface-container-lowest rounded-xl border border-surface-container">
          You haven't organized any camps yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
          {camps.map((c) => (
            <div key={c.campId} className="bg-surface-container-lowest border border-surface-container rounded-2xl p-space-lg flex flex-col gap-space-sm hover:shadow-sm">
              <div className="flex justify-between items-start">
                <select 
                  className={`text-[10px] font-bold uppercase rounded p-1 border border-surface-container ${c.status === 'PUBLISHED' ? 'bg-[#059669]/10 text-[#059669]' : c.status === 'COMPLETED' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high'}`}
                  value={c.status}
                  onChange={async (e) => {
                    try {
                      await api.patch(`/committee/camps/${c.campId}/status`, { status: e.target.value });
                      fetchCamps();
                    } catch {
                      toast.error('Failed to update status');
                    }
                  }}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ONGOING">ONGOING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
                <span className="text-xs font-mono text-secondary">ID: {c.campId}</span>
              </div>
              <h3 className="font-heading text-xl font-bold text-on-surface mt-space-xs">{c.campTitle}</h3>
              <div className="flex items-center gap-space-xs text-sm text-secondary">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                {new Date(c.campDate).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-space-xs text-sm text-secondary">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                {c.venueName}
              </div>
              <Link to={`/committee/camps/${c.campId}`} className="mt-space-md bg-surface-container-high text-on-surface py-space-sm rounded-lg font-bold text-center hover:bg-surface-container-highest transition-colors text-sm">
                Manage Operations →
              </Link>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-space-md backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl p-space-xl shadow-lg border border-surface-container">
            <h2 className="font-heading text-2xl font-bold text-on-surface mb-space-lg">Schedule New Camp</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <label className="text-xs font-bold">Camp Title</label>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="border rounded p-2" />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="text-xs font-bold">Venue</label>
                <select required value={form.venueId} onChange={e => setForm({...form, venueId: e.target.value})} className="border rounded p-2">
                  <option value="">-- Select Venue --</option>
                  {venues.map(v => <option key={v.venueId} value={v.venueId}>{v.venueName} (Cap: {v.capacity})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <label className="text-xs font-bold">Date</label>
                  <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="border rounded p-2" />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="text-xs font-bold">Donor Capacity</label>
                  <input type="number" min="1" required value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value)})} className="border rounded p-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <label className="text-xs font-bold">Start Time</label>
                  <input type="time" required value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="border rounded p-2" />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="text-xs font-bold">End Time</label>
                  <input type="time" required value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="border rounded p-2" />
                </div>
              </div>
              <div className="flex justify-end gap-space-md mt-space-md">
                <button type="button" onClick={() => setShowModal(false)} className="px-space-md py-space-sm rounded font-bold hover:bg-surface-container">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-primary text-on-primary px-space-md py-space-sm rounded font-bold hover:bg-primary/90">{submitting ? 'Publishing...' : 'Publish Camp'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitteeCamps;
