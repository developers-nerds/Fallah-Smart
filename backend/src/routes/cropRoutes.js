const express = require("express");
const router = express.Router();
const cropListingController = require("../controllers/cropListing");
const auth = require("../middleware/auth");
const supplierMiddleware = require("../middleware/supplierMiddleware");
const upload = require("../middleware/upload");
const { CropListings, Media } = require("../database/assossiation");

// Public routes - accessible to everyone
router.get("/listings", cropListingController.getAllCropListings);
router.get("/listings/:id", cropListingController.getCropListingById);
router.get(
  "/supplier/:supplierId/listings",
  cropListingController.getSupplierCropListings
);

// Add route for getting all products of a specific supplier (for profile view)
router.get("/supplier/:supplierId", cropListingController.getSupplierProducts);

// Protected routes - only for authenticated suppliers
router.post(
  "/listings",
  auth,
  supplierMiddleware.isSupplier,
  upload.array("images", 5), // Allow up to 5 images
  cropListingController.createCropListing
);

router.put(
  "/listings/:id",
  auth,
  supplierMiddleware.isSupplier,
  cropListingController.updateCropListing
);

router.delete(
  "/listings/:id",
  auth,
  supplierMiddleware.isSupplier,
  cropListingController.deleteCropListing
);

module.exports = router;
