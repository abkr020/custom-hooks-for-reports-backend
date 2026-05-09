import { Mail } from "../models/Mail.model.js";
// import { InboundMail } from "../models/inboundMail.schema.js";
import InboundMail from "../models/inboundMail.schema.js";
export const getMyMails = async (req, res) => {
  try {
    // const userEmail = req.user.email; // 🔥 from verified JWT
    const userEmail = req.user_from_cookies.email; // 🔥 from verified JWT


    const mails = await Mail.find({ to: userEmail })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      count: mails.length,
      mails,
    });
  } catch (error) {
    console.error("Get mails error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyMails_fromInboundMailSchema = async (req, res) => {
  try {
    // ✅ 1. Validate auth
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found in request",
        errorCode: "AUTH_REQUIRED",
      });
    }

    const userEmail = req.user.email;

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "User email missing",
        errorCode: "INVALID_USER_DATA",
      });
    }

    // ✅ 2. Fetch mails
    const mails = await InboundMail.find({
      to: userEmail,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    // ✅ 3. Success response
    return res.status(200).json({
      success: true,
      count: mails.length,
      mails,
    });

  } catch (error) {
    console.error("Get mails error:", error);

    // ✅ 4. Handle known DB errors (optional but good)
    if (error.name === "MongoNetworkError") {
      return res.status(503).json({
        success: false,
        message: "Database unavailable",
        errorCode: "DB_UNAVAILABLE",
      });
    }

    // ✅ 5. Generic fallback
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errorCode: "SERVER_ERROR",
    });
  }
};