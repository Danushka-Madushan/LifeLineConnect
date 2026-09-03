import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const DonorProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/donors/me/profile');
        if (res.data.success) {
          setProfile(res.data.data);
        }
      } catch (err) {
        setMessage('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: any) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await api.put('/donors/me/profile', {
        fullName: profile.fullName,
        phone: profile.phone,
        email: profile.email,
        address: profile.address,
        bloodGroup: profile.bloodGroup,
        gender: profile.gender
      });
      if (res.data.success) {
        setMessage('Profile updated successfully!');
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-space-2xl text-center"><span className="material-symbols-outlined animate-spin text-4xl">sync</span></div>;
  if (!profile) return <div className="p-space-2xl text-center text-error">Could not load profile.</div>;

  return (
    <div className="max-w-[800px] mx-auto px-space-2xl py-space-xl">
      <h1 className="font-heading text-3xl font-bold text-on-surface border-b border-surface-container pb-space-md mb-space-xl">My Profile</h1>
      
      {message && (
        <div className={`mb-space-lg p-space-md rounded-lg text-sm font-semibold ${message.includes('success') ? 'bg-[#059669]/10 text-[#059669]' : 'bg-error-container text-error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-space-lg bg-surface-container-lowest p-space-xl rounded-2xl border border-surface-container shadow-sm">
        <div className="flex flex-col gap-space-xs">
          <label className="font-label text-sm text-secondary">NIC (Not Editable)</label>
          <input type="text" value={profile.nic} disabled className="px-space-md py-space-sm border border-surface-container rounded-lg bg-surface-container-low text-secondary" />
        </div>
        <div className="flex flex-col gap-space-xs">
          <label className="font-label text-sm text-secondary">Date of Birth (Not Editable)</label>
          <input type="text" value={new Date(profile.dateOfBirth).toLocaleDateString()} disabled className="px-space-md py-space-sm border border-surface-container rounded-lg bg-surface-container-low text-secondary" />
        </div>
        <div className="flex flex-col gap-space-xs md:col-span-2">
          <label className="font-label text-sm font-semibold">Full Name</label>
          <input name="fullName" value={profile.fullName} onChange={handleChange} required className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface" />
        </div>
        <div className="flex flex-col gap-space-xs">
          <label className="font-label text-sm font-semibold">Email</label>
          <input name="email" type="email" value={profile.email} onChange={handleChange} required className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface" />
        </div>
        <div className="flex flex-col gap-space-xs">
          <label className="font-label text-sm font-semibold">Phone</label>
          <input name="phone" type="text" value={profile.phone} onChange={handleChange} required className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface" />
        </div>
        <div className="flex flex-col gap-space-xs">
          <label className="font-label text-sm font-semibold">Blood Group</label>
          <select name="bloodGroup" value={profile.bloodGroup} onChange={handleChange} className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface">
            <option value="">Unknown</option>
            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-space-xs">
          <label className="font-label text-sm font-semibold">Gender</label>
          <select name="gender" value={profile.gender} onChange={handleChange} className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface">
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          </select>
        </div>
        <div className="flex flex-col gap-space-xs md:col-span-2">
          <label className="font-label text-sm font-semibold">Address</label>
          <input name="address" type="text" value={profile.address} onChange={handleChange} required className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface" />
        </div>
        <div className="md:col-span-2 mt-space-md">
          <button type="submit" disabled={saving} className="bg-primary text-on-primary px-space-xl py-space-md rounded-lg font-bold w-full md:w-auto hover:bg-primary-container disabled:opacity-70 flex items-center justify-center gap-space-sm">
            {saving ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DonorProfile;
