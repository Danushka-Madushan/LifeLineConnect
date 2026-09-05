import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { ConfirmModal } from '../../components/ConfirmModal';

// --- Interfaces ---
interface DashboardStats {
  totalDonors: number;
  totalBanks: number;
  totalCommittees: number;
  ongoingCamps: number;
  completedCamps: number;
  totalDonations: number;
  pendingRequests: number;
}

interface OverviewStats {
  activeAppeals: number;
  totalCommunityThreads: number;
  systemHealth: string;
  uptime: string;
}

interface UserDto {
  userId: number;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string | null;
}

interface WebmasterBankDto {
  bankId: number;
  bankCode: string;
  bankName: string;
  phone: string;
  email: string;
  address: string;
  status: string;
}

interface WebmasterCommitteeDto {
  committeeId: number;
  committeeCode: string;
  committeeName: string;
  phone: string;
  email: string;
  address: string;
  status: string;
}

interface ThreadDto {
  id: string;
  title: string;
  content: string;
  authorName: string;
  category: string;
  repliesCount: number;
  createdAt: string;
}

interface QaDto {
  id: string;
  question: string;
  answer: string;
  authorName: string;
  category: string;
  helpfulCount: number;
  createdAt: string;
}

const WebmasterDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'banks' | 'committees' | 'community'>('overview');
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [error, setError] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);

  // Data states
  const [users, setUsers] = useState<UserDto[]>([]);
  const [banks, setBanks] = useState<WebmasterBankDto[]>([]);
  const [committees, setCommittees] = useState<WebmasterCommitteeDto[]>([]);
  const [threads, setThreads] = useState<ThreadDto[]>([]);
  const [qas, setQas] = useState<QaDto[]>([]);

  // Modal states
  const [showBankModal, setShowBankModal] = useState(false);
  const [showCommModal, setShowCommModal] = useState(false);
  const [showGuidelineModal, setShowGuidelineModal] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/webmaster/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch {
      toast.error('Failed to fetch users');
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await api.get('/webmaster/banks');
      if (res.data.success) {
        setBanks(res.data.data);
      }
    } catch {
      toast.error('Failed to fetch banks');
    }
  };

  const fetchCommittees = async () => {
    try {
      const res = await api.get('/webmaster/committees');
      if (res.data.success) {
        setCommittees(res.data.data);
      }
    } catch {
      toast.error('Failed to fetch committees');
    }
  };

  const fetchCommunity = async () => {
    try {
      const [tRes, qRes] = await Promise.all([
        api.get('/public/community/threads'),
        api.get('/public/community/qa'),
      ]);

      if (tRes.data.success) {
        setThreads(tRes.data.data);
      }

      if (qRes.data.success) {
        setQas(qRes.data.data);
      }
    } catch {
      toast.error('Failed to fetch community data');
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const [dashRes, overRes] = await Promise.all([
          api.get('/webmaster/dashboard'),
          api.get('/webmaster/overview'),
        ]);

        if (cancelled) return;

        if (dashRes.data.success) {
          setStats(dashRes.data.data);
        }

        if (overRes.data.success) {
          setOverview(overRes.data.data);
        }
      } catch (err) {
        if (cancelled) return;

        setError(
          (err as {
            response?: {
              data?: { message?: string };
            }
          }).response?.data?.message || 'Failed to load dashboard data.'
        );
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTabData = async () => {
      try {
        if (activeTab === 'users') {
          const res = await api.get('/webmaster/users');

          if (!cancelled && res.data.success) {
            setUsers(res.data.data);
          }
        } else if (activeTab === 'banks') {
          const res = await api.get('/webmaster/banks');

          if (!cancelled && res.data.success) {
            setBanks(res.data.data);
          }
        } else if (activeTab === 'committees') {
          const res = await api.get('/webmaster/committees');

          if (!cancelled && res.data.success) {
            setCommittees(res.data.data);
          }
        } else if (activeTab === 'community') {
          const [tRes, qRes] = await Promise.all([
            api.get('/public/community/threads'),
            api.get('/public/community/qa'),
          ]);

          if (!cancelled) {
            if (tRes.data.success) {
              setThreads(tRes.data.data);
            }

            if (qRes.data.success) {
              setQas(qRes.data.data);
            }
          }
        }
      } catch {
        if (!cancelled) {
          if (activeTab === 'users') {
            toast.error('Failed to fetch users');
          } else if (activeTab === 'banks') {
            toast.error('Failed to fetch banks');
          } else if (activeTab === 'committees') {
            toast.error('Failed to fetch committees');
          } else if (activeTab === 'community') {
            toast.error('Failed to fetch community data');
          }
        }
      }
    };

    if (activeTab !== 'overview') {
      loadTabData();
    }

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const handleDeleteUser = async (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Confirm Action',
      message: 'Are you sure you want to delete this user?',
      onConfirm: async () => {
    try {
      const res = await api.delete(`/webmaster/users/${id}`);
      if (res.data.success) {
        toast.success("User deleted successfully.");
        fetchUsers();
      }
    } catch { toast.error("Failed to delete user"); }
      }
    });
  };

  const handleDeleteThread = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Confirm Action',
      message: 'Delete this thread?',
      onConfirm: async () => {
    try {
      const res = await api.delete(`/webmaster/community/threads/${id}`);
      if (res.data.success) {
        toast.success("Thread deleted.");
        fetchCommunity();
      }
    } catch { toast.error("Failed to delete thread"); }
      }
    });
  };

  const handleDeleteQA = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Confirm Action',
      message: 'Delete this QA?',
      onConfirm: async () => {
    try {
      const res = await api.delete(`/webmaster/community/qa/${id}`);
      if (res.data.success) {
        toast.success("QA deleted.");
        fetchCommunity();
      }
    } catch { toast.error("Failed to delete QA"); }
      }
    });
  };

  const handleExportSystemReport = async () => {
    try {
      const res = await api.get('/webmaster/reports/system', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'System_Audit_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error("Failed to export report");
    }
  };

  const handleDatabaseBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await api.get('/webmaster/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'database_backup.dmp');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Backup downloaded successfully.");
    } catch {
      toast.error("Failed to generate or download database backup.");
    } finally {
      setBackupLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-space-2xl text-center">
        <div className="inline-block p-space-lg bg-error-container text-on-error-container rounded-lg">
          <span className="material-symbols-outlined text-4xl mb-space-sm block">error</span>
          {error}
        </div>
      </div>
    );
  }

  if (!stats || !overview) {
    return <div className="p-space-2xl text-center flex flex-col items-center gap-space-sm">
      <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
      <p>Loading global statistics...</p>
    </div>;
  }

  return (
    <div className="w-full max-w-360 mx-auto px-space-4xl py-space-3xl flex flex-col gap-space-4xl">
      <div className="flex flex-col gap-space-sm border-b border-surface-container pb-space-lg">
        <h1 className="font-heading text-4xl font-bold text-on-surface flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-[36px] text-primary">admin_panel_settings</span>
          Webmaster Administration
        </h1>
        <p className="font-body text-lg text-secondary">Global System Management & Moderation</p>
      </div>

      <div className="flex gap-space-md border-b border-surface-container pb-space-md">
        {(['overview', 'users', 'banks', 'committees', 'community'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-space-md py-space-sm rounded-lg font-semibold capitalize ${activeTab === tab ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="flex flex-col gap-space-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg">
            <StatCard icon="diversity_1" title="Total Donors" value={stats.totalDonors} color="text-primary" />
            <StatCard icon="local_hospital" title="Blood Banks" value={stats.totalBanks} color="text-[#059669]" />
            <StatCard icon="corporate_fare" title="Committees" value={stats.totalCommittees} color="text-[#0284C7]" />
            <StatCard icon="campaign" title="Ongoing Camps" value={stats.ongoingCamps} color="text-[#D97706]" />
            <StatCard icon="check_circle" title="Completed Camps" value={stats.completedCamps} color="text-[#4F46E5]" />
            <StatCard icon="bloodtype" title="Total Donations" value={stats.totalDonations} color="text-[#E11D48]" />
            <StatCard icon="pending_actions" title="Pending Hospital Reqs" value={stats.pendingRequests} color="text-[#C026D3]" />
            <StatCard icon="emergency" title="Active Appeals" value={overview.activeAppeals} color="text-error" />
          </div>

          <div className="bg-surface-container-lowest border border-surface-container p-space-xl rounded-2xl flex flex-col gap-space-md">
            <h2 className="font-heading text-2xl font-bold text-on-surface">System Tools</h2>
            <div className="flex gap-space-md flex-wrap">
              <button onClick={() => setShowGuidelineModal(true)} className="flex items-center gap-space-sm bg-surface-container px-space-md py-space-sm rounded-lg hover:bg-surface-container-high font-semibold">
                <span className="material-symbols-outlined text-[20px]">health_and_safety</span> Publish Medical Guideline
              </button>
              <button onClick={handleExportSystemReport} className="flex items-center gap-space-sm bg-primary text-on-primary px-space-md py-space-sm rounded-lg hover:bg-primary/90 font-semibold">
                <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span> Export System Audit Report
              </button>
              <button onClick={handleDatabaseBackup} disabled={backupLoading} className="flex items-center gap-space-sm bg-surface-container text-on-surface px-space-md py-space-sm rounded-lg hover:bg-surface-container-high font-semibold disabled:opacity-50">
                <span className={`material-symbols-outlined text-[20px] ${backupLoading ? 'animate-spin' : ''}`}>{backupLoading ? 'sync' : 'database'}</span> 
                {backupLoading ? 'Generating Backup...' : 'Database Backup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-surface-container-lowest border border-surface-container p-space-xl rounded-2xl">
          <h2 className="font-heading text-2xl font-bold mb-space-lg text-on-surface">Manage Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-container">
                  <th className="p-space-sm font-semibold text-secondary">ID</th>
                  <th className="p-space-sm font-semibold text-secondary">Email</th>
                  <th className="p-space-sm font-semibold text-secondary">Role</th>
                  <th className="p-space-sm font-semibold text-secondary">Status</th>
                  <th className="p-space-sm font-semibold text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.userId} className="border-b border-surface-container/50 hover:bg-surface-container/20">
                    <td className="p-space-sm">{u.userId}</td>
                    <td className="p-space-sm">{u.email}</td>
                    <td className="p-space-sm font-label"><span className="bg-surface-container px-2 py-1 rounded-md">{u.role}</span></td>
                    <td className="p-space-sm">
                      <span className={`font-semibold ${u.status === 'ACTIVE' ? 'text-primary' : 'text-error'}`}>{u.status}</span>
                    </td>
                    <td className="p-space-sm">
                      {u.role !== 'WEBMASTER' && u.status !== 'DELETED' && (
                        <button onClick={() => handleDeleteUser(u.userId)} className="px-3 py-1 bg-error-container text-error rounded hover:bg-error hover:text-white text-xs font-bold transition-colors">
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={5} className="p-space-md text-center text-secondary">No users found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'banks' && (
        <div className="bg-surface-container-lowest border border-surface-container p-space-xl rounded-2xl">
          <div className="flex justify-between items-center mb-space-lg">
            <h2 className="font-heading text-2xl font-bold text-on-surface">Registered Blood Banks</h2>
            <button onClick={() => setShowBankModal(true)} className="bg-primary text-on-primary px-space-md py-space-sm rounded-lg font-semibold">
              + Register New Bank
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-container">
                  <th className="p-space-sm font-semibold text-secondary">Code</th>
                  <th className="p-space-sm font-semibold text-secondary">Name</th>
                  <th className="p-space-sm font-semibold text-secondary">Email</th>
                  <th className="p-space-sm font-semibold text-secondary">Phone</th>
                  <th className="p-space-sm font-semibold text-secondary">Status</th>
                </tr>
              </thead>
              <tbody>
                {banks.map(b => (
                  <tr key={b.bankId} className="border-b border-surface-container/50">
                    <td className="p-space-sm font-mono text-sm">{b.bankCode}</td>
                    <td className="p-space-sm font-semibold">{b.bankName}</td>
                    <td className="p-space-sm">{b.email}</td>
                    <td className="p-space-sm">{b.phone}</td>
                    <td className="p-space-sm">{b.status}</td>
                  </tr>
                ))}
                {banks.length === 0 && <tr><td colSpan={5} className="p-space-md text-center text-secondary">No banks found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'committees' && (
        <div className="bg-surface-container-lowest border border-surface-container p-space-xl rounded-2xl">
          <div className="flex justify-between items-center mb-space-lg">
            <h2 className="font-heading text-2xl font-bold text-on-surface">Organizing Committees</h2>
            <button onClick={() => setShowCommModal(true)} className="bg-primary text-on-primary px-space-md py-space-sm rounded-lg font-semibold">
              + Register Committee
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-container">
                  <th className="p-space-sm font-semibold text-secondary">Code</th>
                  <th className="p-space-sm font-semibold text-secondary">Name</th>
                  <th className="p-space-sm font-semibold text-secondary">Email</th>
                  <th className="p-space-sm font-semibold text-secondary">Phone</th>
                  <th className="p-space-sm font-semibold text-secondary">Status</th>
                </tr>
              </thead>
              <tbody>
                {committees.map(c => (
                  <tr key={c.committeeId} className="border-b border-surface-container/50">
                    <td className="p-space-sm font-mono text-sm">{c.committeeCode}</td>
                    <td className="p-space-sm font-semibold">{c.committeeName}</td>
                    <td className="p-space-sm">{c.email}</td>
                    <td className="p-space-sm">{c.phone}</td>
                    <td className="p-space-sm">{c.status}</td>
                  </tr>
                ))}
                {committees.length === 0 && <tr><td colSpan={5} className="p-space-md text-center text-secondary">No committees found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'community' && (
        <div className="flex flex-col gap-space-xl">
          <div className="bg-surface-container-lowest border border-surface-container p-space-xl rounded-2xl">
            <h2 className="font-heading text-2xl font-bold mb-space-lg text-on-surface">Community Threads</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-container">
                    <th className="p-space-sm font-semibold text-secondary">Title</th>
                    <th className="p-space-sm font-semibold text-secondary">Author ID</th>
                    <th className="p-space-sm font-semibold text-secondary">Category</th>
                    <th className="p-space-sm font-semibold text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {threads.map(t => (
                    <tr key={t.id} className="border-b border-surface-container/50">
                      <td className="p-space-sm font-semibold">{t.title}</td>
                      <td className="p-space-sm">{t.authorName}</td>
                      <td className="p-space-sm text-sm">{t.category}</td>
                      <td className="p-space-sm">
                        <button onClick={() => handleDeleteThread(t.id)} className="px-3 py-1 bg-error-container text-error rounded hover:bg-error hover:text-white text-xs font-bold transition-colors">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {threads.length === 0 && <tr><td colSpan={4} className="p-space-md text-center text-secondary">No threads.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-surface-container p-space-xl rounded-2xl">
            <h2 className="font-heading text-2xl font-bold mb-space-lg text-on-surface">Q&A</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-container">
                    <th className="p-space-sm font-semibold text-secondary">Question</th>
                    <th className="p-space-sm font-semibold text-secondary">Author ID</th>
                    <th className="p-space-sm font-semibold text-secondary">Status</th>
                    <th className="p-space-sm font-semibold text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {qas.map(q => (
                    <tr key={q.id} className="border-b border-surface-container/50">
                      <td className="p-space-sm">{q.question}</td>
                      <td className="p-space-sm">{q.authorName}</td>
                      <td className="p-space-sm text-sm">{(q.answer && q.answer !== 'Pending answer from community...') ? 'Answered' : 'Open'}</td>
                      <td className="p-space-sm">
                        <button onClick={() => handleDeleteQA(q.id)} className="px-3 py-1 bg-error-container text-error rounded hover:bg-error hover:text-white text-xs font-bold transition-colors">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {qas.length === 0 && <tr><td colSpan={4} className="p-space-md text-center text-secondary">No Q&A.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showBankModal && <RegisterBankModal onClose={() => { setShowBankModal(false); fetchBanks(); }} />}
      {showCommModal && <RegisterCommModal onClose={() => { setShowCommModal(false); fetchCommittees(); }} />}
      {showGuidelineModal && <CreateGuidelineModal onClose={() => setShowGuidelineModal(false)} />}
      <ConfirmModal {...confirmConfig} onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })} />
    </div>
  );
};

// --- Modal Components ---

const ModalWrapper = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-space-md">
    <div className="bg-surface rounded-2xl w-full max-w-lg p-space-xl flex flex-col gap-space-lg shadow-xl">
      <div className="flex justify-between items-center border-b border-surface-container pb-space-md">
        <h3 className="font-heading text-xl font-bold">{title}</h3>
        <button onClick={onClose} className="text-secondary hover:text-on-surface">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      {children}
    </div>
  </div>
);

const RegisterBankModal = ({ onClose }: { onClose: () => void }) => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', bankCode: '', bankName: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/webmaster/register-bank', formData);
      if (res.data.success) {
        toast.success("Blood bank registered successfully!");
        onClose();
      }
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to register bank");
    }
    setLoading(false);
  };

  return (
    <ModalWrapper title="Register Blood Bank" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-space-md">
        <div className="grid grid-cols-2 gap-space-md">
          <input required placeholder="Username" className="p-space-sm border border-outline rounded-lg bg-transparent" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
          <input required type="email" placeholder="Email" className="p-space-sm border border-outline rounded-lg bg-transparent" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          <input required type="password" placeholder="Password (8+ chars)" className="p-space-sm border border-outline rounded-lg bg-transparent" minLength={8} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          <input required placeholder="Bank Code (e.g. NBTS-01)" className="p-space-sm border border-outline rounded-lg bg-transparent" value={formData.bankCode} onChange={e => setFormData({ ...formData, bankCode: e.target.value })} />
        </div>
        <input required placeholder="Bank Name" className="p-space-sm border border-outline rounded-lg bg-transparent" value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })} />
        <input required placeholder="Phone" className="p-space-sm border border-outline rounded-lg bg-transparent" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
        <textarea required placeholder="Address" className="p-space-sm border border-outline rounded-lg bg-transparent" rows={2} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
        <div className="flex justify-end pt-space-md">
          <button type="submit" disabled={loading} className="bg-primary text-on-primary px-space-lg py-space-sm rounded-lg font-semibold disabled:opacity-50">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

const RegisterCommModal = ({ onClose }: { onClose: () => void }) => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', committeeCode: '', committeeName: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/webmaster/register-committee', formData);
      if (res.data.success) {
        toast.success("Committee registered successfully!");
        onClose();
      }
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to register committee");
    }
    setLoading(false);
  };

  return (
    <ModalWrapper title="Register Organizing Committee" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-space-md">
        <div className="grid grid-cols-2 gap-space-md">
          <input required placeholder="Username" className="p-space-sm border border-outline rounded-lg bg-transparent" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
          <input required type="email" placeholder="Email" className="p-space-sm border border-outline rounded-lg bg-transparent" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          <input required type="password" placeholder="Password (8+ chars)" className="p-space-sm border border-outline rounded-lg bg-transparent" minLength={8} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          <input required placeholder="Committee Code" className="p-space-sm border border-outline rounded-lg bg-transparent" value={formData.committeeCode} onChange={e => setFormData({ ...formData, committeeCode: e.target.value })} />
        </div>
        <input required placeholder="Committee Name" className="p-space-sm border border-outline rounded-lg bg-transparent" value={formData.committeeName} onChange={e => setFormData({ ...formData, committeeName: e.target.value })} />
        <input required placeholder="Phone" className="p-space-sm border border-outline rounded-lg bg-transparent" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
        <textarea required placeholder="Address" className="p-space-sm border border-outline rounded-lg bg-transparent" rows={2} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
        <div className="flex justify-end pt-space-md">
          <button type="submit" disabled={loading} className="bg-primary text-on-primary px-space-lg py-space-sm rounded-lg font-semibold disabled:opacity-50">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

const CreateGuidelineModal = ({ onClose }: { onClose: () => void }) => {
  const [formData, setFormData] = useState({ title: '', description: '', category: 'PRE_DONATION' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/webmaster/guidelines', { ...formData, isActive: true });
      if (res.data.success) {
        toast.success("Medical guideline published!");
        onClose();
      }
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to publish guideline");
    }
    setLoading(false);
  };

  return (
    <ModalWrapper title="Publish Medical Guideline" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-space-md">
        <input required placeholder="Guideline Title" className="p-space-sm border border-outline rounded-lg bg-transparent" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
        <select className="p-space-sm border border-outline rounded-lg bg-transparent" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
          <option value="PRE_DONATION">Pre-Donation</option>
          <option value="ELIGIBILITY">Eligibility Criteria</option>
          <option value="POST_DONATION">Post-Donation Care</option>
          <option value="GENERAL">General Information</option>
        </select>
        <textarea required placeholder="Guideline Description" className="p-space-sm border border-outline rounded-lg bg-transparent" rows={5} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
        <div className="flex justify-end pt-space-md">
          <button type="submit" disabled={loading} className="bg-primary text-on-primary px-space-lg py-space-sm rounded-lg font-semibold disabled:opacity-50">
            {loading ? 'Publishing...' : 'Publish Guideline'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

const StatCard = ({ icon, title, value, color }: { icon: string, title: string, value: number, color: string }) => (
  <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container hover:shadow-sm transition-shadow flex items-center gap-space-md">
    <div className={`p-space-md rounded-full bg-surface-container ${color} flex items-center justify-center`}>
      <span className="material-symbols-outlined text-[28px]">{icon}</span>
    </div>
    <div className="flex flex-col">
      <span className="font-label text-xs uppercase tracking-wider text-secondary">{title}</span>
      <span className="font-heading text-2xl font-bold text-on-surface">{value?.toLocaleString() ?? 0}</span>
    </div>
  </div>
);

export default WebmasterDashboard;
