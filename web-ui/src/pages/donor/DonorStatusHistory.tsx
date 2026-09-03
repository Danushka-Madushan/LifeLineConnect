import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';

interface StatusEvent {
  eventType: string;
  eventDate: string;
  eventTitle: string;
  status: string;
  details: string;
}

export function DonorStatusHistory() {
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/donors/me/status-history');
        if (res.data.success) {
          setEvents(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch status history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="p-space-lg text-center font-bold text-gray-500">Loading timeline...</div>;

  return (
    <div className="p-space-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-space-md">
        <h1 className="text-2xl font-bold text-gray-900">Status History Timeline</h1>
        <Link to="/donor/dashboard" className="text-[#e11d48] font-bold underline">Back to Dashboard</Link>
      </div>

      <div className="space-y-space-md">
        {events.length === 0 ? (
          <p className="text-gray-500">No history found.</p>
        ) : (
          events.map((ev, idx) => (
            <div key={idx} className="bg-white p-space-md rounded shadow border-l-4 border-[#e11d48]">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-bold text-gray-800">{ev.eventTitle}</h2>
                <span className="text-sm font-semibold bg-gray-100 px-2 py-1 rounded">
                  {new Date(ev.eventDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span className="font-semibold uppercase text-blue-600">{ev.eventType}</span>
                <span>Status: <strong className="uppercase">{ev.status}</strong></span>
              </div>
              <p className="text-gray-700 mt-space-sm">{ev.details}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
