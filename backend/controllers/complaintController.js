const Complaint = require('../models/Complaint');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const { generateComplaintId, getPriorityFromType, buildTimeline } = require('../utils/generateId');
const { reverseGeocode } = require('../utils/geocode');
const { sendAcknowledgmentEmail } = require('../utils/emailService');

// ─── Helper: Upload buffer to Cloudinary ─────────────────────────────────────
const uploadToCloudinary = (buffer) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'civicsense', resource_type: 'image', quality: 'auto' },
            (err, result) => (err ? reject(err) : resolve(result))
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });

// ─── POST /api/complaints ─────────────────────────────────────────────────────
exports.createComplaint = async (req, res, next) => {
    try {
        const { issueType, description, latitude, longitude, reporterEmail } = req.body;

        if (!issueType || !description || !latitude || !longitude) {
            return res.status(400).json({ success: false, message: 'Issue type, description, and location are required' });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        // ── Duplicate detection (same type within 100m, not yet resolved) ──
        const DUPLICATE_RADIUS_METERS = 100;
        const existing = await Complaint.findOne({
            issueType,
            status: { $ne: 'Resolved' },
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [lng, lat] },
                    $maxDistance: DUPLICATE_RADIUS_METERS,
                },
            },
        });

        if (existing) {
            // Upvote instead of creating new
            existing.upvotes += 1;
            await existing.save();
            return res.status(200).json({
                success: true,
                isDuplicate: true,
                message: 'A similar issue already exists nearby. We have upvoted it for you.',
                complaint: existing,
            });
        }

        // ── Reverse geocode ──
        const { address, area, city } = await reverseGeocode(lng, lat);

        // ── Image upload ──
        let imageUrl = null, imagePublicId = null;
        if (req.file) {
            try {
                const result = await uploadToCloudinary(req.file.buffer);
                imageUrl = result.secure_url;
                imagePublicId = result.public_id;
            } catch (imgErr) {
                console.error('Cloudinary upload failed:', imgErr.message);
            }
        }

        // ── Build and save complaint ──
        const complaintId = generateComplaintId();
        const priority = getPriorityFromType(issueType);
        const timeline = buildTimeline('Submitted');

        const complaint = await Complaint.create({
            complaintId,
            issueType,
            description,
            imageUrl,
            imagePublicId,
            location: { type: 'Point', coordinates: [lng, lat] },
            address,
            area: area || 'Unknown Area',
            city: city || 'Mumbai',
            priority,
            status: 'Submitted',
            timeline,
            reporterEmail: reporterEmail || null,
            createdBy: req.user?._id || null,
        });

        // ── Send acknowledgment email (non-blocking) ──
        if (reporterEmail) {
            sendAcknowledgmentEmail({ to: reporterEmail, complaintId, issueType, area, city }).catch(() => { });
        }

        res.status(201).json({
            success: true,
            isDuplicate: false,
            message: 'Complaint submitted successfully',
            complaint,
        });
    } catch (error) {
        next(error);
    }
};

