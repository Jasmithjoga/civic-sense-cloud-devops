import { ISSUE_TYPES } from '../data/mockData';

export function generateComplaintId() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `CIV-2026-${num}`;
}

export function getPriorityFromType(type) {
    const highPriorityTypes = ['Pothole', 'Drainage', 'Water Leakage'];
    return highPriorityTypes.includes(type) ? 'High' : 'Medium';
}

export function getStatusBadgeClass(status) {
    switch (status) {
        case 'Pending': return 'badge-pending';
        case 'Assigned': return 'badge-assigned';
        case 'In Progress': return 'badge-in-progress';
        case 'Resolved': return 'badge-resolved';
        case 'Escalated': return 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400';
        default: return 'badge-pending';
    }
}

export function getPriorityBadgeClass(priority) {
    switch (priority) {
        case 'High': return 'badge-high';
        case 'Medium': return 'badge-medium';
        case 'Low': return 'badge-low';
        default: return 'badge-medium';
    }
}

export function getStatusColor(status) {
    const s = String(status || '').toLowerCase().trim();
    switch (s) {
        case 'pending':
        case 'submitted': return '#f97316'; // Vivid Orange
        case 'assigned': return '#3b82f6'; // Blue
        case 'in progress': return '#8b5cf6'; // Purple
        case 'resolved': return '#22c55e'; // Green
        case 'escalated': return '#ef4444'; // Red
        default: return '#f97316';
    }
}

export function getIssueIcon(type) {
    const issue = ISSUE_TYPES.find((t) => t.value === type);
    return issue ? issue.icon : '📋';
}

export function checkDuplicate(type, area, allComplaints) {
    const recent = allComplaints.filter(
        (c) =>
            c.type === type &&
            c.area === area &&
            c.status !== 'Resolved' &&
            new Date(c.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    return recent.length > 0 ? recent[0] : null;
}

export function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

export function formatDateShort(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

export function getDefaultTimeline(createdAt) {
    return [
        { step: 'Submitted', date: createdAt, done: true },
        { step: 'Assigned', date: null, done: false },
        { step: 'In Progress', date: null, done: false },
        { step: 'Resolved', date: null, done: false },
    ];
}

export function normalizeComplaint(c) {
    if (!c) return null;
    return {
        ...c,
        id: c.complaintId || c.id,
        title: c.title || c.type,
        type: c.issueType || c.type,
        lat: c.location?.coordinates ? c.location.coordinates[1] : (c.lat || 0),
        lng: c.location?.coordinates ? c.location.coordinates[0] : (c.lng || 0),
        status: (c.status === 'Submitted' || c.status === 'Pending')
            ? (c.escalated ? 'Escalated' : 'Pending')
            : c.status,
        photo: c.imageUrl || c.photo,
        reportCount: c.reportCount || 1,
        escalated: c.escalated || false,
        timeline: c.timeline || getDefaultTimeline(c.createdAt)
    };
}

export function buildComplaint(formData, area, photoPreview) {
    const id = generateComplaintId();
    const priority = getPriorityFromType(formData.type);
    const now = new Date().toISOString();
    return {
        id,
        type: formData.type,
        description: formData.description,
        area: area.name,
        city: area.city,
        priority,
        status: 'Pending',
        department: null,
        upvotes: 1,
        photo: photoPreview || null,
        lat: area.lat,
        lng: area.lng,
        createdAt: now,
        updatedAt: now,
        timeline: getDefaultTimeline(now),
        reportedBy: 'You',
        reporterEmail: formData.email || null,
        emailNotified: false,
    };
}
