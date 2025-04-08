const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  getSupplierByUserId,
  createSupplier,
  updateVerificationStatus,
} = require("../controllers/SuppliersController");
const { Suppliers } = require("../database/assossiation");
const path = require("path");
const fs = require("fs");

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

// Add this route to get a specific supplier by ID
router.get("/:id", async (req, res) => {
  try {
    const supplierId = req.params.id;

    const supplier = await Suppliers.findByPk(supplierId);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    return res.status(200).json({
      success: true,
      supplier,
    });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add this route to update supplier profile
router.patch(
  "/update",
  auth,
  upload.fields([
    { name: "company_logo", maxCount: 1 },
    { name: "company_banner", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const supplier = await Suppliers.findOne({
        where: { userId: userId },
      });

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
      }

      // Fields that can be updated
      const updatableFields = [
        "company_name",
        "about_us",
        "company_address",
        "company_website",
        "open_time",
        "close_time",
      ];

      // Create update object with only allowed fields
      const updateData = {};
      updatableFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      // Handle file uploads if present
      if (req.files) {
        if (req.files.company_logo) {
          const logoFile = req.files.company_logo[0];
          const logoPath = `/uploads/company/logo_${userId}_${Date.now()}${path.extname(
            logoFile.originalname
          )}`;
          fs.writeFileSync(
            path.join(__dirname, `../../${logoPath}`),
            logoFile.buffer
          );
          updateData.company_logo = logoPath;
        }

        if (req.files.company_banner) {
          const bannerFile = req.files.company_banner[0];
          const bannerPath = `/uploads/company/banner_${userId}_${Date.now()}${path.extname(
            bannerFile.originalname
          )}`;
          fs.writeFileSync(
            path.join(__dirname, `../../${bannerPath}`),
            bannerFile.buffer
          );
          updateData.company_banner = bannerPath;
        }
      }

      // Update supplier
      await supplier.update(updateData);

      return res.status(200).json({
        success: true,
        message: "Supplier profile updated successfully",
        supplier,
      });
    } catch (error) {
      console.error("Error updating supplier profile:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

module.exports = router;
