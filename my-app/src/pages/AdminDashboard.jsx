import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DEPARTMENTS } from '../data/mockData';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { getIssueIcon, formatDateShort } from '../utils/helpers';
import EmptyState from '../components/ui/EmptyState';
import { Shield, Search, Filter, CheckCircle2, Clock, AlertTriangle, FileText, ChevronUp, ChevronDown, Mail, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { normalizeComplaint } from '../utils/helpers';

const STATUSES = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Escalated'];

export default function AdminDashboard() {
    const { role, complaints, updateComplaint } = useApp();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');
    const [emailModal, setEmailModal] = useState(null); // { email, complaintId, type, area }
    const [liveComplaints, setLiveComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const data = await adminAPI.getAll();
            setLiveComplaints(data.complaints.map(normalizeComplaint));
        } catch (err) {
            console.error('Failed to fetch complaints:', err.message);
            // Fallback to context if API fails
            setLiveComplaints(complaints);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (role === 'admin') fetchComplaints();
    }, [role]);

    if (role !== 'admin') {
        return (
            <div className="max-w-xl mx-auto px-4 py-16 text-center page-enter">
                <div className="card">
                    <Shield size={48} className="text-purple-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Admin Access Required</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                        Please switch to Admin mode using the role switcher in the navbar to access this dashboard.
                    </p>
                    <div className="flex justify-center gap-2">
                        <Link to="/" className="btn-secondary text-sm">Go Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    const total = liveComplaints.length;
    const pending = liveComplaints.filter((c) => c.status?.toLowerCase() === 'pending').length;
    const escalated = liveComplaints.filter((c) => c.status?.toLowerCase() === 'escalated').length;
    const resolved = liveComplaints.filter((c) => c.status?.toLowerCase() === 'resolved').length;

    const handleStatusChange = async (id, newStatus) => {
        const complaint = liveComplaints.find((c) => c.id === id);
        const newTimeline = STATUSES.map((step) => {
            const stepIdx = STATUSES.indexOf(step);
            const newStatusIdx = STATUSES.indexOf(newStatus);
            return {
                step,
                date: stepIdx <= newStatusIdx ? new Date().toISOString() : null,
                done: stepIdx <= newStatusIdx,
            };
        });
        try {
            await adminAPI.updateStatus(complaint._id || id, newStatus);
            toast.success(`Status updated to "${newStatus}"`);
            fetchComplaints(); // Refresh from DB
        } catch (err) {
            toast.error(err.message);
        }

        // Trigger email simulation modal if Resolved and email exists
        if (newStatus === 'Resolved' && complaint?.reporterEmail) {
            setTimeout(() => {
                setEmailModal({
                    email: complaint.reporterEmail,
                    complaintId: id,
                    type: complaint.type,
                    area: complaint.area,
                    city: complaint.city,
                    department: complaint.department,
                });
            }, 600);
        } else if (newStatus === 'Resolved') {
            toast('No email on file for this complaint — notification skipped.', { icon: 'ℹ️' });
        }
    };

    const handleDeptChange = async (id, dept) => {
        const complaint = liveComplaints.find((c) => c.id === id);
        try {
            await adminAPI.assign(complaint._id || id, dept);
            toast.success(`Assigned to ${dept}`);
            fetchComplaints(); // Refresh from DB
        } catch (err) {
            toast.error(err.message);
        }
    };

    const toggleSort = (field) => {
        if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const filtered = liveComplaints
        .filter((c) => {
            const typeStr = c.type ? String(c.type).toLowerCase() : '';
            const areaStr = c.area ? String(c.area).toLowerCase() : '';
            const idStr = c.id ? String(c.id).toLowerCase() : '';
            const searchStr = search.toLowerCase();

            const matchSearch = !search || idStr.includes(searchStr) || typeStr.includes(searchStr) || areaStr.includes(searchStr);
            const matchStatus = statusFilter === 'All' || c.status === statusFilter;
            const matchPriority = priorityFilter === 'All' || c.priority === priorityFilter;
            return matchSearch && matchStatus && matchPriority;
        })
        .sort((a, b) => {
            let valA = a[sortField], valB = b[sortField];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

    const SortIcon = ({ field }) => sortField === field
        ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
        : <ChevronDown size={12} className="opacity-30" />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Shield size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h1 className="section-title">Admin Dashboard</h1>
                    <p className="section-subtitle">Manage complaints, assign departments & update status</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Complaints', value: total, icon: FileText, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
                    { label: 'Pending', value: pending, icon: Clock, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
                    { label: 'Escalated', value: escalated, icon: AlertTriangle, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
                    { label: 'Resolved', value: resolved, icon: CheckCircle2, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="card flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color.split(' ').slice(0, 2).join(' ')}`}>
                            <Icon size={20} className={color.split(' ').slice(2).join(' ')} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card mb-4">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-48">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input className="input-field pl-9" placeholder="Search by ID, type, area..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter size={14} className="text-slate-400" />
                        <select className="input-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="All">All Status</option>
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select className="input-field w-auto" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                            <option value="All">All Priority</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                    <span className="text-xs text-slate-400 ml-auto">{filtered.length} results</span>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 card">
                    <div className="w-10 h-10 border-4 border-civic-200 border-t-civic-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 text-sm">Fetching live reports from city database...</p>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={Search} title="No complaints found" description="Try adjusting the filters or search term." />
            ) : (
                <div className="card p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    {[
                                        { label: 'ID', field: 'id' },
                                        { label: 'Issue Type', field: 'type' },
                                        { label: 'Location', field: 'area' },
                                        { label: 'Priority', field: 'priority' },
                                        { label: 'Status', field: 'status' },
                                        { label: 'Date', field: 'createdAt' },
                                        { label: 'Department', field: null },
                                        { label: 'Actions', field: null },
                                    ].map(({ label, field }) => (
                                        <th key={label}
                                            className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap ${field ? 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none' : ''}`}
                                            onClick={() => field && toggleSort(field)}
                                        >
                                            <div className="flex items-center gap-1">
                                                {label} {field && <SortIcon field={field} />}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filtered.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <code className="text-xs text-civic-600 dark:text-civic-400 bg-civic-50 dark:bg-civic-900/30 px-1.5 py-0.5 rounded font-mono">{c.id}</code>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span>{getIssueIcon(c.type)}</span>
                                                <span className="text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">{c.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{c.area}</td>
                                        <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDateShort(c.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={c.department || ''}
                                                onChange={(e) => e.target.value && handleDeptChange(c.id, e.target.value)}
                                                className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-civic-400"
                                            >
                                                <option value="">Assign Dept...</option>
                                                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={c.status}
                                                onChange={(e) => handleStatusChange(c.id, e.target.value)}
                                                className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-civic-400"
                                            >
                                                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Email Sent Modal */}
            {emailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-bounce-in">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <Mail size={16} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">Email Notification Sent ✓</p>
                                    <p className="text-green-100 text-xs">Simulated — no real email sent</p>
                                </div>
                            </div>
                            <button onClick={() => setEmailModal(null)}
                                className="text-white/70 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Email Preview */}
                        <div className="p-5">
                            {/* Email meta */}
                            <div className="space-y-1.5 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                                {[
                                    { label: 'To', value: emailModal.email },
                                    { label: 'From', value: 'noreply@civicsense.in' },
                                    { label: 'Subject', value: `✅ Your complaint ${emailModal.complaintId} has been Resolved!` },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex gap-2 text-xs">
                                        <span className="w-14 text-slate-400 font-medium flex-shrink-0">{label}:</span>
                                        <span className="text-slate-700 dark:text-slate-300 break-all">{value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Email body preview */}
                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-xs space-y-3">
                                <p className="text-slate-600 dark:text-slate-300">Dear Citizen,</p>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                    We are pleased to inform you that your civic complaint has been <strong className="text-green-600 dark:text-green-400">successfully resolved</strong>.
                                </p>
                                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-600 space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Complaint ID</span>
                                        <code className="text-civic-600 dark:text-civic-400 font-mono font-bold">{emailModal.complaintId}</code>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Issue Type</span>
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">{getIssueIcon(emailModal.type)} {emailModal.type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Location</span>
                                        <span className="text-slate-700 dark:text-slate-300">{emailModal.area}, {emailModal.city}</span>
                                    </div>
                                    {emailModal.department && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Resolved By</span>
                                            <span className="text-slate-700 dark:text-slate-300">{emailModal.department}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Status</span>
                                        <span className="text-green-600 dark:text-green-400 font-bold">✅ Resolved</span>
                                    </div>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400">Thank you for helping improve our city. 🏙️</p>
                                <p className="text-slate-500 dark:text-slate-400">— CivicSense Team, the Municipal Corporation</p>
                            </div>

                            <button
                                onClick={() => { setEmailModal(null); toast.success('📧 Email notification sent!'); }}
                                className="mt-4 w-full btn-primary justify-center py-2">
                                <Send size={14} /> Done — Email Sent
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
