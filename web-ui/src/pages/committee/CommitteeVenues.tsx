import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const CommitteeVenues = () => {
  const [venues, setVenues] = useState<VenueDto[]>([]);
  const [loading, setLoading] = useState(true);

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

  ;

  async function handleAddVenue() {
    const venueName = prompt("Venue Name:");
    const address = prompt("Address:");
    const capacity = parseInt(prompt("Donor Capacity:") || "0");
    if (venueName && address && capacity > 0) {
      try {
        await api.post('/committee/venues', { venueName, address, capacity });
        fetchVenues();
      } catch {
        alert("Failed to add venue");
      }
    }
  };

  return (
    <div className="max-w-300 mx-auto px-space-2xl py-space-xl">
      <div className="flex justify-between items-center border-b border-surface-container pb-space-md mb-space-xl">
        <h1 className="font-heading text-3xl font-bold text-on-surface">Managed Venues</h1>
        <button onClick={handleAddVenue} className="bg-primary text-on-primary px-space-md py-space-sm rounded-lg font-bold flex items-center gap-1 hover:bg-primary/90">
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
    </div>
  );
};

export default CommitteeVenues;
