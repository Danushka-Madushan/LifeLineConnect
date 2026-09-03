import { useState, useEffect } from 'react';
import { api } from '../lib/api';


export default function Awareness() {
  const [materials, setMaterials] = useState<AwarenessMaterial[]>([]);

  useEffect(() => {
    api.get('/public/camps/awareness-materials').then(res => {
      if (res.data.success) setMaterials(res.data.data);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-space-lg">
      <h1 className="text-3xl font-bold mb-space-md">Camp Awareness Materials</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        {materials.map(m => (
          <div key={m.id} className="border p-space-md rounded shadow">
            <h2 className="text-xl font-bold">{m.title}</h2>
            <p className="text-gray-600 mt-2">{m.content}</p>
          </div>
        ))}
        {materials.length === 0 && <p>No awareness materials available.</p>}
      </div>
    </div>
  );
}
