// controllers/sendMail.controller.js
import { resend } from "../utils/resend.js";
import { SendMail } from "../models/SendMail.model.js";
import crypto from "crypto";
import multer from "multer";
import fs from "fs";

// ── Multer: store uploads in memory (no temp files on disk) ──
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024,   // 25 MB per file
        files: 10,                      // max 10 attachments
    },
});

/**
 * Multer middleware that accepts multiple files under the field name "attachments".
 * Attach to your router BEFORE the sendMail handler:
 *
 *   router.post("/send", attachmentsUpload, sendMail);
 */
export const attachmentsUpload = upload.array("attachments");

export const sendMail = async (req, res) => {
    const traceId = crypto.randomUUID(); // 🔍 request tracking

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📤 SEND MAIL REQUEST");
    console.log("🆔 Trace ID :", traceId);

    console.log("HEADERS:", req.headers["content-type"]);
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    try {
        // const sender = req.user; // from JWT
        // const sender = req.user_from_cookies; // from JWT
        const sender = req.user; // from JWT
        const { to, subject, text, html } = req.body;

        console.log("👤 Sender :", sender.email);
        console.log("📬 To     :", to);
        console.log("📝 Subject:", subject || "(no subject)");
        console.log("📎 Attachments :", req.files?.length ?? 0);

        const fromEmail = sender.email;

        // ── Build Resend attachments array from multer memory buffers ──
        const resendAttachments = (req.files || []).map((file) => ({
            filename: file.originalname,
            content: file.buffer,          // Buffer — Resend accepts Buffer directly
        }));

        console.log("🚀 Sending email via Resend...");

        // 1️⃣ Send email via Resend
        const response = await resend.emails.send({
            from: fromEmail,
            to: [to],
            subject: subject || "(no subject)",
            text,
            html,
            ...(resendAttachments.length > 0 && { attachments: resendAttachments }),
        });

        console.log("✅ Email SENT");
        console.log("📨 Resend Message ID:", response?.id);

        console.log("💾 Saving mail to DB (Sent folder)...");

        // 2️⃣ Store metadata in DB (we don't store file binaries — just names & sizes)
        const attachmentsMeta = (req.files || []).map((file) => ({
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
        }));

        await SendMail.create({
            senderUser: sender._id,
            from: fromEmail,
            to,
            subject,
            text,
            html,
            attachments: attachmentsMeta,
            status: "sent",
        });

        console.log("📦 Mail saved successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        return res.json({
            success: true,
            messageId: response.id,
            traceId,
        });
    } catch (error) {
        console.error("❌ SEND MAIL FAILED");
        console.error("🆔 Trace ID:", traceId);
        console.error("📛 Error Message:", error.message);

        if (error?.response) {
            console.error("📡 Resend Response:", error.response);
        }

        // Save failed attempt
        try {
            await SendMail.create({
                senderUser: req.user_from_cookies._id,
                from: req.user_from_cookies.email,
                to: req.body?.to,
                subject: req.body?.subject,
                text: req.body?.text,
                html: req.body?.html,
                status: "failed",
                error: error.message,
            });
            console.log("💾 Failed mail saved to DB");
        } catch (dbErr) {
            console.error("❌ DB SAVE FAILED:", dbErr.message);
        }

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        return res.status(500).json({
            message: "Failed to send mail",
            traceId,
        });
    }
};