// ─── POST /api/complaints/report ─────────────────────────────────────────────
exports.reportComplaint = async (req, res, next) => {
    try {
        const { title, issueType, description, latitude, longitude, reporterEmail } = req.body;
        const reportedBy = req.user?._id;

        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Title and description are required' });
        }

        const cleanTitle = title.trim();
        const cleanType = issueType.trim();

        // ── Check if same issue has already been reported (by anyone) — Case Insensitive ──
        let complaint = await Complaint.findOne({
            title: { $regex: new RegExp(`^${cleanTitle}$`, 'i') },
            issueType: cleanType
        });

        if (complaint) {
            if (complaint.reportCount >= 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum reporting limit reached for this issue (3 times).',
                });
            }
            complaint.reportCount += 1;

            // Automatic Escalation on 3rd report
            if (complaint.reportCount === 3) {
                complaint.status = 'Escalated';
                complaint.escalated = true;
                if (complaint.timeline) {
                    complaint.timeline.push({
                        step: 'Escalated',
                        date: new Date(),
                        done: true
                    });
                }
            }

            await complaint.save();
            return res.status(200).json({
                success: true,
                message: complaint.reportCount === 3
                    ? 'Issue report count increased and ESCALATED!'
                    : 'Issue report count increased.',
                complaint,
            });
        }

        // ── Create new complaint if none exists ──
        const lat = parseFloat(latitude) || 31.3264;
        const lng = parseFloat(longitude) || 75.5760;
        const { address, area, city } = await reverseGeocode(lng, lat);

        // Image upload
        let imageUrl = null, imagePublicId = null;
        if (req.file) {
            try {
                const result = await uploadToCloudinary(req.file.buffer);
                imageUrl = result.secure_url;
                imagePublicId = result.public_id;
            } catch (imgErr) {
                console.error('Cloudinary upload failed:', imgErr.message);
            }
        }

        const complaintId = generateComplaintId();
        const priority = getPriorityFromType(issueType || 'Other');
        const timeline = buildTimeline('Submitted');

        complaint = await Complaint.create({
            complaintId,
            title,
            issueType: issueType || 'Other',
            description,
            imageUrl,
            imagePublicId,
            location: { type: 'Point', coordinates: [lng, lat] },
            address,
            area: area || 'Unknown Area',
            city,
            priority,
            status: 'Pending',
            timeline,
            reporterEmail: reporterEmail || req.user?.email,
            reportedBy: req.user?._id,
            createdBy: req.user?._id, // Keep both for safety
            reportCount: 1,
        });

        res.status(201).json({
            success: true,
            message: 'Complaint reported successfully',
            complaint,
        });
    } catch (error) {
        next(error);
    }
};

// ─── PUT /api/complaints/escalate/:id ────────────────────────────────────────
exports.escalateComplaint = async (req, res, next) => {
    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        if (complaint.reportCount < 3) {
            return res.status(400).json({
                success: false,
                message: 'Complaint can only be escalated after 3 repeated reports.',
            });
        }

        complaint.status = 'Escalated';
        complaint.escalated = true;

        // Add to timeline
        if (complaint.timeline) {
            complaint.timeline.push({ step: 'Escalated', date: new Date(), done: true });
        }

        await complaint.save();

        res.status(200).json({
            success: true,
            message: 'Complaint escalated successfully',
            complaint,
        });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/complaints/admin/escalated ──────────────────────────────────────
exports.getEscalatedComplaints = async (req, res, next) => {
    try {
        const complaints = await Complaint.find({ escalated: true })
            .populate('reportedBy', 'name email')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: complaints.length,
            complaints,
        });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/complaints/:complaintId ─────────────────────────────────────────
exports.getComplaint = async (req, res, next) => {
    try {
        const complaint = await Complaint.findOne({ complaintId: req.params.complaintId })
            .populate('createdBy', 'name email')
            .populate('reportedBy', 'name email');

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found. Please check the ID and try again.' });
        }

        res.json({ success: true, complaint });
    } catch (error) {
        next(error);
    }
};

// ─── POST /api/complaints/:complaintId/upvote ─────────────────────────────────
exports.upvoteComplaint = async (req, res, next) => {
    try {
        const complaint = await Complaint.findOneAndUpdate(
            { complaintId: req.params.complaintId },
            { $inc: { upvotes: 1 } },
            { new: true }
        );

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        res.json({ success: true, upvotes: complaint.upvotes, message: 'Upvoted successfully' });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/complaints/nearby ───────────────────────────────────────────────
exports.getNearbyComplaints = async (req, res, next) => {
    try {
        const { lat, lng, radius = 500, status } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: 'lat and lng are required' });
        }

        const filter = {
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
                    $maxDistance: parseInt(radius),
                },
            },
        };
        if (status) filter.status = status;

        const complaints = await Complaint.find(filter).limit(20);
        res.json({ success: true, count: complaints.length, complaints });
    } catch (error) {
        next(error);
    }
};

// Legacy createComplaint for safety
exports.createComplaint = exports.reportComplaint;
