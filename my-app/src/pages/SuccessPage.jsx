import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getIssueIcon } from '../utils/helpers';
import { CheckCircle2, Copy, MapPin, Search, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const CONFETTI_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function SuccessPage() {
    const { id } = useParams();
    const { getComplaintById } = useApp();
    const complaint = getComplaintById(id);

    const copyId = () => {
        navigator.clipboard.writeText(id);
        toast.success('Complaint ID copied!');
    };

    if (!complaint) {
        return (
            <div className="max-w-lg mx-auto px-4 py-16 text-center">
                <p className="text-slate-500">Complaint not found.</p>
                <Link to="/" className="btn-primary mt-4 inline-flex">Go Home</Link>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto px-4 py-12 page-enter">
            {/* Confetti (CSS) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
                {Array.from({ length: 18 }).map((_, i) => (
                    <div
                        key={i}
                        className="confetti-piece"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: '-20px',
                            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                            width: `${6 + Math.random() * 8}px`,
                            height: `${6 + Math.random() * 8}px`,
                            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2.5 + Math.random() * 2}s`,
                        }}
                    />
                ))}
            </div>

            {/* Success Card */}
            <div className="card text-center animate-bounce-in">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={40} className="text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Complaint Submitted! 🎉
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                    Your civic issue has been registered. The concerned department will be notified.
                </p>

                {/* Complaint ID */}
                <div className="p-4 rounded-2xl bg-civic-50 dark:bg-civic-900/30 border border-civic-200 dark:border-civic-700 mb-6">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Your Complaint ID</p>
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl font-black text-civic-700 dark:text-civic-300 font-mono tracking-wide">{id}</span>
                        <button onClick={copyId} className="w-8 h-8 rounded-lg bg-civic-100 dark:bg-civic-800 flex items-center justify-center text-civic-600 dark:text-civic-400 hover:bg-civic-200 transition-colors">
                            <Copy size={14} />
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Save this ID to track your complaint</p>
                </div>

                {/* Issue summary */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-left mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-xl shadow-sm">
                        {getIssueIcon(complaint.type)}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{complaint.type}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            <MapPin size={10} className="inline mr-1" />{complaint.area}, {complaint.city} • {complaint.priority} Priority
                        </p>
                    </div>
                </div>

                {/* What happens next */}
                <div className="text-left mb-6 space-y-2">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">What happens next</p>
                    {[
                        { icon: '📋', text: 'Issue assigned to relevant department within 24 hours' },
                        { icon: '🔧', text: 'Field team dispatched within 48 hours' },
                        { icon: '✅', text: 'Resolution confirmation within 5-7 working days' },
                    ].map(({ icon, text }) => (
                        <div key={text} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{icon}</span><span>{text}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <Link to={`/track/${id}`} className="btn-primary w-full justify-center">
                        <Search size={15} /> Track This Complaint
                    </Link>
                    <div className="flex gap-2">
                        <Link to="/map" className="btn-secondary flex-1 justify-center text-xs">
                            <MapPin size={13} /> Map View
                        </Link>
                        <Link to="/report" className="btn-secondary flex-1 justify-center text-xs">
                            <FileText size={13} /> Report Another
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
