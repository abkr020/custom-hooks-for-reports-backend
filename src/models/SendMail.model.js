// models/SendMail.model.js
import mongoose from "mongoose";

const attachmentMetaSchema = new mongoose.Schema(
    {
        filename: { type: String, required: true },
        mimetype: { type: String },
        size: { type: Number },        // bytes
    },
    { _id: false }
);

const sendMailSchema = new mongoose.Schema(
    {
        senderUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        from: {
            type: String,
            required: true, // user@slvai.tech
        },

        to: {
            type: String,
            required: true,
            index: true,
        },

        subject: {
            type: String,
            default: "(no subject)",
        },

        text: String,
        html: String,

        // ── NEW: metadata of any attached files (binaries are NOT stored) ──
        attachments: {
            type: [attachmentMetaSchema],
            default: [],
        },

        status: {
            type: String,
            enum: ["sent", "failed"],
            default: "sent",
        },

        error: String,
    },
    { timestamps: true }
);

export const SendMail = mongoose.model("SendMail", sendMailSchema);