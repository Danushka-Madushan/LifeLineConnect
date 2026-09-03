import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    nic: '',
    dateOfBirth: '',
    gender: 'PREFER_NOT_TO_SAY',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/donors/register', formData);
      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        navigate('/donor/dashboard');
      } else {
        setError(res.data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-space-lg bg-surface">
      <div className="w-full max-w-2xl bg-surface-container-lowest p-space-2xl rounded-2xl shadow-sm border border-surface-container">
        <h1 className="font-heading text-3xl font-bold text-center text-on-surface mb-space-xs">Become a Donor</h1>
        <p className="font-body text-center text-secondary mb-space-xl">Register to join the national blood supply network.</p>

        {error && (
          <div className="mb-space-lg p-space-md bg-error-container text-on-error-container rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
          <div className="flex flex-col gap-space-xs md:col-span-2">
            <label className="font-label text-sm font-semibold text-on-surface">Full Name</label>
            <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} required className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface" />
          </div>

          <div className="flex flex-col gap-space-xs">
            <label className="font-label text-sm font-semibold text-on-surface">Username</label>
            <input name="username" type="text" value={formData.username} onChange={handleChange} required className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface" />
          </div>

          <div className="flex flex-col gap-space-xs">
            <label className="font-label text-sm font-semibold text-on-surface">Email Address</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} required className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface" />
          </div>

          <div className="flex flex-col gap-space-xs">
            <label className="font-label text-sm font-semibold text-on-surface">Password</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange} required className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface" />
          </div>

          <div className="flex flex-col gap-space-xs">
            <label className="font-label text-sm font-semibold text-on-surface">NIC (National Identity Card)</label>
            <input name="nic" type="text" value={formData.nic} onChange={handleChange} required className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface" />
          </div>

          <div className="flex flex-col gap-space-xs">
            <label className="font-label text-sm font-semibold text-on-surface">Date of Birth</label>
            <input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface" />
          </div>

          <div className="flex flex-col gap-space-xs">
            <label className="font-label text-sm font-semibold text-on-surface">Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface">
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </div>

          <div className="flex flex-col gap-space-xs md:col-span-2">
            <label className="font-label text-sm font-semibold text-on-surface">Phone Number</label>
            <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface" />
          </div>

          <div className="flex flex-col gap-space-xs md:col-span-2">
            <label className="font-label text-sm font-semibold text-on-surface">Home Address</label>
            <input name="address" type="text" value={formData.address} onChange={handleChange} className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface" />
          </div>

          <div className="md:col-span-2 mt-space-md">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary text-on-primary py-space-md rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70 flex justify-center items-center"
            >
              {isLoading ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Register'}
            </button>
          </div>
        </form>

        <p className="mt-space-xl text-center text-sm text-secondary">
          Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
