import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Promotional() {
  const [media, setMedia] = useState<any[]>([]);

  useEffect(() => {
    api.get('/public/promotional-media').then(res => {
      if (res.data.success) setMedia(res.data.data);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-space-lg">
      <h1 className="text-3xl font-bold mb-space-md">Promotional Media</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        {media.map(m => (
          <div key={m.id} className="border p-space-md rounded shadow">
            <h2 className="text-xl font-bold">{m.title}</h2>
            <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View Media</a>
          </div>
        ))}
        {media.length === 0 && <p>No promotional media available.</p>}
      </div>
    </div>
  );
}
