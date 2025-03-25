const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  getSupplierByUserId,
  createSupplier,
  updateVerificationStatus,
} = require("../controllers/SuppliersController");

// Get supplier data for authenticated user
router.get("/me", auth, getSupplierByUserId);

// Create supplier account with file uploads
router.post(
  "/register",
  auth,
  upload.fields([
    { name: "company_logo", maxCount: 1 },
    { name: "company_banner", maxCount: 1 },
  ]),
  createSupplier
);

// Update supplier verification status
router.patch("/verify", auth, updateVerificationStatus);

module.exports = router;
