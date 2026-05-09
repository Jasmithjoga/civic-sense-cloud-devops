import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import StatusTimeline from '../components/complaints/StatusTimeline';
import { getIssueIcon, formatDate } from '../utils/helpers';
import EmptyState from '../components/ui/EmptyState';
import { complaintsAPI } from '../services/api';
import { Search, MapPin, Building2, Clock, ChevronRight, Copy, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function TrackComplaintPage() {
    const { id } = useParams();
    const { getComplaintById } = useApp();
    const [query, setQuery] = useState(id || '');
    const [complaint, setComplaint] = useState(id ? getComplaintById(id) : null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(!!id);

    const handleSearch = async (e) => {
        e?.preventDefault();
        if (!query.trim()) { return; }
        setLoading(true);
        setSearched(true);
        await new Promise((r) => setTimeout(r, 800));
        const result = getComplaintById(query.trim().toUpperCase());
        setComplaint(result);
        setLoading(false);
        if (!result) toast.error('Complaint not found. Check the ID and try again.');
    };

    useEffect(() => {
        if (id) {
            setQuery(id);
            setComplaint(getComplaintById(id));
            setSearched(true);
        }
    }, [id, getComplaintById]);

    const copyId = () => {
        navigator.clipboard.writeText(complaint.id);
        toast.success('Complaint ID copied!');
    };

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 page-enter">
            <div className="mb-6">
                <h1 className="section-title">Track Your Complaint</h1>
                <p className="section-subtitle">Enter your complaint ID to view status and details</p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="card mb-6">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Complaint ID
                </label>
                <div className="flex gap-2">
                    <input
                        className="input-field font-mono"
                        placeholder="e.g. CIV-2026-0001"
                        value={query}
                        onChange={(e) => setQuery(e.target.value.toUpperCase())}
                    />
                    <button type="submit" className="btn-primary flex-shrink-0" disabled={loading}>
                        <Search size={16} />
                        {loading ? 'Searching...' : 'Track'}
                    </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs text-slate-400">Try:</span>
                    {['CIV-2026-0001', 'CIV-2026-0002', 'CIV-2026-0005'].map((id) => (
                        <button key={id} type="button"
                            onClick={() => { setQuery(id); }}
                            className="text-xs text-civic-600 dark:text-civic-400 hover:underline font-mono">
                            {id}
                        </button>
                    ))}
                </div>
            </form>

            {/* Loading skeleton */}
            {loading && (
                <div className="card animate-pulse space-y-4">
                    <div className="flex gap-3">
                        <div className="skeleton w-12 h-12 rounded-xl" />
                        <div className="flex-1 space-y-2"><div className="skeleton h-5 w-1/2" /><div className="skeleton h-4 w-1/3" /></div>
                    </div>
                    <div className="skeleton h-4 w-full" />
                    <div className="skeleton h-4 w-3/4" />
                </div>
            )}

            {/* Not found */}
            {searched && !loading && !complaint && (
                <EmptyState icon={Search} title="Complaint Not Found"
                    description="No complaint found with that ID. Check for typos or use one of the sample IDs above."
                    action={<Link to="/report" className="btn-primary">Report a New Issue</Link>}
                />
            )}

            {/* Complaint Details */}
            {complaint && !loading && (
                <div className="space-y-4 animate-fade-in">
                    {/* Header Card */}
                    <div className="card">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-civic-50 dark:bg-civic-900/30 flex items-center justify-center text-3xl">
                                    {getIssueIcon(complaint.type)}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{complaint.type}</h2>
                                    <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                        <MapPin size={13} />{complaint.area}, {complaint.city}
                                    </div>
                                </div>
                            </div>
                            <button onClick={copyId} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-mono hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                <Copy size={12} /> {complaint.id}
                            </button>
                        </div>

                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {complaint.description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <StatusBadge status={complaint.status} />
                            <PriorityBadge priority={complaint.priority} />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                                <p className="text-xs text-slate-400 mb-1">Reported On</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(complaint.createdAt)}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                                <p className="text-xs text-slate-400 mb-1">Report Count</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">📈 {complaint.reportCount || 1} / 3 reports</p>
                            </div>
                            {complaint.department && (
                                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 col-span-2">
                                    <p className="text-xs text-blue-400 mb-1 flex items-center gap-1"><Building2 size={11} /> Assigned Department</p>
                                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{complaint.department}</p>
                                </div>
                            )}
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 col-span-2">
                                <p className="text-xs text-slate-400 mb-1">Community Upvotes</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">👍 {complaint.upvotes || 0} residents confirmed</p>
                            </div>
                        </div>

                        {/* Escalate Action */}
                        {complaint.reportCount >= 3 && !complaint.escalated && (
                            <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <p className="text-sm font-bold text-red-700 dark:text-red-400">Issue persistent even after 3 reports?</p>
                                <p className="text-xs text-red-600 dark:text-red-500 mt-1 mb-3">You can now escalate this directly to senior authorities.</p>
                                <button
                                    onClick={async () => {
                                        try {
                                            const data = await complaintsAPI.escalate(complaint._id);
                                            toast.success('🚀 Complaint Escalated!');
                                            // Reload complaint data
                                            const updated = { ...complaint, ...data.complaint, id: data.complaint.complaintId };
                                            setComplaint(updated);
                                        } catch (err) {
                                            toast.error(err.message);
                                        }
                                    }}
                                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <AlertTriangle size={16} /> Escalate to Authority
                                </button>
                            </div>
                        )}

                        {complaint.photo && (
                            <div className="mt-4">
                                <p className="text-xs text-slate-400 mb-2">Attached Photo</p>
                                <img src={complaint.photo} alt="Issue" className="w-full max-h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                            </div>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="card">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Clock size={17} className="text-civic-500" /> Resolution Timeline
                        </h3>
                        <StatusTimeline timeline={complaint.timeline} />
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-2">
                        <Link to={`/map`} className="btn-secondary flex-1 justify-center">
                            <MapPin size={15} /> View on Map
                        </Link>
                        <Link to="/report" className="btn-primary flex-1 justify-center">
                            Report Another <ChevronRight size={15} />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
