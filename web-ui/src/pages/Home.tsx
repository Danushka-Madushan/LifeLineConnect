import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface EmergencyBroadcast {
  id: string;
  message: string;
  severity: string;
}

interface EmergencyAppeal {
  id: string;
  patientName: string;
  bloodGroup: string;
  unitsRequired: number;
  hospitalName: string;
  location: string;
  urgencyLevel: string;
  contactPhone: string;
  createdAt: string;
}

const Home = () => {
  const [broadcasts, setBroadcasts] = useState<EmergencyBroadcast[]>([]);
  const [appeals, setAppeals] = useState<EmergencyAppeal[]>([]);

  const [stats, setStats] = useState({ totalDonors: 0, activeCamps: 0, litersCollected: 0 });

  useEffect(() => {
    // ... other fetches
    api.get('/public/stats').then(res => {
      if (res.data.success) setStats(res.data.data);
    }).catch(console.error);
    async function fetchBroadcasts() {
      try {
        const res = await api.get('/public/emergency-broadcasts');
        if (res.data.success) {
          setBroadcasts(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch broadcasts', err);
      }
    };
    async function fetchAppeals() {
      try {
        const res = await api.get('/public/emergency-appeals');
        if (res.data.success) {
          setAppeals(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch appeals', err);
      }
    };
    fetchBroadcasts();
    fetchAppeals();
  }, []);

  return (
    <div className="w-full max-w-360 mx-auto px-space-4xl py-space-3xl flex flex-col gap-space-4xl">
      {/* Task: HOME-02 - Emergency Broadcasts */}
      {broadcasts.length > 0 && (
        <section className="flex flex-col gap-space-sm">
          {broadcasts.map(b => (
            <div key={b.id} className={`p-space-md rounded-lg flex items-start gap-space-sm ${
              b.severity === 'CRITICAL' ? 'bg-error-container text-on-error-container' : 
              b.severity === 'WARNING' ? 'bg-[#fff4ce] text-[#7a5c00]' : 
              'bg-surface-container-highest text-on-surface'
            }`}>
              <span className="material-symbols-outlined mt-0.5">
                {b.severity === 'CRITICAL' ? 'warning' : 'info'}
              </span>
              <p className="font-body text-sm font-medium leading-relaxed">{b.message}</p>
            </div>
          ))}
        </section>
      )}

      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-xl">
        <div className="max-w-3xl flex flex-col gap-space-sm">
          <h1 className="font-heading text-4xl lg:text-5xl font-bold tracking-tight text-on-surface">
            Give Blood. Save Lives.
          </h1>
          <p className="font-body text-lg text-secondary leading-relaxed">
            Join the national blood supply network. Whether you are a donor, a blood bank, or an organizing committee, your role is critical in orchestrating life-saving donations.
          </p>
          {/* Task: HOME-15 - Public status indicators */}
          <div className="flex flex-wrap items-center gap-space-lg mt-space-md">
            <div className="flex flex-col">
              <span className="font-heading text-3xl font-bold text-primary">{stats.totalDonors.toLocaleString()}</span>
              <span className="font-label text-xs uppercase tracking-wider text-secondary">Registered Donors</span>
            </div>
            <div className="w-px h-8 bg-surface-container-high hidden sm:block"></div>
            <div className="flex flex-col">
              <span className="font-heading text-3xl font-bold text-primary">{stats.activeCamps.toLocaleString()}</span>
              <span className="font-label text-xs uppercase tracking-wider text-secondary">Active Campaigns</span>
            </div>
            <div className="w-px h-8 bg-surface-container-high hidden sm:block"></div>
            <div className="flex flex-col">
              <span className="font-heading text-3xl font-bold text-primary">{stats.litersCollected.toLocaleString(undefined, {maximumFractionDigits: 1})} L</span>
              <span className="font-label text-xs uppercase tracking-wider text-secondary">Blood Collected</span>
            </div>
          </div>
        </div>
      </section>

      {/* Task: HOME-03 - Emergency blood appeal notices */}
      {appeals.length > 0 && (
        <section className="flex flex-col gap-space-lg pt-space-xl border-t border-surface-container">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold text-on-surface flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-error text-[28px]">emergency</span>
              Emergency Appeals
            </h2>
            <Link to="/appeals" className="font-label text-sm text-primary hover:underline font-semibold">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-lg">
            {appeals.map(appeal => (
              <div key={appeal.id} className="p-space-lg rounded-xl bg-surface-container-lowest border border-error-container shadow-sm flex flex-col gap-space-md relative overflow-hidden">
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
                <div className="flex flex-col gap-space-xs font-body text-sm text-secondary">
                  <div className="flex items-center gap-space-sm"><span className="material-symbols-outlined text-[16px]">local_hospital</span> {appeal.hospitalName}</div>
                  <div className="flex items-center gap-space-sm"><span className="material-symbols-outlined text-[16px]">location_on</span> {appeal.location}</div>
                  <div className="flex items-center gap-space-sm"><span className="material-symbols-outlined text-[16px]">bloodtype</span> Requires {appeal.unitsRequired} units</div>
                </div>
                <div className="mt-auto pt-space-md border-t border-surface-container-high flex justify-between items-center">
                  <span className="font-label text-sm text-on-surface font-medium">{appeal.contactPhone}</span>
                  <button className="px-space-md py-space-xs bg-error text-on-error rounded-lg text-sm font-semibold hover:bg-error-container transition-colors">
                    I Can Donate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Task: HOME-01 - 3 distinctive entry buttons */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
        {/* Donor Entry */}
        <div className="p-space-xl rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-lg hover:shadow-md transition-shadow border border-surface-container">
          <div className="flex flex-col gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[26px]">volunteer_activism</span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <h3 className="font-heading text-xl font-bold text-on-surface">For Donors</h3>
            </div>
            <p className="font-body text-sm text-secondary">
              Find nearby donation camps, check your eligibility, and track your life-saving donations.
            </p>
          </div>
          <Link to="/register?role=donor" className="w-full py-space-sm rounded-lg bg-primary text-on-primary font-semibold text-center hover:bg-primary-container transition-colors shadow-sm">
            Become a Donor
          </Link>
        </div>

        {/* Blood Bank Entry */}
        <div className="p-space-xl rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-lg hover:shadow-md transition-shadow border border-surface-container">
          <div className="flex flex-col gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[26px]">local_hospital</span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <h3 className="font-heading text-xl font-bold text-on-surface">For Blood Banks</h3>
            </div>
            <p className="font-body text-sm text-secondary">
              Manage critical blood inventory, fulfill hospital requests, and coordinate incoming donations.
            </p>
          </div>
          <Link to="/login?role=bank" className="w-full py-space-sm rounded-lg bg-surface-container-low text-on-surface font-semibold text-center hover:bg-surface-container transition-colors">
            Blood Bank Portal
          </Link>
        </div>

        {/* Organizing Committee Entry */}
        <div className="p-space-xl rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-lg hover:shadow-md transition-shadow border border-surface-container">
          <div className="flex flex-col gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[26px]">event_available</span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <h3 className="font-heading text-xl font-bold text-on-surface">For Organizing Committees</h3>
            </div>
            <p className="font-body text-sm text-secondary">
              Organize donation camps, register donors on-site, and transfer collected units to blood banks.
            </p>
          </div>
          <Link to="/login?role=committee" className="w-full py-space-sm rounded-lg bg-surface-container-low text-on-surface font-semibold text-center hover:bg-surface-container transition-colors">
            Committee Portal
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
