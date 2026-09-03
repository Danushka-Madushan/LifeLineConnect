import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const DonorCamps = () => {
  const [camps, setCamps] = useState<DonationCampDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [eligibility, setEligibility] = useState<DonationCampDto | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');

  useEffect(() => {
    async function fetchCampsAndEligibility() {
      try {
        let url = '/public/camps?status=PUBLISHED';
        url += '&lat=6.9271&lng=79.8612'; 

        const [campsRes, eligRes] = await Promise.all([
          api.get(url),
          api.get('/donors/me/eligibility')
        ]);
        if (campsRes.data.success) setCamps(campsRes.data.data);
        if (eligRes.data.success) setEligibility(eligRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampsAndEligibility();
  }, []);

  async function handleRegister(campId: number) {
    if (!window.confirm('Are you sure you want to register for this camp?')) return;
    setRegistering(campId);
    setMessage('');
    try {
      const res = await api.post('/donors/me/camp-registrations', { campId });
      if (res.data.success) {
        setMessage('Successfully registered for the camp! It will appear in your upcoming list.');
      }
    } catch (err) {
      setMessage((err as import("axios").AxiosError<{message: string}>).response?.data?.message || 'Failed to register. Are you already registered?');
    } finally {
      setRegistering(null);
    }
  };

  return (
    <div className="max-w-300 mx-auto px-space-2xl py-space-xl">
      <div className="flex justify-between items-center mb-space-lg">
        <h1 className="font-heading text-3xl font-bold text-on-surface">Available Donation Camps</h1>
        <div className="flex gap-space-xs bg-surface-container p-1 rounded-lg">
          <button onClick={() => setViewMode('LIST')} className={`px-4 py-1 rounded-md text-sm font-bold ${viewMode === 'LIST' ? 'bg-surface shadow text-primary' : 'text-secondary hover:text-on-surface'}`}>List View</button>
          <button onClick={() => setViewMode('MAP')} className={`px-4 py-1 rounded-md text-sm font-bold ${viewMode === 'MAP' ? 'bg-surface shadow text-primary' : 'text-secondary hover:text-on-surface'}`}>Map View</button>
        </div>
      </div>
      
      {message && (
        <div className={`mb-space-lg p-space-md rounded-lg text-sm font-semibold ${message.includes('Success') ? 'bg-[#059669]/10 text-[#059669]' : 'bg-error-container text-error'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-center p-space-2xl"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>
      ) : camps.length === 0 ? (
        <div className="text-center p-space-2xl text-secondary bg-surface-container-lowest rounded-xl border border-surface-container">
          No published camps available at the moment.
        </div>
      ) : viewMode === 'MAP' ? (
        <div className="w-full h-150 bg-surface-container-low rounded-xl border border-surface-container flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=6.9271,79.8612&zoom=11&size=1200x600&sensor=false')] bg-cover bg-center"></div>
          <div className="z-10 absolute top-4 left-4 flex flex-col gap-2 max-w-sm">
            {camps.map(camp => (
              <div key={camp.campId} className="bg-surface p-space-sm rounded-lg shadow-md border border-surface-container flex flex-col gap-1">
                <div className="font-bold text-sm text-on-surface">{camp.campTitle}</div>
                <div className="text-xs text-secondary">{new Date(camp.campDate).toLocaleDateString()}</div>
                <button 
                  onClick={() => handleRegister(camp.campId)}
                  disabled={registering === camp.campId || (eligibility ? !eligibility.isEligible : false)}
                  className={`mt-2 py-1 rounded text-xs font-bold ${eligibility && !eligibility.isEligible ? 'bg-surface-container-high text-secondary' : 'bg-primary text-on-primary'}`}
                >
                  {eligibility && !eligibility.isEligible ? 'Not Eligible' : 'Register Here'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
          {camps.map(camp => (
            <div key={camp.campId} className="bg-surface-container-lowest border border-surface-container rounded-2xl p-space-lg flex flex-col gap-space-md hover:shadow-sm transition-shadow">
              <h3 className="font-heading text-xl font-bold text-on-surface">{camp.campTitle}</h3>
              <div className="flex items-center gap-space-sm text-sm text-secondary">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                <span>{new Date(camp.campDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-space-sm text-sm text-secondary">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span>{camp.venueName}</span>
              </div>
              <div className="flex items-center gap-space-sm text-sm text-secondary">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                <span>{new Date(camp.startTime).toLocaleTimeString()} - {new Date(camp.endTime).toLocaleTimeString()}</span>
              </div>
              
              <button 
                onClick={() => handleRegister(camp.campId)}
                disabled={registering === camp.campId || (eligibility ? !eligibility.isEligible : false)}
                className={`mt-auto py-space-sm rounded-lg font-bold flex items-center justify-center transition-colors disabled:opacity-70 ${
                  eligibility && !eligibility.isEligible ? 'bg-surface-container-high text-secondary' : 'bg-primary text-on-primary hover:bg-primary/90'
                }`}
              >
                {registering === camp.campId ? <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> : 
                 (eligibility && !eligibility.isEligible ? 'Not Eligible to Donate' : 'Register to Donate')}
              </button>
              {eligibility && !eligibility.isEligible && (
                <span className="text-[10px] text-error text-center font-bold">{eligibility.reason}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonorCamps;
