import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const DonorDonations = () => {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const res = await api.get('/donors/me/donations');
        if (res.data.success) {
          setDonations(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, []);

  const handleDownloadPdf = async () => {
    try {
      const res = await api.get('/donors/me/donations/report', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Donation_History.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download report', err);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-space-2xl py-space-xl">
      <div className="flex justify-between items-center border-b border-surface-container pb-space-md mb-space-xl">
        <h1 className="font-heading text-3xl font-bold text-on-surface">Donation History</h1>
        <button onClick={handleDownloadPdf} className="flex items-center gap-space-sm bg-surface-container-high text-on-surface px-space-md py-space-sm rounded-lg hover:bg-surface-container-highest transition-colors font-semibold">
          <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
          Download Report
        </button>
      </div>

      {loading ? (
        <div className="text-center p-space-2xl"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>
      ) : donations.length === 0 ? (
        <div className="text-center p-space-2xl text-secondary bg-surface-container-lowest rounded-xl border border-surface-container">
          You haven't completed any donations yet.
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low text-secondary text-sm font-label uppercase">
              <tr>
                <th className="p-space-md font-semibold border-b border-surface-container">Date</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Camp</th>
                <th className="p-space-md font-semibold border-b border-surface-container hidden md:table-cell">Venue</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Blood Group</th>
                <th className="p-space-md font-semibold border-b border-surface-container">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {donations.map((d) => (
                <tr key={d.donationId} className="border-b border-surface-container last:border-0 hover:bg-surface/50">
                  <td className="p-space-md text-on-surface font-semibold">{new Date(d.donationDate).toLocaleDateString()}</td>
                  <td className="p-space-md text-on-surface">{d.campTitle}</td>
                  <td className="p-space-md text-secondary hidden md:table-cell">{d.venueName}</td>
                  <td className="p-space-md font-bold text-primary">{d.bloodGroup}</td>
                  <td className="p-space-md">
                    <span className="px-space-sm py-[2px] rounded-full text-xs font-bold bg-[#059669]/10 text-[#059669]">
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DonorDonations;
