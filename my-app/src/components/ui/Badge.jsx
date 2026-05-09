import React from 'react';
import { getStatusBadgeClass, getPriorityBadgeClass } from '../../utils/helpers';

export function StatusBadge({ status }) {
    const icons = { Pending: '⏳', Assigned: '📋', 'In Progress': '🔧', Resolved: '✅' };
    return (
        <span className={getStatusBadgeClass(status)}>
            <span>{icons[status] || '⏳'}</span>
            {status}
        </span>
    );
}

export function PriorityBadge({ priority }) {
    const icons = { High: '🔴', Medium: '🟠', Low: '🟢' };
    return (
        <span className={getPriorityBadgeClass(priority)}>
            <span>{icons[priority] || '🟠'}</span>
            {priority} Priority
        </span>
    );
}
