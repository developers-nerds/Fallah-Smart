const express = require("express");
const router = express.Router();
const scanController = require("../controllers/scan");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

// Route to create a new scan with image upload
router.post("/", auth, upload.single("image"), scanController.createScan);

// Route to get all scans for the authenticated user
router.get("/", auth, scanController.getUserScans);

// Route to get a specific scan by ID
router.get("/:id", auth, scanController.getScanById);

// Route to delete a scan
router.delete("/:id", auth, scanController.deleteScan);

module.exports = router;
