import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const Appeals = () => {
  const [appeals, setAppeals] = useState<EmergencyAppealDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState({ query: '', urgency: '', bloodGroup: '' });

  useEffect(() => {
    fetchAppeals();
    /* eslint-disable-next-line */
  }, []);

  async function fetchAppeals() {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (search.query) params.append('location', search.query);
      if (search.urgency) params.append('urgencyLevel', search.urgency);
      if (search.bloodGroup) params.append('bloodGroup', search.bloodGroup);

      // Using the search endpoint
      const url = (search.query || search.urgency || search.bloodGroup) 
        ? `/public/emergency-appeals/search?${params.toString()}` 
        : '/public/emergency-appeals';
        
      const res = await api.get(url);
      
      if (res.data.success) {
        setAppeals(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAppeals();
  };

  return (
    <div className="max-w-360 mx-auto px-space-2xl py-space-xl">
      <h1 className="font-heading text-3xl font-bold text-on-surface mb-space-lg flex items-center gap-space-sm">
        <span className="material-symbols-outlined text-error text-[32px]">emergency</span>
        Emergency Blood Appeals
      </h1>

      <form onSubmit={handleSearch} className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-container flex flex-col md:flex-row gap-space-md mb-space-xl">
        <input 
          type="text" 
          placeholder="Search by location or patient name..." 
          className="flex-1 border border-surface-container-high rounded-lg px-space-md py-space-sm bg-surface"
          value={search.query}
          onChange={e => setSearch({...search, query: e.target.value})}
        />
        <select 
          className="border border-surface-container-high rounded-lg px-space-md py-space-sm bg-surface"
          value={search.bloodGroup}
          onChange={e => setSearch({...search, bloodGroup: e.target.value})}
        >
          <option value="">Any Blood Group</option>
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
            <option key={bg} value={bg}>{bg}</option>
          ))}
        </select>
        <select 
          className="border border-surface-container-high rounded-lg px-space-md py-space-sm bg-surface"
          value={search.urgency}
          onChange={e => setSearch({...search, urgency: e.target.value})}
        >
          <option value="">Any Urgency</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
        </select>
        <button type="submit" className="bg-primary text-on-primary px-space-lg py-space-sm rounded-lg font-bold hover:bg-primary/90">
          Search
        </button>
      </form>

      {loading ? (
        <div className="text-center p-space-2xl"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>
      ) : appeals.length === 0 ? (
        <div className="text-center p-space-2xl text-secondary bg-surface-container-lowest rounded-xl border border-surface-container">
          No emergency appeals found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg">
          {appeals.map(appeal => (
            <div key={appeal.id} className="p-space-lg rounded-xl bg-surface-container-lowest border border-error-container shadow-sm flex flex-col gap-space-md relative overflow-hidden hover:shadow-md transition-shadow">
              <div className={`absolute top-0 left-0 right-0 h-1 ${appeal.urgencyLevel === 'CRITICAL' ? 'bg-error' : 'bg-primary'}`} />
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="font-label text-xs uppercase tracking-wider text-error font-bold">{appeal.urgencyLevel} NEED</span>
                  <h3 className="font-heading text-lg font-bold text-on-surface">{appeal.patientName}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center font-heading text-xl font-bold shadow-sm">
                  {appeal.bloodGroup}
                </div>
              </div>
              <div className="flex flex-col gap-space-xs font-body text-sm text-secondary mt-space-sm">
                <div className="flex items-center gap-space-sm"><span className="material-symbols-outlined text-[16px]">local_hospital</span> {appeal.hospitalName}</div>
                <div className="flex items-center gap-space-sm"><span className="material-symbols-outlined text-[16px]">location_on</span> {appeal.location}</div>
                <div className="flex items-center gap-space-sm"><span className="material-symbols-outlined text-[16px]">bloodtype</span> Requires {appeal.unitsRequired} units</div>
              </div>
              <p className="font-body text-sm text-on-surface italic mt-space-sm">"{appeal.summary}"</p>
              <div className="mt-auto pt-space-md border-t border-surface-container-high flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-label text-xs text-secondary">Contact</span>
                  <span className="font-body text-sm font-bold">{appeal.contactPhone}</span>
                </div>
                <button className="px-space-md py-space-sm bg-error text-on-error rounded-lg text-sm font-bold hover:bg-error-container transition-colors">
                  I Can Donate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Appeals;
