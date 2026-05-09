import React from 'react';

export function CardSkeleton() {
    return (
        <div className="card animate-pulse">
            <div className="flex items-start gap-3">
                <div className="skeleton w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                </div>
            </div>
            <div className="mt-4 space-y-2">
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-5/6" />
            </div>
            <div className="mt-3 flex gap-2">
                <div className="skeleton h-6 w-20 rounded-full" />
                <div className="skeleton h-6 w-16 rounded-full" />
            </div>
        </div>
    );
}

export function TableRowSkeleton({ cols = 5 }) {
    return (
        <tr>
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
                </td>
            ))}
        </tr>
    );
}
