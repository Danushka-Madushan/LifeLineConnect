import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { username: username.toLowerCase(), password });
      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        
        // Role-based routing
        const role = res.data.data.user.role;
        if (role === 'WEBMASTER') {
          navigate('/webmaster');
        } else if (role === 'DONOR') {
          navigate('/donor/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError(res.data.message || 'Login failed');
      }
    } catch (err) {
      setError((err as import("axios").AxiosError<{message: string}>).response?.data?.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-space-lg bg-surface">
      <div className="w-full max-w-md bg-surface-container-lowest p-space-2xl rounded-2xl shadow-sm border border-surface-container">
        <h1 className="font-heading text-3xl font-bold text-center text-on-surface mb-space-xs">Welcome Back</h1>
        <p className="font-body text-center text-secondary mb-space-xl">Log in to your LifeLineConnect account</p>

        {error && (
          <div className="mb-space-lg p-space-md bg-error-container text-on-error-container rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-space-lg">
          <div className="flex flex-col gap-space-xs">
            <label className="font-label text-sm font-semibold text-on-surface">Username or Email</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface"
              placeholder="Enter your username"
              required 
            />
          </div>

          <div className="flex flex-col gap-space-xs">
            <label className="font-label text-sm font-semibold text-on-surface">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface"
              placeholder="Enter your password"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-space-md w-full bg-primary text-on-primary py-space-md rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70 flex justify-center items-center"
          >
            {isLoading ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Sign In'}
          </button>
        </form>

        <p className="mt-space-xl text-center text-sm text-secondary">
          Don't have an account? <Link to="/register" className="text-primary font-semibold hover:underline">Register as a Donor</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
