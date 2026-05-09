function generateComplaintId() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `CIV-2026-${num}`;
}

function getPriorityFromType(type) {
    const highPriorityTypes = ['Pothole', 'Drainage', 'Water Leakage'];
    return highPriorityTypes.includes(type) ? 'High' : 'Medium';
}

function buildTimeline(step) {
    return [
        { step: 'Submitted', date: new Date(), done: true },
        { step: 'Assigned', date: null, done: false },
        { step: 'In Progress', date: null, done: false },
        { step: 'Resolved', date: null, done: false },
    ];
}

module.exports = { generateComplaintId, getPriorityFromType, buildTimeline };
