import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const Resources = () => {
  const [activeTab, setActiveTab] = useState<'AWARENESS' | 'MEDIA' | 'GUIDELINES'>('GUIDELINES');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'AWARENESS') endpoint = '/public/awareness-materials';
      else if (activeTab === 'MEDIA') endpoint = '/public/promotional-media';
      else if (activeTab === 'GUIDELINES') endpoint = '/public/medical-guidelines';

      const res = await api.get(endpoint);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-space-2xl py-space-xl">
      <h1 className="font-heading text-3xl font-bold text-on-surface mb-space-xl">Resources & Guidelines</h1>

      <div className="flex gap-space-lg mb-space-xl border-b border-surface-container">
        <button 
          onClick={() => setActiveTab('GUIDELINES')} 
          className={`pb-space-sm font-bold border-b-2 transition-colors ${activeTab === 'GUIDELINES' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'}`}
        >
          Medical Guidelines
        </button>
        <button 
          onClick={() => setActiveTab('AWARENESS')} 
          className={`pb-space-sm font-bold border-b-2 transition-colors ${activeTab === 'AWARENESS' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'}`}
        >
          Awareness Materials
        </button>
        <button 
          onClick={() => setActiveTab('MEDIA')} 
          className={`pb-space-sm font-bold border-b-2 transition-colors ${activeTab === 'MEDIA' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'}`}
        >
          Promotional Media
        </button>
      </div>

      {loading ? (
        <div className="text-center p-space-2xl"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>
      ) : data.length === 0 ? (
        <div className="text-center p-space-2xl text-secondary bg-surface-container-lowest rounded-xl border border-surface-container">
          No resources found for this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
          {data.map((item: any, i: number) => (
            <div key={item.id || i} className="bg-surface-container-lowest border border-surface-container rounded-2xl p-space-lg flex flex-col gap-space-md shadow-sm">
              <h3 className="font-heading text-xl font-bold text-on-surface">{item.title}</h3>
              {item.description && <p className="text-sm text-secondary flex-1">{item.description}</p>}
              {item.content && <p className="text-sm text-on-surface flex-1">{item.content}</p>}
              
              <div className="mt-auto flex flex-col gap-space-xs text-xs">
                {item.targetAudience && <span className="bg-primary/10 text-primary font-bold px-2 py-1 rounded w-fit uppercase">{item.targetAudience}</span>}
                {item.ruleType && <span className="bg-error/10 text-error font-bold px-2 py-1 rounded w-fit uppercase">{item.ruleType}</span>}
                {item.downloadUrl && (
                  <a href={item.downloadUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline flex items-center gap-1 mt-2">
                    <span className="material-symbols-outlined text-[16px]">download</span> Download
                  </a>
                )}
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-32 object-cover rounded-lg mt-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Resources;
