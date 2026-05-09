const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send resolution notification email to the complaint reporter
 */
const sendResolutionEmail = async ({ to, complaintId, issueType, area, city, department }) => {
    if (!to) return;

    const mailOptions = {
        from: `"CivicSense Mumbai" <${process.env.EMAIL_USER}>`,
        to,
        subject: `✅ Your Complaint ${complaintId} Has Been Resolved!`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 20px; }
                    .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #22c55e, #16a34a); padding: 32px 28px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
                    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
                    .body { padding: 28px; }
                    .body p { color: #475569; line-height: 1.6; margin: 0 0 16px; font-size: 14px; }
                    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
                    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
                    .row:last-child { border-bottom: none; }
                    .label { color: #94a3b8; font-weight: 500; }
                    .value { color: #1e293b; font-weight: 600; text-align: right; }
                    .status { color: #22c55e; font-weight: 700; }
                    .footer { background: #f8fafc; padding: 20px 28px; text-align: center; }
                    .footer p { color: #94a3b8; font-size: 12px; margin: 4px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏙️ Issue Resolved!</h1>
                        <p>Your civic complaint has been successfully addressed</p>
                    </div>
                    <div class="body">
                        <p>Dear Citizen,</p>
                        <p>We are pleased to inform you that your civic complaint has been <strong>successfully resolved</strong> by the concerned department. Thank you for helping make our city better!</p>
                        <div class="card">
                            <div class="row"><span class="label">Complaint ID</span><span class="value" style="font-family:monospace;color:#3b82f6">${complaintId}</span></div>
                            <div class="row"><span class="label">Issue Type</span><span class="value">${issueType}</span></div>
                            <div class="row"><span class="label">Location</span><span class="value">${area ? area + ', ' : ''}${city}</span></div>
                            ${department ? `<div class="row"><span class="label">Resolved By</span><span class="value">${department}</span></div>` : ''}
                            <div class="row"><span class="label">Resolution Date</span><span class="value">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
                            <div class="row"><span class="label">Status</span><span class="value status">✅ Resolved</span></div>
                        </div>
                        <p>If you feel the issue has not been adequately resolved, you can report it again through our platform. Your feedback helps us improve city services.</p>
                        <p>Thank you for being an active citizen of Mumbai! 🇮🇳</p>
                    </div>
                    <div class="footer">
                        <p><strong>CivicSense</strong> — Smart Civic Issue Reporting Platform</p>
                        <p>Municipal Corporation of Mumbai</p>
                        <p style="color:#cbd5e1;margin-top:8px">This is an automated notification. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Resolution email sent to ${to} for complaint ${complaintId}`);
        return true;
    } catch (error) {
        console.error('Email send error:', error.message);
        return false;
    }
};

/**
 * Send acknowledgment email on complaint submission
 */
const sendAcknowledgmentEmail = async ({ to, complaintId, issueType, area, city }) => {
    if (!to) return;

    const mailOptions = {
        from: `"CivicSense Mumbai" <${process.env.EMAIL_USER}>`,
        to,
        subject: `📋 Complaint ${complaintId} Received — CivicSense`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 20px; }
                    .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 32px 28px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
                    .body { padding: 28px; }
                    .body p { color: #475569; line-height: 1.6; font-size: 14px; margin: 0 0 16px; }
                    .id-box { background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
                    .id-box .id { font-size: 24px; font-weight: 800; color: #2563eb; font-family: monospace; letter-spacing: 2px; }
                    .id-box p { color: #64748b; font-size: 12px; margin: 8px 0 0; }
                    .footer { background: #f8fafc; padding: 16px 28px; text-align: center; }
                    .footer p { color: #94a3b8; font-size: 12px; margin: 4px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📋 Complaint Received!</h1>
                    </div>
                    <div class="body">
                        <p>Dear Citizen,</p>
                        <p>Your complaint for <strong>${issueType}</strong> in <strong>${area || city}</strong> has been successfully registered. Our team will review it shortly.</p>
                        <div class="id-box">
                            <div class="id">${complaintId}</div>
                            <p>Save this ID to track your complaint</p>
                        </div>
                        <p>You can track the status of your complaint anytime using the Complaint ID above at our platform.</p>
                    </div>
                    <div class="footer">
                        <p><strong>CivicSense</strong> — Smart Civic Issue Reporting Platform</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Acknowledgment email sent to ${to} for complaint ${complaintId}`);
        return true;
    } catch (error) {
        console.error('Email send error:', error.message);
        return false;
    }
};

module.exports = { sendResolutionEmail, sendAcknowledgmentEmail };
