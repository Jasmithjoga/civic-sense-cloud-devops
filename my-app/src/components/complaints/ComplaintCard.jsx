import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from '../ui/Badge';
import { getIssueIcon, formatDateShort } from '../../utils/helpers';
import { MapPin, ThumbsUp, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';

export default function ComplaintCard({ complaint, compact = false }) {
    const { upvoteComplaint, role } = useApp();

    const handleUpvote = (e) => {
        e.preventDefault();
        upvoteComplaint(complaint.id);
    };

    return (
        <Link
            to={`/track/${complaint.id}`}
            className="block card-hover group"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-civic-50 dark:bg-civic-900/30 flex items-center justify-center text-xl flex-shrink-0">
                        {getIssueIcon(complaint.type)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm">{complaint.type}</span>
                            <code className="text-xs text-civic-600 dark:text-civic-400 bg-civic-50 dark:bg-civic-900/30 px-1.5 py-0.5 rounded-md font-mono">
                                {complaint.id}
                            </code>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            <MapPin size={10} />
                            <span>{complaint.area}, {complaint.city}</span>
                        </div>
                    </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-civic-400 transition-colors flex-shrink-0 mt-1" />
            </div>

            {!compact && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {complaint.description}
                </p>
            )}

            <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={complaint.status} />
                    <PriorityBadge priority={complaint.priority} />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleUpvote}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-civic-600 dark:hover:text-civic-400 transition-colors"
                    >
                        <ThumbsUp size={12} />
                        <span>{complaint.upvotes || 0}</span>
                    </button>
                    <span className="text-xs text-slate-400">
                        {formatDateShort(complaint.createdAt)}
                    </span>
                </div>
            </div>
        </Link>
    );
}
