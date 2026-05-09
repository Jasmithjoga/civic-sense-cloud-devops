const Complaint = require('../models/Complaint');
const { sendResolutionEmail } = require('../utils/emailService');

const STATUSES = ['Submitted', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Escalated'];

// ─── GET /api/admin/complaints ────────────────────────────────────────────────
exports.getAllComplaints = async (req, res, next) => {
    try {
        const { status, priority, search, sort = '-createdAt', page = 1, limit = 100 } = req.query;

        const filter = {};
        if (status && status !== 'All') filter.status = status;
        if (priority && priority !== 'All') filter.priority = priority;
        if (search) {
            filter.$or = [
                { complaintId: { $regex: search, $options: 'i' } },
                { issueType: { $regex: search, $options: 'i' } },
                { area: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Complaint.countDocuments(filter);
        const complaints = await Complaint.find(filter)
            .sort(sort)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .populate('reportedBy', 'name email');

        // Summary stats
        const stats = await Complaint.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const statsMap = {};
        stats.forEach(({ _id, count }) => { statsMap[_id] = count; });

        res.json({
            success: true,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            stats: {
                total,
                pending: (statsMap['Submitted'] || 0) + (statsMap['Pending'] || 0),
                assigned: statsMap['Assigned'] || 0,
                inProgress: statsMap['In Progress'] || 0,
                resolved: statsMap['Resolved'] || 0,
                escalated: statsMap['Escalated'] || 0,
                highPriority: await Complaint.countDocuments({ priority: 'High' }),
            },
            complaints,
        });
    } catch (error) {
        next(error);
    }
};

// ─── PATCH /api/admin/complaints/:id/status ───────────────────────────────────
exports.updateStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: `Status must be one of: ${STATUSES.join(', ')}` });
        }

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        // Build updated timeline
        const statusIdx = STATUSES.indexOf(status);
        const updatedTimeline = STATUSES.map((step, i) => ({
            step,
            date: i <= statusIdx ? (complaint.timeline[i]?.date || new Date()) : null,
            done: i <= statusIdx,
        }));

        complaint.status = status;
        complaint.timeline = updatedTimeline;

        // Trigger email if Resolved and not already notified
        let emailSent = false;
        if (status === 'Resolved' && complaint.reporterEmail && !complaint.emailNotified) {
            emailSent = await sendResolutionEmail({
                to: complaint.reporterEmail,
                complaintId: complaint.complaintId,
                issueType: complaint.issueType,
                area: complaint.area,
                city: complaint.city,
                department: complaint.assignedDepartment,
            });
            if (emailSent) complaint.emailNotified = true;
        }

        await complaint.save();

        res.json({
            success: true,
            message: `Status updated to "${status}"${emailSent ? ' — Resolution email sent to citizen' : ''}`,
            complaint,
            emailSent,
        });
    } catch (error) {
        next(error);
    }
};

// ─── PATCH /api/admin/complaints/:id/assign ───────────────────────────────────
exports.assignDepartment = async (req, res, next) => {
    try {
        const { department } = req.body;
        if (!department) {
            return res.status(400).json({ success: false, message: 'Department is required' });
        }

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            {
                assignedDepartment: department,
                status: 'Assigned',
                $set: {
                    'timeline.0.done': true,
                    'timeline.0.date': new Date(),
                    'timeline.1.done': true,
                    'timeline.1.date': new Date(),
                },
            },
            { new: true }
        );

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        res.json({
            success: true,
            message: `Assigned to ${department}`,
            complaint,
        });
    } catch (error) {
        next(error);
    }
};
