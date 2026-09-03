import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Guidelines() {
  const [guidelines, setGuidelines] = useState<MedicalGuideline[]>([]);

  useEffect(() => {
    api.get('/public/medical-guidelines').then(res => {
      if (res.data.success) setGuidelines(res.data.data);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-space-lg">
      <h1 className="text-3xl font-bold mb-space-md">Medical Guidelines</h1>
      <div className="space-y-space-md">
        {guidelines.map(g => (
          <div key={g.id} className="border p-space-md rounded shadow">
            <h2 className="text-xl font-bold">{g.title} <span className="text-sm bg-gray-200 px-2 rounded">{g.category}</span></h2>
            <div className="mt-2 text-gray-700" dangerouslySetInnerHTML={{ __html: g.content }} />
          </div>
        ))}
        {guidelines.length === 0 && <p>No medical guidelines available.</p>}
      </div>
    </div>
  );
}
