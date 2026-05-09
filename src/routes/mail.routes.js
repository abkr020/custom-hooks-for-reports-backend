import express from "express";
// import { getMyMails } from "../controllers/mail.controller";
// import { protect } from "../middlewares/auth.middleware";
import { protect } from "../middlewares/auth.middleware.js";
import { getMyMails, getMyMails_fromInboundMailSchema } from "../controllers/mail.controller.js";
import { attachmentsUpload, sendMail } from "../controllers/sendMail.controller.js";
import { getSentMails } from "../controllers/getSentMails.controller.js";

// import { getMyMails } from "../controllers/mail.controller.js";
// import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// router.get("/my", protect, getMyMails);
router.get("/my", protect, getMyMails_fromInboundMailSchema);
router.post("/send", protect,attachmentsUpload, sendMail);
router.get("/sent", protect, getSentMails);


export default router;