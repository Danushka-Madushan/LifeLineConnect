import { useState } from 'react';
import { api } from '../../lib/api';

const DonorFeedback = () => {
  const [campId, setCampId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    
    try {
      const res = await api.post(`/donors/me/camps/${campId}/feedback`, { rating, comment });
      if (res.data.success) {
        setMessage('Feedback submitted successfully. Thank you!');
        setCampId('');
        setComment('');
        setRating(5);
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[600px] mx-auto px-space-2xl py-space-xl">
      <h1 className="font-heading text-3xl font-bold text-on-surface border-b border-surface-container pb-space-md mb-space-xl">Submit Feedback</h1>
      
      {message && (
        <div className={`mb-space-lg p-space-md rounded-lg text-sm font-semibold ${message.includes('success') ? 'bg-[#059669]/10 text-[#059669]' : 'bg-error-container text-error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-space-xl rounded-2xl border border-surface-container flex flex-col gap-space-md shadow-sm">
        <p className="text-sm text-secondary mb-space-sm">
          You can only leave feedback for donation camps where you have successfully completed a donation.
        </p>

        <div className="flex flex-col gap-space-xs">
          <label className="font-label text-sm font-semibold">Camp ID</label>
          <input 
            type="number" 
            required 
            value={campId} 
            onChange={e => setCampId(e.target.value)} 
            placeholder="e.g. 1"
            className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface" 
          />
        </div>

        <div className="flex flex-col gap-space-xs">
          <label className="font-label text-sm font-semibold">Rating (1-5)</label>
          <input 
            type="range" 
            min="1" 
            max="5" 
            value={rating} 
            onChange={e => setRating(parseInt(e.target.value))} 
            className="w-full"
          />
          <div className="flex justify-between text-xs text-secondary px-1 font-bold">
            <span>1 (Poor)</span>
            <span>{rating}</span>
            <span>5 (Excellent)</span>
          </div>
        </div>

        <div className="flex flex-col gap-space-xs mt-space-sm">
          <label className="font-label text-sm font-semibold">Comments</label>
          <textarea 
            required 
            value={comment} 
            onChange={e => setComment(e.target.value)} 
            rows={4}
            placeholder="Share your experience..."
            className="px-space-md py-space-sm border border-surface-container-high rounded-lg focus:outline-none focus:border-primary bg-surface resize-y" 
          ></textarea>
        </div>

        <button 
          type="submit" 
          disabled={submitting} 
          className="mt-space-md bg-primary text-on-primary py-space-md rounded-lg font-bold hover:bg-primary-container disabled:opacity-70 flex items-center justify-center"
        >
          {submitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
};

export default DonorFeedback;
