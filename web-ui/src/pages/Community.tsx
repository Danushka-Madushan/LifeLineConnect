import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
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

interface ThreadReply {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

const Community = () => {
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [qas, setQas] = useState<CommunityQa[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '', tags: 'General' });
  const [newQuestion, setNewQuestion] = useState({ question: '', category: 'General' });
  const [posting, setPosting] = useState(false);

  // Thread detail / replies
  const [selectedThread, setSelectedThread] = useState<CommunityThread | null>(null);
  const [replies, setReplies] = useState<ThreadReply[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [postingReply, setPostingReply] = useState(false);

  // Q&A answer
  const [answeringQaId, setAnsweringQaId] = useState<string | null>(null);
  const [answerContent, setAnswerContent] = useState('');

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

  async function handlePostThread(e: React.FormEvent) {
    e.preventDefault();
    if (!newThread.title.trim() || !newThread.content.trim()) return;
    setPosting(true);
    try {
      await api.post('/donors/me/community/threads', {
        title: newThread.title,
        content: newThread.content,
        tags: [newThread.tags]
      });
      toast.success('Discussion posted!');
      setShowThreadModal(false);
      setNewThread({ title: '', content: '', tags: 'General' });
      fetchThreads();
    } catch (err) {
      toast.error((err as import("axios").AxiosError<{message: string}>).response?.data?.message || 'Please log in as a Donor to post.');
    } finally {
      setPosting(false);
    }
  }

  async function handlePostQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestion.question.trim()) return;
    setPosting(true);
    try {
      await api.post('/donors/me/community/qa', {
        question: newQuestion.question,
        answer: 'Pending answer from community...',
        category: newQuestion.category
      });
      toast.success('Question submitted!');
      setShowQuestionModal(false);
      setNewQuestion({ question: '', category: 'General' });
      const res = await api.get('/public/community/qa');
      if (res.data.success) setQas(res.data.data);
    } catch (err) {
      toast.error((err as import("axios").AxiosError<{message: string}>).response?.data?.message || 'Please log in as a Donor to ask.');
    } finally {
      setPosting(false);
    }
  }

  async function openThread(thread: CommunityThread) {
    setSelectedThread(thread);
    setReplies([]);
    setReplyContent('');
    setLoadingReplies(true);
    try {
      const res = await api.get(`/public/community/threads/${thread.id}/replies`);
      if (res.data.success) setReplies(res.data.data);
    } catch {
      // No replies yet
    } finally {
      setLoadingReplies(false);
    }
  }

  async function handlePostReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyContent.trim() || !selectedThread) return;
    setPostingReply(true);
    try {
      await api.post(`/donors/me/community/threads/${selectedThread.id}/replies`, {
        content: replyContent
      });
      toast.success('Reply posted!');
      setReplyContent('');
      const res = await api.get(`/public/community/threads/${selectedThread.id}/replies`);
      if (res.data.success) setReplies(res.data.data);
      setSelectedThread(prev => prev ? { ...prev, repliesCount: prev.repliesCount + 1 } : null);
      fetchThreads();
    } catch (err) {
      toast.error((err as import("axios").AxiosError<{message: string}>).response?.data?.message || 'Please log in as a Donor to reply.');
    } finally {
      setPostingReply(false);
    }
  }

  async function handlePostAnswer(qaId: string) {
    if (!answerContent.trim()) return;
    try {
      await api.post(`/donors/me/community/qa/${qaId}/answer`, { answer: answerContent });
      toast.success('Answer submitted!');
      setAnsweringQaId(null);
      setAnswerContent('');
      const res = await api.get('/public/community/qa');
      if (res.data.success) setQas(res.data.data);
    } catch (err) {
      toast.error((err as import("axios").AxiosError<{message: string}>).response?.data?.message || 'Please log in as a Donor to answer.');
    }
  }

  return (
    <div className="w-full max-w-360 mx-auto px-space-4xl py-space-3xl flex flex-col gap-space-3xl">
      <div className="flex flex-col gap-space-sm">
        <h1 className="font-heading text-4xl font-bold text-on-surface">Community & Support</h1>
        <p className="font-body text-lg text-secondary">Join discussions and find answers to common questions about blood donation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-2xl">
        {/* Discussions Section */}
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
                onClick={() => setShowThreadModal(true)}
                className="bg-primary text-on-primary px-3 py-1 rounded text-sm font-bold flex items-center gap-1 hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-[16px]">add</span> Post
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-space-md">
            {threads.length > 0 ? threads.map(thread => (
              <div
                key={thread.id}
                onClick={() => openThread(thread)}
                className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm hover:shadow-md transition-shadow flex flex-col gap-space-sm cursor-pointer"
              >
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

        {/* Q&A Section */}
        <section className="flex flex-col gap-space-lg">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold text-on-surface flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-tertiary">live_help</span>
              Frequently Asked Questions
            </h2>
            <button
              onClick={() => setShowQuestionModal(true)}
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
                    <span className="font-label text-xs text-white bg-primary-container px-2 py-1 rounded">{qa.category}</span>
                    <div className="flex items-center gap-space-md">
                      <span className="font-label text-xs text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">thumb_up</span> {qa.helpfulCount} found this helpful
                      </span>
                      {qa.answer === 'Pending answer from community...' && (
                        <button
                          onClick={(e) => { e.preventDefault(); setAnsweringQaId(qa.id); setAnswerContent(''); }}
                          className="text-xs font-bold text-tertiary hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span> Answer
                        </button>
                      )}
                    </div>
                  </div>
                  {answeringQaId === qa.id && (
                    <div className="mt-space-md flex flex-col gap-space-sm">
                      <textarea
                        value={answerContent}
                        onChange={e => setAnswerContent(e.target.value)}
                        placeholder="Type your answer..."
                        className="w-full px-space-md py-space-sm border border-surface-container-high rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                        rows={3}
                      />
                      <div className="flex gap-space-sm justify-end">
                        <button onClick={() => setAnsweringQaId(null)} className="px-3 py-1 rounded text-sm font-semibold text-on-surface border border-surface-container-high hover:bg-surface-container-low">Cancel</button>
                        <button onClick={() => handlePostAnswer(qa.id)} className="px-3 py-1 rounded text-sm font-bold bg-tertiary text-on-tertiary hover:bg-tertiary/90">Submit Answer</button>
                      </div>
                    </div>
                  )}
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

      {/* Thread Detail / Replies Modal */}
      {selectedThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-space-lg" onClick={() => setSelectedThread(null)}>
          <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[85vh] rounded-xl border border-outline shadow-[0_20px_25px_-5px_rgba(15,23,42,0.08),0_8px_10px_-6px_rgba(15,23,42,0.04)] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-space-xl border-b border-surface-container-high flex items-start justify-between gap-space-md">
              <div className="flex flex-col gap-space-xs flex-1">
                <h2 className="font-heading text-xl font-bold text-on-surface">{selectedThread.title}</h2>
                <div className="flex items-center gap-space-sm text-xs text-secondary">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">person</span> {selectedThread.authorName}</span>
                  <span>•</span>
                  <span>{new Date(selectedThread.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{selectedThread.repliesCount} replies</span>
                </div>
              </div>
              <button onClick={() => setSelectedThread(null)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-space-xl border-b border-surface-container-high">
              <p className="font-body text-sm text-on-surface leading-relaxed">{selectedThread.content}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-space-xl flex flex-col gap-space-md">
              <h3 className="font-heading text-sm font-bold text-secondary uppercase tracking-wider">Replies</h3>
              {loadingReplies ? (
                <div className="text-center py-space-lg text-secondary">
                  <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                </div>
              ) : replies.length > 0 ? replies.map(reply => (
                <div key={reply.id} className="p-space-md rounded-lg bg-surface-container-low border border-surface-container">
                  <p className="font-body text-sm text-on-surface">{reply.content}</p>
                  <div className="flex items-center gap-space-sm mt-space-sm text-xs text-secondary">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">person</span> {reply.authorName}</span>
                    <span>•</span>
                    <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-secondary italic">No replies yet. Be the first to respond!</p>
              )}
            </div>
            <form onSubmit={handlePostReply} className="p-space-xl border-t border-surface-container-high flex gap-space-sm">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                className="flex-1 px-space-md py-space-sm border border-surface-container-high rounded-lg text-sm bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={postingReply || !replyContent.trim()}
                className="px-space-lg py-space-sm bg-primary text-on-primary rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-60 flex items-center gap-1"
              >
                {postingReply ? <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> : <><span className="material-symbols-outlined text-[16px]">send</span> Reply</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Thread Modal */}
      {showThreadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-space-lg" onClick={() => setShowThreadModal(false)}>
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-xl border border-outline shadow-[0_20px_25px_-5px_rgba(15,23,42,0.08),0_8px_10px_-6px_rgba(15,23,42,0.04)] p-space-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-space-xl">
              <h2 className="font-heading text-xl font-bold text-on-surface flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                New Discussion
              </h2>
              <button onClick={() => setShowThreadModal(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handlePostThread} className="flex flex-col gap-space-lg">
              <div className="flex flex-col gap-space-xs">
                <label className="font-label text-sm font-semibold text-on-surface">Title</label>
                <input
                  type="text"
                  value={newThread.title}
                  onChange={e => setNewThread({ ...newThread, title: e.target.value })}
                  placeholder="What would you like to discuss?"
                  required
                  className="px-space-md py-space-sm border border-surface-container-high rounded-lg text-sm bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="font-label text-sm font-semibold text-on-surface">Content</label>
                <textarea
                  value={newThread.content}
                  onChange={e => setNewThread({ ...newThread, content: e.target.value })}
                  placeholder="Share your thoughts, experiences, or questions..."
                  required
                  rows={4}
                  className="px-space-md py-space-sm border border-surface-container-high rounded-lg text-sm bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="font-label text-sm font-semibold text-on-surface">Tag</label>
                <select
                  value={newThread.tags}
                  onChange={e => setNewThread({ ...newThread, tags: e.target.value })}
                  className="px-space-md py-space-sm border border-surface-container-high rounded-lg text-sm bg-surface focus:outline-none focus:border-primary"
                >
                  <option value="General">General</option>
                  <option value="Experience">Experience</option>
                  <option value="Medical">Medical</option>
                  <option value="Tips">Tips</option>
                  <option value="First-Time">First-Time Donor</option>
                </select>
              </div>
              <div className="flex gap-space-sm justify-end mt-space-md">
                <button type="button" onClick={() => setShowThreadModal(false)} className="px-space-lg py-space-sm rounded-lg text-sm font-semibold text-on-surface border border-surface-container-high hover:bg-surface-container-low transition-colors">Cancel</button>
                <button type="submit" disabled={posting} className="px-space-lg py-space-sm rounded-lg text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center gap-1">
                  {posting ? <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> : <><span className="material-symbols-outlined text-[16px]">send</span> Post Discussion</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-space-lg" onClick={() => setShowQuestionModal(false)}>
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-xl border border-outline shadow-[0_20px_25px_-5px_rgba(15,23,42,0.08),0_8px_10px_-6px_rgba(15,23,42,0.04)] p-space-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-space-xl">
              <h2 className="font-heading text-xl font-bold text-on-surface flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-tertiary">help</span>
                Ask a Question
              </h2>
              <button onClick={() => setShowQuestionModal(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handlePostQuestion} className="flex flex-col gap-space-lg">
              <div className="flex flex-col gap-space-xs">
                <label className="font-label text-sm font-semibold text-on-surface">Your Question</label>
                <textarea
                  value={newQuestion.question}
                  onChange={e => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  placeholder="What would you like to know about blood donation?"
                  required
                  rows={3}
                  className="px-space-md py-space-sm border border-surface-container-high rounded-lg text-sm bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="font-label text-sm font-semibold text-on-surface">Category</label>
                <select
                  value={newQuestion.category}
                  onChange={e => setNewQuestion({ ...newQuestion, category: e.target.value })}
                  className="px-space-md py-space-sm border border-surface-container-high rounded-lg text-sm bg-surface focus:outline-none focus:border-primary"
                >
                  <option value="General">General</option>
                  <option value="Medical">Medical</option>
                  <option value="Eligibility">Eligibility</option>
                  <option value="Process">Process</option>
                  <option value="Recovery">Recovery</option>
                </select>
              </div>
              <div className="flex gap-space-sm justify-end mt-space-md">
                <button type="button" onClick={() => setShowQuestionModal(false)} className="px-space-lg py-space-sm rounded-lg text-sm font-semibold text-on-surface border border-surface-container-high hover:bg-surface-container-low transition-colors">Cancel</button>
                <button type="submit" disabled={posting} className="px-space-lg py-space-sm rounded-lg text-sm font-bold bg-tertiary text-on-tertiary hover:bg-tertiary/90 disabled:opacity-60 transition-colors flex items-center gap-1">
                  {posting ? <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> : <><span className="material-symbols-outlined text-[16px]">send</span> Submit Question</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
