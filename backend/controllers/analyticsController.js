const Complaint = require('../models/Complaint');

// ─── GET /api/analytics/issues-by-type ───────────────────────────────────────
exports.issuesByType = async (req, res, next) => {
    try {
        const data = await Complaint.aggregate([
            { $group: { _id: '$issueType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { _id: 0, type: '$_id', count: 1 } },
        ]);

        // Assign colors per type
        const colorMap = {
            Pothole: '#ef4444',
            Garbage: '#f97316',
            Drainage: '#3b82f6',
            Streetlight: '#eab308',
            'Water Leakage': '#06b6d4',
            'Tree Fall': '#22c55e',
            'Illegal Parking': '#8b5cf6',
            Other: '#94a3b8',
        };

        const result = data.map((d) => ({ ...d, color: colorMap[d.type] || '#94a3b8' }));
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/analytics/status-breakdown ─────────────────────────────────────
exports.statusBreakdown = async (req, res, next) => {
    try {
        const data = await Complaint.aggregate([
            { $group: { _id: '$status', value: { $sum: 1 } } },
            { $project: { _id: 0, name: '$_id', value: 1 } },
        ]);

        const colorMap = {
            Resolved: '#22c55e',
            'In Progress': '#8b5cf6',
            Assigned: '#3b82f6',
            Submitted: '#f59e0b',
        };

        const result = data.map((d) => ({ ...d, color: colorMap[d.name] || '#94a3b8' }));
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/analytics/hotspots ─────────────────────────────────────────────
exports.hotspots = async (req, res, next) => {
    try {
        const data = await Complaint.aggregate([
            {
                $group: {
                    _id: '$area',
                    complaints: { $sum: 1 },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $ne: ['$status', 'Resolved'] }, 1, 0] } },
                },
            },
            { $sort: { complaints: -1 } },
            { $limit: 10 },
            { $project: { _id: 0, area: '$_id', complaints: 1, resolved: 1, pending: 1 } },
        ]);

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/analytics/monthly ─────────────────────────────────────────────
exports.monthly = async (req, res, next) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const data = await Complaint.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    complaints: { $sum: 1 },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const result = data.map((d) => ({
            month: monthNames[d._id.month - 1],
            complaints: d.complaints,
            resolved: d.resolved,
        }));

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/analytics/summary ──────────────────────────────────────────────
exports.summary = async (req, res, next) => {
    try {
        const [total, resolved, highPriority, areas] = await Promise.all([
            Complaint.countDocuments(),
            Complaint.countDocuments({ status: 'Resolved' }),
            Complaint.countDocuments({ priority: 'High' }),
            Complaint.distinct('area'),
        ]);

        const avgResolution = await Complaint.aggregate([
            { $match: { status: 'Resolved' } },
            {
                $project: {
                    days: {
                        $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60 * 24],
                    },
                },
            },
            { $group: { _id: null, avg: { $avg: '$days' } } },
        ]);

        res.json({
            success: true,
            data: {
                totalComplaints: total,
                resolvedIssues: resolved,
                avgResolutionDays: avgResolution[0]?.avg?.toFixed(1) || 0,
                areasCovered: areas.length,
                highPriority,
                resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0,
            },
        });
    } catch (error) {
        next(error);
    }
};
