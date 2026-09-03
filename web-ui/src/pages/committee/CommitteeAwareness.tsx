import { useState } from 'react';
import { api } from '../../lib/api';

export default function CommitteeAwareness() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [campId, setCampId] = useState('');
  const [status, setStatus] = useState('');

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/committee/awareness', {
        title,
        content,
        campId: campId ? parseInt(campId) : null,
        published: true
      });
      if (res.data.success) {
        setStatus('Material published successfully.');
        setTitle('');
        setContent('');
        setCampId('');
      }
    } catch (err) {
      setStatus('Failed to publish material.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-space-lg">
      <h1 className="text-2xl font-bold mb-space-md">Publish Awareness Material</h1>
      
      {status && <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">{status}</div>}

      <form onSubmit={handlePost} className="space-y-4 bg-white p-space-lg rounded shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Content (Markdown/HTML supported)</label>
          <textarea required value={content} onChange={e => setContent(e.target.value)} rows={5} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Target Camp ID (Optional)</label>
          <input type="number" value={campId} onChange={e => setCampId(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Publish Material</button>
      </form>
    </div>
  );
}
