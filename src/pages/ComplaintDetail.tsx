import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Bot, Clock, ThumbsUp, ChevronRight, Flame,
  Share2, AlertTriangle, CheckCircle, Star, MessageSquare,
} from 'lucide-react';
import { COMPLAINTS, CORPORATORS, MLAS } from '../data';
import type { IssueType } from '../types';
import SeverityBadge from '../components/SeverityBadge';
import StatusChip from '../components/StatusChip';
import ComplaintCard from '../components/ComplaintCard';

// ── Type badge config ─────────────────────────────────────────────────────────
const typeConfig: Record<IssueType, { label: string; classes: string }> = {
  pothole:      { label: 'Pothole',      classes: 'bg-stone-100 text-stone-700 border-stone-200' },
  streetlight:  { label: 'Streetlight',  classes: 'bg-sky-100 text-sky-700 border-sky-200' },
  garbage:      { label: 'Garbage',      classes: 'bg-lime-100 text-lime-700 border-lime-200' },
  flooding:     { label: 'Flooding',     classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  encroachment: { label: 'Encroachment', classes: 'bg-purple-100 text-purple-700 border-purple-200' },
  sewage:       { label: 'Sewage',       classes: 'bg-teal-100 text-teal-700 border-teal-200' },
  tree:         { label: 'Fallen Tree',  classes: 'bg-green-100 text-green-700 border-green-200' },
  other:        { label: 'Other',        classes: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const ESCALATION_LABELS = [
  'BBMP Officer',
  'Ward Corporator',
  'Zonal Commissioner',
  'MLA',
  'Public Shame Board',
];

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-orange-400 fill-orange-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-gray-600">{rating.toFixed(1)}</span>
    </span>
  );
}

const MOCK_COMMENTS = [
  { id: 1, name: 'Rajan Kumar', avatar: 'https://i.pravatar.cc/40?img=12', time: '2 hours ago', text: 'This has been an issue for weeks. Someone almost fell into this pothole yesterday night.' },
  { id: 2, name: 'Meera Nair', avatar: 'https://i.pravatar.cc/40?img=27', time: '5 hours ago', text: 'I reported this to BBMP helpline 3 times. No response. Good to see it on NammaFix now.' },
  { id: 3, name: 'Suresh B.', avatar: 'https://i.pravatar.cc/40?img=38', time: '1 day ago', text: 'Two wheeler tyres got damaged here. This needs immediate attention from BBMP roads division.' },
];

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const complaint = COMPLAINTS.find(c => c.id === id);

  const [upvotes, setUpvotes] = useState(complaint?.upvotes ?? 0);
  const [upvoted, setUpvoted] = useState(false);
  const [ccedMLA, setCcedMLA] = useState(complaint?.ccedMLA ?? false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [copied, setCopied] = useState(false);

  if (!complaint) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Complaint not found</h1>
        <p className="text-gray-500 mb-6">The complaint ID <code className="bg-gray-100 px-1 rounded">{id}</code> does not exist.</p>
        <button onClick={() => navigate('/dashboard')} className="px-5 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { title, description, type, severity, status, address, wardName,
    filedAt, escalationLevel, corporatorId, mlaId, photoUrl,
    aiClassification, slaHours, hoursElapsed } = complaint;

  const corporator = CORPORATORS.find(c => c.id === corporatorId);
  const mla = MLAS.find(m => m.id === mlaId);
  const similar = COMPLAINTS.filter(c => c.wardId === complaint.wardId && c.id !== complaint.id).slice(0, 2);

  const isOverdue = hoursElapsed > slaHours;
  const isResolved = status === 'resolved';
  const slaProgress = Math.min((hoursElapsed / slaHours) * 100, 100);
  const typeCfg = typeConfig[type];

  const handleUpvote = () => {
    if (!upvoted) {
      setUpvotes(v => v + 1);
      setUpvoted(true);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setComments(prev => [
      { id: prev.length + 10, name: 'You', avatar: 'https://i.pravatar.cc/40?img=5', time: 'Just now', text: comment },
      ...prev,
    ]);
    setComment('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1 text-sm text-gray-500">
        <Link to="/dashboard" className="hover:text-orange-500 transition-colors">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span>{wardName}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-800 font-medium line-clamp-1">{title}</span>
      </nav>

      {/* ── Hero photo ─────────────────────────────────────────────────────── */}
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={title}
          className="w-full max-h-[400px] object-cover rounded-xl border border-gray-200"
          onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/900x400?text=No+Photo'; }}
        />
      ) : (
        <div className="w-full h-[280px] bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-lg">📷 No photo available</span>
        </div>
      )}

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Title + badges */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={severity} />
              <StatusChip status={status} />
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeCfg.classes}`}>
                {typeCfg.label}
              </span>
              {ccedMLA && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-purple-100 text-purple-700 border-purple-200">
                  <Flame className="w-3 h-3" /> CC MLA
                </span>
              )}
            </div>
          </div>

          {/* AI Classification */}
          {aiClassification && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">AI Classification</span>
              </div>
              <p className="text-sm text-gray-700 font-mono">{aiClassification}</p>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span>{address}</span>
          </div>

          {/* SLA Timer */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">SLA Timer</h3>
            </div>
            <div className="flex items-end justify-between mb-2">
              <div>
                <span className="text-3xl font-bold text-gray-900">{hoursElapsed}h</span>
                <span className="text-sm text-gray-400 ml-1">elapsed of {slaHours}h SLA</span>
              </div>
              {isResolved ? (
                <span className="text-green-600 font-semibold text-sm flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Resolved ✅
                </span>
              ) : isOverdue ? (
                <span className="text-red-600 font-bold text-sm animate-pulse">
                  OVERDUE ⏰
                </span>
              ) : (
                <span className="text-green-600 text-sm font-medium">
                  {slaHours - hoursElapsed}h remaining
                </span>
              )}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all ${isOverdue ? 'bg-red-500' : isResolved ? 'bg-green-500' : 'bg-orange-400'}`}
                style={{ width: `${slaProgress}%` }}
              />
            </div>
          </div>

          {/* Escalation Ladder */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-700">Escalation Ladder</h3>
              <span className="ml-auto text-xs text-gray-400">Level {escalationLevel} / 5</span>
            </div>
            <div className="flex flex-col gap-2">
              {ESCALATION_LABELS.map((label, i) => {
                const level = i + 1;
                const isActive = level === escalationLevel;
                const isPast = level < escalationLevel;
                return (
                  <div
                    key={level}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
                      isActive
                        ? 'bg-orange-50 border-orange-300 text-orange-700'
                        : isPast
                        ? 'bg-gray-50 border-gray-200 text-gray-400'
                        : 'bg-white border-gray-100 text-gray-400'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isActive ? 'bg-orange-500 text-white' : isPast ? 'bg-gray-300 text-gray-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {level}
                    </span>
                    <span className={`text-sm font-medium ${isActive ? 'text-orange-700' : isPast ? 'text-gray-500' : 'text-gray-300'}`}>
                      {label}
                    </span>
                    {isActive && <span className="ml-auto text-xs font-semibold text-orange-500">← Current</span>}
                    {isPast && <CheckCircle className="ml-auto w-3.5 h-3.5 text-gray-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upvote section */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <button
              onClick={handleUpvote}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-bold border-2 transition-all ${
                upvoted
                  ? 'bg-orange-50 border-orange-400 text-orange-600 cursor-default'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-orange-50 hover:border-orange-400 hover:text-orange-600'
              }`}
            >
              <ThumbsUp className={`w-6 h-6 ${upvoted ? 'fill-orange-500 text-orange-500' : ''}`} />
              <span>{upvotes}</span>
            </button>
            <p className="text-center text-sm text-gray-500 mt-2">
              {upvoted ? `You and ${upvotes - 1} others upvoted` : `${upvotes} people upvoted this complaint`}
            </p>
          </div>

          {/* CC MLA button */}
          {!ccedMLA ? (
            <button
              onClick={() => setCcedMLA(true)}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Flame className="w-5 h-5" />
              CC Your MLA
            </button>
          ) : (
            <div className="w-full py-3 bg-purple-50 border border-purple-200 text-purple-700 rounded-xl font-semibold flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              MLA has been notified!
            </div>
          )}

          {/* Comments */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">Comments ({comments.length})</h3>
            </div>

            <div className="space-y-4 mb-5">
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800">{c.name}</span>
                      <span className="text-xs text-gray-400">{c.time}</span>
                    </div>
                    <p className="text-sm text-gray-600">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleComment} className="flex gap-2">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add your comment…"
                rows={2}
                className="flex-1 resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold self-end transition-colors"
              >
                Post
              </button>
            </form>
          </div>
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Assigned Corporator */}
          {corporator && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Assigned Corporator</p>
              <div className="flex items-center gap-3 mb-3">
                <img src={corporator.photo} alt={corporator.name} className="w-14 h-14 rounded-full object-cover border border-gray-200" />
                <div>
                  <p className="font-semibold text-gray-900">{corporator.name}</p>
                  <p className="text-xs text-gray-500">Ward {corporator.ward} · {corporator.wardName}</p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                    {corporator.party}
                  </span>
                </div>
              </div>
              <StarRow rating={corporator.rating} />
              <Link
                to={`/corporator/${corporator.id}`}
                className="mt-3 w-full flex items-center justify-center gap-1 text-sm text-orange-600 font-medium hover:underline"
              >
                View Dashboard <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Assigned MLA */}
          {mla && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Assigned MLA</p>
              <div className="flex items-center gap-3 mb-3">
                <img src={mla.photo} alt={mla.name} className="w-14 h-14 rounded-full object-cover border border-gray-200" />
                <div>
                  <p className="font-semibold text-gray-900">{mla.name}</p>
                  <p className="text-xs text-gray-500">{mla.constituency}</p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 font-medium">
                    {mla.party}
                  </span>
                </div>
              </div>
              <StarRow rating={mla.rating} />
            </div>
          )}

          {/* Similar complaints */}
          {similar.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">More in {wardName}</p>
              <div className="space-y-3">
                {similar.map(c => (
                  <ComplaintCard key={c.id} complaint={c} />
                ))}
              </div>
            </div>
          )}

          {/* Filed info */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 space-y-1">
            <p><span className="font-medium text-gray-700">Filed by:</span> {complaint.reporterName}</p>
            <p><span className="font-medium text-gray-700">Filed:</span> {new Date(filedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            <p><span className="font-medium text-gray-700">ID:</span> <code className="text-xs bg-white border border-gray-200 px-1 rounded">{complaint.id}</code></p>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              copied
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'
            }`}
          >
            <Share2 className="w-4 h-4" />
            {copied ? 'Link copied!' : 'Share this complaint'}
          </button>
        </div>
      </div>
    </div>
  );
}
