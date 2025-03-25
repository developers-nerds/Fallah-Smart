const express = require("express");
const router = express.Router();
const verificationController = require("../controllers/verificationController");
const authMiddleware = require("../middleware/auth");

// Routes for verification
router.post(
  "/send-code",
  authMiddleware,
  verificationController.sendVerificationCode
);
router.post("/verify-code", authMiddleware, verificationController.verifyCode);

module.exports = router;
