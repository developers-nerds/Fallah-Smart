const express = require("express");
const router = express.Router();
const cropListingController = require("../controllers/cropListing");
const auth = require("../middleware/auth");
const supplierMiddleware = require("../middleware/supplierMiddleware");

// Public routes - accessible to everyone
router.get("/listings", cropListingController.getAllCropListings);
router.get("/listings/:id", cropListingController.getCropListingById);
router.get("/supplier/:supplierId/listings", cropListingController.getSupplierCropListings);

// Protected routes - only for authenticated suppliers
router.post(
  "/listings", 
  auth, 
  supplierMiddleware.isSupplier, 
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
