import React from 'react';
import { formatDate } from '../../utils/helpers';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

const STEPS = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];
const STEP_DESC = {
    Submitted: 'Complaint registered successfully',
    Assigned: 'Assigned to relevant department',
    'In Progress': 'Field team dispatched',
    Resolved: 'Issue resolved & verified',
};

export default function StatusTimeline({ timeline = [] }) {
    const timelineMap = {};
    timeline.forEach((t) => { timelineMap[t.step] = t; });

    return (
        <div className="relative">
            {STEPS.map((step, idx) => {
                const entry = timelineMap[step] || { step, date: null, done: false };
                const isLast = idx === STEPS.length - 1;

                return (
                    <div key={step} className={`flex gap-4 ${!isLast ? 'pb-6' : ''} relative`}>
                        {/* Vertical line */}
                        {!isLast && (
                            <div className={`absolute left-5 top-8 bottom-0 w-0.5 ${entry.done ? 'bg-civic-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                        )}

                        {/* Icon */}
                        <div className="flex-shrink-0 z-10">
                            {entry.done ? (
                                <div className="w-10 h-10 rounded-full bg-civic-100 dark:bg-civic-900/50 flex items-center justify-center">
                                    <CheckCircle2 size={20} className="text-civic-600 dark:text-civic-400" />
                                </div>
                            ) : idx === timeline.filter((t) => t.done).length ? (
                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-400 flex items-center justify-center">
                                    <Clock size={16} className="text-amber-600 dark:text-amber-400 animate-pulse" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <Circle size={16} className="text-slate-300 dark:text-slate-600" />
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-semibold ${entry.done ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                                    {step}
                                </span>
                                {entry.done && entry.date && (
                                    <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(entry.date)}</span>
                                )}
                                {!entry.done && idx === timeline.filter((t) => t.done).length && (
                                    <span className="badge badge-pending text-xs">Pending</span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{STEP_DESC[step]}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
