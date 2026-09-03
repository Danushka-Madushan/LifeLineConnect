import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Community from './pages/Community';
import Camps from './pages/Camps';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import WebmasterDashboard from './pages/webmaster/WebmasterDashboard';
import DonorDashboard from './pages/donor/DonorDashboard';
import DonorProfile from './pages/donor/DonorProfile';
import DonorCamps from './pages/donor/DonorCamps';
import DonorDonations from './pages/donor/DonorDonations';
import DonorAppeals from './pages/donor/DonorAppeals';
import DonorFeedback from './pages/donor/DonorFeedback';

import BankDashboard from './pages/bloodbank/BankDashboard';
import BankInventory from './pages/bloodbank/BankInventory';
import BankTransfers from './pages/bloodbank/BankTransfers';
import BankHospitalRequests from './pages/bloodbank/BankHospitalRequests';
import BankStaff from './pages/bloodbank/BankStaff';

import CommitteeDashboard from './pages/committee/CommitteeDashboard';
import CommitteeVenues from './pages/committee/CommitteeVenues';
import CommitteeCamps from './pages/committee/CommitteeCamps';
import CommitteeCampDetails from './pages/committee/CommitteeCampDetails';
import CommitteeTransfers from './pages/committee/CommitteeTransfers';
import CommitteeStaff from './pages/committee/CommitteeStaff';

import Appeals from './pages/Appeals';
import Resources from './pages/Resources';
import Notifications from './pages/Notifications';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-surface border-b border-surface-container fixed top-0 w-full z-50 px-space-xl flex items-center justify-between">
      <div className="flex items-center gap-space-xl">
        <Link to="/" className="font-heading text-xl font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px]">bloodtype</span>
          LifeLineConnect
        </Link>
        <nav className="hidden md:flex gap-space-lg font-label text-sm font-semibold">
          <Link to="/camps" className="text-secondary hover:text-on-surface transition-colors">Camps</Link>
          <Link to="/appeals" className="text-secondary hover:text-on-surface transition-colors">Appeals</Link>
          <Link to="/community" className="text-secondary hover:text-on-surface transition-colors">Community</Link>
          <Link to="/resources" className="text-secondary hover:text-on-surface transition-colors">Resources</Link>
            {user?.role === 'WEBMASTER' && (
              <Link to="/webmaster" className="text-primary hover:text-primary/80 transition-colors">Webmaster Dashboard</Link>
            )}
            {user?.role === 'DONOR' && (
              <Link to="/donor/dashboard" className="text-primary hover:text-primary/80 transition-colors">Donor Dashboard</Link>
            )}
            {user?.role === 'BLOOD_BANK' && (
              <Link to="/bloodbank/dashboard" className="text-primary hover:text-primary/80 transition-colors">Blood Bank Dashboard</Link>
            )}
            {user?.role === 'ORGANIZING_COMMITTEE' && (
              <Link to="/committee/dashboard" className="text-primary hover:text-primary/80 transition-colors">Committee Hub</Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-space-md">
          {user ? (
            <div className="flex items-center gap-space-md">
              <Link to="/notifications" className="relative p-2 text-secondary hover:text-primary transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined">notifications</span>
              </Link>
              <span className="font-label text-sm text-secondary hidden sm:inline-block">
                Hi, <strong>{user.username}</strong> ({user.role})
              </span>
              <button 
                onClick={logout}
                className="px-space-md py-space-sm rounded-lg border border-surface-container-high text-on-surface font-semibold hover:bg-surface-container transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container transition-colors">
                Login
              </Link>
              <Link to="/register" className="px-space-md py-space-sm rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-container transition-colors shadow-sm">
                Register
              </Link>
            </>
          )}
        </div>
    </header>
  );
};

// Simple Protected Route wrapper
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, token } = useAuth();
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Unauthorized
  }
  
  return <>{children}</>;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-surface font-body text-on-surface">
          <Header />
          <main className="flex-1 pt-16">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/community" element={<Community />} />
              <Route path="/camps" element={<Camps />} />
              <Route path="/appeals" element={<Appeals />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Global Routes */}
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

              {/* Webmaster Routes */}
              <Route 
                path="/webmaster/*" 
                element={
                  <ProtectedRoute allowedRoles={['WEBMASTER']}>
                    <WebmasterDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Donor Routes */}
              <Route path="/donor/dashboard" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorDashboard /></ProtectedRoute>} />
              <Route path="/donor/profile" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorProfile /></ProtectedRoute>} />
              <Route path="/donor/camps" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorCamps /></ProtectedRoute>} />
              <Route path="/donor/donations" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorDonations /></ProtectedRoute>} />
              <Route path="/donor/appeals" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorAppeals /></ProtectedRoute>} />
              <Route path="/donor/feedback" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorFeedback /></ProtectedRoute>} />
              
              {/* Blood Bank Routes */}
              <Route path="/bloodbank/dashboard" element={<ProtectedRoute allowedRoles={['BLOOD_BANK']}><BankDashboard /></ProtectedRoute>} />
              <Route path="/bloodbank/inventory" element={<ProtectedRoute allowedRoles={['BLOOD_BANK']}><BankInventory /></ProtectedRoute>} />
              <Route path="/bloodbank/transfers" element={<ProtectedRoute allowedRoles={['BLOOD_BANK']}><BankTransfers /></ProtectedRoute>} />
              <Route path="/bloodbank/hospital-requests" element={<ProtectedRoute allowedRoles={['BLOOD_BANK']}><BankHospitalRequests /></ProtectedRoute>} />
              <Route path="/bloodbank/staff" element={<ProtectedRoute allowedRoles={['BLOOD_BANK']}><BankStaff /></ProtectedRoute>} />

              {/* Organizing Committee Routes */}
              <Route path="/committee/dashboard" element={<ProtectedRoute allowedRoles={['ORGANIZING_COMMITTEE']}><CommitteeDashboard /></ProtectedRoute>} />
              <Route path="/committee/venues" element={<ProtectedRoute allowedRoles={['ORGANIZING_COMMITTEE']}><CommitteeVenues /></ProtectedRoute>} />
              <Route path="/committee/camps" element={<ProtectedRoute allowedRoles={['ORGANIZING_COMMITTEE']}><CommitteeCamps /></ProtectedRoute>} />
              <Route path="/committee/camps/:campId" element={<ProtectedRoute allowedRoles={['ORGANIZING_COMMITTEE']}><CommitteeCampDetails /></ProtectedRoute>} />
              <Route path="/committee/transfers" element={<ProtectedRoute allowedRoles={['ORGANIZING_COMMITTEE']}><CommitteeTransfers /></ProtectedRoute>} />
              <Route path="/committee/staff" element={<ProtectedRoute allowedRoles={['ORGANIZING_COMMITTEE']}><CommitteeStaff /></ProtectedRoute>} />
              
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
