import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchNotifications() {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function markRead(id: number) {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  return (
    <div className="max-w-200 mx-auto px-space-2xl py-space-xl">
      <h1 className="font-heading text-3xl font-bold text-on-surface mb-space-xl">Your Notifications</h1>

      {loading ? (
        <div className="text-center p-space-2xl"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>
      ) : notifications.length === 0 ? (
        <div className="text-center p-space-2xl text-secondary bg-surface-container-lowest rounded-xl border border-surface-container">
          You have no notifications.
        </div>
      ) : (
        <div className="flex flex-col gap-space-sm">
          {notifications.map(n => (
            <div key={n.id} onClick={() => !n.isRead && markRead(n.id)} className={`p-space-lg rounded-xl border flex flex-col gap-space-xs cursor-pointer transition-colors ${n.isRead ? 'bg-surface-container-lowest border-surface-container opacity-70' : 'bg-surface-container-low border-primary shadow-sm'}`}>
              <div className="flex justify-between items-start">
                <span className="font-bold text-on-surface">{n.title}</span>
                <span className="text-xs font-label text-secondary">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-on-surface">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
