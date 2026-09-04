import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

interface DashboardStats {
  totalDonations: number;
  upcomingCamps: number;
  lastDonationDate: string | null;
  isEligible: boolean;
  eligibilityReason: string;
  nextEligibleDate: string;
}

const DonorDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMedicalCheck, setShowMedicalCheck] = useState(false);
  const [medicalCheckForm, setMedicalCheckForm] = useState({
    feelingWell: true,
    recentAntibiotics: false,
    recentTattoo: false
  });
  const [submittingMedical, setSubmittingMedical] = useState(false);
  const [medicalError, setMedicalError] = useState('');

  const submitMedicalCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingMedical(true);
    setMedicalError('');
    try {
      await api.post('/donors/me/medical-check', medicalCheckForm);
      setShowMedicalCheck(false);
      const res = await api.get('/donors/me/dashboard');
      if (res.data.success) setStats(res.data.data);
    } catch (err: unknown) {
      setMedicalError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to submit medical check');
      const res = await api.get('/donors/me/dashboard');
      if (res.data.success) setStats(res.data.data);
    } finally {
      setSubmittingMedical(false);
    }
  };

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/donors/me/dashboard');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="p-space-2xl text-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>;

  return (
    <div className="max-w-300 mx-auto px-space-2xl py-space-xl flex flex-col gap-space-2xl">
      <h1 className="font-heading text-3xl font-bold text-on-surface border-b border-surface-container pb-space-md">Donor Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
        {/* Eligibility Card */}
        <div className={`p-space-xl rounded-2xl border ${stats?.isEligible ? 'bg-[#059669]/10 border-[#059669]' : 'bg-error-container border-error'} flex flex-col gap-space-sm`}>
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold flex items-center gap-space-xs">
              <span className="material-symbols-outlined">{stats?.isEligible ? 'check_circle' : 'cancel'}</span>
              Eligibility
            </h2>
            <span className={`font-bold ${stats?.isEligible ? 'text-[#059669]' : 'text-error'}`}>
              {stats?.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
            </span>
          </div>
          <p className="text-sm font-semibold">{stats?.eligibilityReason}</p>
          {stats?.eligibilityReason.includes('medical check') && (
            <button 
              onClick={() => setShowMedicalCheck(true)}
              className="mt-space-sm bg-primary text-on-primary px-space-md py-space-sm rounded-lg font-bold hover:opacity-90 transition-opacity"
            >
              Take Medical Check
            </button>
          )}
          <p className="text-xs text-secondary mt-auto pt-space-md">Next eligible date: {new Date(stats?.nextEligibleDate || '').toLocaleDateString()}</p>
        </div>

        {/* Stats Card */}
        <div className="p-space-xl rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col gap-space-md">
          <h2 className="font-heading text-lg font-bold text-on-surface">Your Impact</h2>
          <div className="flex justify-between items-center mt-auto">
            <span className="font-label text-secondary">Total Donations</span>
            <span className="font-heading text-3xl font-bold text-primary">{stats?.totalDonations}</span>
          </div>
        </div>

        {/* Action Card */}
        <div className="p-space-xl rounded-2xl bg-primary text-on-primary border border-primary flex flex-col justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold mb-space-xs">Ready to save lives?</h2>
            <p className="text-sm opacity-90">Find a camp near you and register to donate.</p>
          </div>
          <Link to="/donor/camps" className="bg-surface text-primary px-space-md py-space-sm rounded-lg font-bold text-center hover:bg-surface-container transition-colors mt-space-lg">
            Find Camps
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-xl">
        <div className="flex flex-col gap-space-md">
          <h2 className="font-heading text-xl font-bold text-on-surface border-b border-surface-container pb-space-sm">Quick Links</h2>
          <div className="grid grid-cols-2 gap-space-sm">
            <QuickLink to="/donor/profile" icon="person" label="My Profile" />
            <QuickLink to="/donor/donations" icon="history" label="Donation History" />
            <QuickLink to="/donor/appeals" icon="campaign" label="Emergency Appeals" />
            <QuickLink to="/donor/feedback" icon="rate_review" label="Submit Feedback" />
          </div>
        </div>
        
        <div className="flex flex-col gap-space-md">
          <h2 className="font-heading text-xl font-bold text-on-surface border-b border-surface-container pb-space-sm">Upcoming Registrations</h2>
          {stats?.upcomingCamps === 0 ? (
            <p className="text-secondary text-sm bg-surface-container-lowest p-space-lg rounded-xl border border-surface-container text-center">
              You have no upcoming camps scheduled.
            </p>
          ) : (
            <div className="bg-surface-container-lowest p-space-lg rounded-xl border border-surface-container flex justify-between items-center">
              <span className="font-semibold">You have {stats?.upcomingCamps} upcoming camp(s).</span>
              <Link to="/donor/camps" className="text-primary font-bold hover:underline">View Details</Link>
            </div>
          )}
        </div>
      </div>

      {showMedicalCheck && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-space-md">
          <div className="bg-surface p-space-xl rounded-2xl w-full max-w-md">
            <h2 className="font-heading text-xl font-bold mb-space-md">Medical Questionnaire</h2>
            {medicalError && <div className="text-error mb-space-md text-sm">{medicalError}</div>}
            <form onSubmit={submitMedicalCheck} className="flex flex-col gap-space-md">
              <label className="flex flex-col gap-space-xs text-sm font-semibold">
                Are you feeling well today?
                <select 
                  className="p-space-sm border border-surface-container rounded-lg bg-surface"
                  value={medicalCheckForm.feelingWell.toString()}
                  onChange={e => setMedicalCheckForm({...medicalCheckForm, feelingWell: e.target.value === 'true'})}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
              <label className="flex flex-col gap-space-xs text-sm font-semibold">
                Have you taken antibiotics in the last 7 days?
                <select 
                  className="p-space-sm border border-surface-container rounded-lg bg-surface"
                  value={medicalCheckForm.recentAntibiotics.toString()}
                  onChange={e => setMedicalCheckForm({...medicalCheckForm, recentAntibiotics: e.target.value === 'true'})}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </label>
              <label className="flex flex-col gap-space-xs text-sm font-semibold">
                Have you had a tattoo or piercing in the last 6 months?
                <select 
                  className="p-space-sm border border-surface-container rounded-lg bg-surface"
                  value={medicalCheckForm.recentTattoo.toString()}
                  onChange={e => setMedicalCheckForm({...medicalCheckForm, recentTattoo: e.target.value === 'true'})}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </label>
              <div className="flex justify-end gap-space-md mt-space-md">
                <button 
                  type="button" 
                  onClick={() => setShowMedicalCheck(false)}
                  className="px-space-md py-space-sm rounded-lg font-bold text-secondary hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingMedical}
                  className="bg-primary text-on-primary px-space-md py-space-sm rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submittingMedical ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const QuickLink = ({ to, icon, label }: { to: string, icon: string, label: string }) => (
  <Link to={to} className="p-space-md rounded-xl bg-surface-container-lowest border border-surface-container hover:bg-surface-container transition-colors flex items-center gap-space-sm">
    <span className="material-symbols-outlined text-primary">{icon}</span>
    <span className="font-semibold text-sm">{label}</span>
  </Link>
);

export default DonorDashboard;
