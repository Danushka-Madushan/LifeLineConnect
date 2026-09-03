import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface CommunityThread {
  id: string;
  title: string;
  content: string;
  authorName: string;
  tags: string[];
  repliesCount: number;
  createdAt: string;
}

interface CommunityQa {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpfulCount: number;
}

const Community = () => {
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [qas, setQas] = useState<CommunityQa[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchThreads = (query = '') => {
    const url = query 
      ? `/public/community/threads/search?query=${encodeURIComponent(query)}` 
      : '/public/community/threads';
      
    api.get(url).then(res => {
      if (res.data.success) setThreads(res.data.data);
    }).catch(console.error);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchThreads(searchQuery);
  };

  useEffect(() => {
    fetchThreads();
    api.get('/public/community/qa').then(res => {
      if (res.data.success) setQas(res.data.data);
    }).catch(console.error);
  }, []);


  return (
    <div className="w-full max-w-360 mx-auto px-space-4xl py-space-3xl flex flex-col gap-space-3xl">
      <div className="flex flex-col gap-space-sm">
        <h1 className="font-heading text-4xl font-bold text-on-surface">Community & Support</h1>
        <p className="font-body text-lg text-secondary">Join discussions and find answers to common questions about blood donation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-2xl">
        {/* Task: HOME-08 & HOME-09 - Community Threads & Search */}
        <section className="flex flex-col gap-space-lg">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold text-on-surface flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary">forum</span>
              Discussions
            </h2>
            <div className="flex items-center gap-space-md">
              <form onSubmit={handleSearch} className="flex items-center gap-space-sm">
                <input 
                  type="text" 
                  placeholder="Search topics..." 
                  className="px-space-md py-space-xs border border-outline-variant rounded-lg text-sm bg-surface-container-lowest focus:outline-primary w-48"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="px-space-sm py-space-xs bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors flex items-center">
                  <span className="material-symbols-outlined text-[18px]">search</span>
                </button>
              </form>
              <button 
                onClick={() => {
                  const title = prompt("Thread Title:");
                  const content = prompt("Thread Content:");
                  if(title && content) {
                    api.post('/donors/me/community/threads', { title, content, tags: ['General'] })
                      .then(() => fetchThreads())
                      .catch(e => alert(e.response?.data?.message || 'Please log in as a Donor to post.'));
                  }
                }}
                className="bg-primary text-on-primary px-3 py-1 rounded text-sm font-bold flex items-center gap-1 hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-[16px]">add</span> Post
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-space-md">
            {threads.length > 0 ? threads.map(thread => (
              <div key={thread.id} className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm hover:shadow-md transition-shadow flex flex-col gap-space-sm">
                <h3 className="font-heading text-lg font-bold text-on-surface">{thread.title}</h3>
                <p className="font-body text-sm text-secondary line-clamp-2">{thread.content}</p>
                <div className="flex items-center justify-between mt-space-sm pt-space-sm border-t border-surface-container-high">
                  <div className="flex items-center gap-space-sm font-label text-xs text-secondary">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">person</span> {thread.authorName}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">chat_bubble</span> {thread.repliesCount} replies</span>
                  </div>
                  <div className="flex gap-space-xs">
                    {thread.tags.map(tag => (
                      <span key={tag} className="px-space-xs py-0.5 rounded bg-surface-container-low text-primary text-[10px] uppercase font-bold tracking-wider">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-space-xl text-center text-secondary border border-dashed border-outline-variant rounded-xl">
                No discussion threads found.
              </div>
            )}
          </div>
        </section>

        {/* Task: HOME-10 - Q&A / FAQs */}
        <section className="flex flex-col gap-space-lg">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold text-on-surface flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-tertiary">live_help</span>
              Frequently Asked Questions
            </h2>
            <button 
              onClick={() => {
                const question = prompt("Your Question:");
                const category = prompt("Category (e.g., Medical, General):");
                if(question && category) {
                  api.post('/donors/me/community/qa', { question, answer: 'Pending answer from community...', category })
                    .then(() => api.get('/public/community/qa').then(res => setQas(res.data.data)))
                    .catch(e => alert(e.response?.data?.message || 'Please log in as a Donor to ask.'));
                }
              }}
              className="bg-tertiary text-on-tertiary px-3 py-1 rounded text-sm font-bold flex items-center gap-1 hover:bg-tertiary/90"
            >
              <span className="material-symbols-outlined text-[16px]">add</span> Ask
            </button>
          </div>
          <div className="flex flex-col gap-space-sm">
            {qas.length > 0 ? qas.map(qa => (
              <details key={qa.id} className="group p-space-md rounded-xl bg-surface-container-low border border-transparent open:bg-surface-container-lowest open:border-surface-container open:shadow-sm transition-all">
                <summary className="font-heading text-md font-bold text-on-surface cursor-pointer list-none flex items-center justify-between">
                  {qa.question}
                  <span className="material-symbols-outlined text-secondary group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="pt-space-md mt-space-md border-t border-surface-container-high">
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed">{qa.answer}</p>
                  <div className="flex items-center justify-between mt-space-md">
                    <span className="font-label text-xs text-primary bg-primary-container px-2 py-1 rounded">{qa.category}</span>
                    <span className="font-label text-xs text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">thumb_up</span> {qa.helpfulCount} found this helpful
                    </span>
                  </div>
                </div>
              </details>
            )) : (
              <div className="p-space-xl text-center text-secondary border border-dashed border-outline-variant rounded-xl">
                No FAQs available.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Community;
