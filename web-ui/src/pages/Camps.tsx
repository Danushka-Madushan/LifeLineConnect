import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface DonationCamp {
  campId: number;
  campTitle: string;
  campDescription: string;
  campDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  status: string;
}

interface TopRatedCampDto {
  camp: DonationCamp;
  averageRating: number;
  reviewCount: number;
}

interface CampFeedback {
  id: string;
  donorId: number;
  rating: number;
  comments: string;
  createdAt: string;
}

const Camps = () => {
  const [camps, setCamps] = useState<DonationCamp[]>([]);
  const [topRated, setTopRated] = useState<TopRatedCampDto[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<number | null>(null);
  const [feedbacks, setFeedbacks] = useState<CampFeedback[]>([]);

  useEffect(() => {
    // HOME-13
    api.get('/public/camps').then(res => {
      if (res.data.success) setCamps(res.data.data);
    }).catch(console.error);

    // HOME-11
    api.get('/public/camps/top-rated').then(res => {
      if (res.data.success) setTopRated(res.data.data);
    }).catch(console.error);
  }, []);

  async function handleViewFeedback(campId: number) {
    if (selectedCampId === campId) {
      setSelectedCampId(null);
      return;
    }
    try {
      const res = await api.get(`/public/camps/${campId}/feedback`);
      if (res.data.success) {
        setFeedbacks(res.data.data);
        setSelectedCampId(campId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-360 mx-auto px-space-4xl py-space-3xl flex flex-col gap-space-4xl">
      <div className="flex flex-col gap-space-sm">
        <h1 className="font-heading text-4xl font-bold text-on-surface">Donation Camps</h1>
        <p className="font-body text-lg text-secondary">Find upcoming blood donation events near you.</p>
      </div>

      {/* Task: HOME-11 - Top-rated camps */}
      {topRated.length > 0 && (
        <section className="flex flex-col gap-space-lg">
          <h2 className="font-heading text-2xl font-bold text-on-surface flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[#F59E0B]">star</span>
            Top Rated Camps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
            {topRated.map(dto => (
              <div key={dto.camp.campId} className="p-space-lg rounded-xl bg-[#FFFBEB] border border-[#FDE68A] shadow-sm flex flex-col gap-space-md">
                <div className="flex justify-between items-start">
                  <h3 className="font-heading text-xl font-bold text-[#92400E]">{dto.camp.campTitle}</h3>
                  <div className="flex items-center gap-1 bg-[#FEF3C7] px-2 py-1 rounded font-bold text-[#B45309] text-sm">
                    {dto.averageRating.toFixed(1)} <span className="material-symbols-outlined text-[14px]">star</span>
                  </div>
                </div>
                <p className="font-body text-sm text-[#92400E] line-clamp-2">{dto.camp.campDescription}</p>
                <div className="mt-auto pt-space-sm flex justify-between items-center text-sm font-label text-[#B45309]">
                  <span>{new Date(dto.camp.campDate).toLocaleDateString()}</span>
                  <span>{dto.reviewCount} reviews</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Task: HOME-13 - Public Camp Catalogue */}
      <section className="flex flex-col gap-space-lg">
        <h2 className="font-heading text-2xl font-bold text-on-surface flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-primary">event</span>
          All Upcoming Camps
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-space-xl">
          {camps.map(camp => (
            <div key={camp.campId} className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container hover:shadow-md transition-shadow flex flex-col gap-space-md">
              <h3 className="font-heading text-xl font-bold text-on-surface">{camp.campTitle}</h3>
              <p className="font-body text-sm text-secondary line-clamp-2">{camp.campDescription}</p>
              
              <div className="flex flex-col gap-space-xs font-body text-sm text-on-surface-variant">
                <div className="flex items-center gap-space-sm"><span className="material-symbols-outlined text-[16px]">calendar_today</span> {new Date(camp.campDate).toLocaleDateString()}</div>
                <div className="flex items-center gap-space-sm"><span className="material-symbols-outlined text-[16px]">schedule</span> {new Date(camp.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(camp.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <div className="flex items-center gap-space-sm"><span className="material-symbols-outlined text-[16px]">groups</span> Capacity: {camp.capacity}</div>
              </div>

              {/* Task: HOME-12 - View all feedback */}
              <div className="mt-auto pt-space-md border-t border-surface-container-high flex flex-col gap-space-md">
                <button 
                  onClick={() => handleViewFeedback(camp.campId)}
                  className="text-sm font-label text-primary font-semibold text-left flex items-center gap-1 hover:underline"
                >
                  {selectedCampId === camp.campId ? 'Hide Feedback' : 'View Feedback'}
                </button>

                {selectedCampId === camp.campId && (
                  <div className="flex flex-col gap-space-sm bg-surface-container-low p-space-md rounded-lg max-h-48 overflow-y-auto">
                    {feedbacks.length > 0 ? feedbacks.map(fb => (
                      <div key={fb.id} className="flex flex-col gap-1 border-b border-surface-container pb-space-sm last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-label text-secondary">Donor #{fb.donorId}</span>
                          <div className="flex text-[#F59E0B]">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="material-symbols-outlined text-[12px]">
                                {i < fb.rating ? 'star' : 'star_border'}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-on-surface italic">"{fb.comments}"</p>
                      </div>
                    )) : (
                      <p className="text-sm text-secondary">No feedback available.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Camps;
