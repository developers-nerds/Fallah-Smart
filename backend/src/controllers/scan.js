const sequelize = require("../database/connection");
const { DataTypes } = require("sequelize");
const Scan = require("../database/models/Scans")(sequelize, DataTypes);
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

// Create a new scan with image
exports.createScan = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }
    const userId = req.user.id;

    // Generate a unique filename
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFilename = `scan_${uniqueId}_${Date.now()}${fileExtension}`;

    // Update the file path with the unique name - now using scans subfolder
    const uploadDir = path.join(__dirname, "../../uploads");
    const scansDir = path.join(uploadDir, "scans");
    const uniqueFilePath = path.join(scansDir, uniqueFilename);

    // Ensure both the uploads and scans directories exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    if (!fs.existsSync(scansDir)) {
      fs.mkdirSync(scansDir, { recursive: true });
    }

    // Save the file using multer's buffer
    fs.writeFileSync(uniqueFilePath, req.file.buffer);

    // Get the file path and mime type
    const mimeType = req.file.mimetype;

    // For image URL construction - update to include scans subfolder
    const imageUrl = `/uploads/scans/${uniqueFilename}`;

    // Get AI response from request body
    const aiResponse = req.body.ai_response || "No analysis available";
    console.log("userId", userId);
    // Create scan record in database using raw SQL
    const [scan] = await sequelize.query(
      `INSERT INTO "Scans" ("picture", "picture_mime_type", "ai_response", "userId", "createdAt", "updatedAt")
       VALUES (:picture, :picture_mime_type, :ai_response, :userId, NOW(), NOW())
       RETURNING *`,
      {
        replacements: {
          picture: uniqueFilename,
          picture_mime_type: mimeType,
          ai_response: aiResponse,
          userId: userId,
        },
        type: sequelize.QueryTypes.INSERT,
      }
    );
    return res.status(201).json({
      message: "Scan created successfully",
      scan: {
        id: scan.id,
        ai_response: scan.ai_response,
        createdAt: scan.createdAt,
        userId: userId,
        imageUrl: imageUrl,
      },
    });
  } catch (error) {
    console.error("Error creating scan:", error);
    return res
      .status(500)
      .json({ message: "Error creating scan", error: error.message });
  }
};

exports.getScans = async (req, res) => {
  try {
    const userId = req.user.id;

    const scans = await Scan.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]], // Get newest scans first
    });

    // Add the full image URL to each scan
    const scansWithImageUrls = scans.map((scan) => {
      const scanData = scan.toJSON();
      // Construct the full image URL
      scanData.imageUrl = `/uploads/scans/${scanData.picture}`;
      return scanData;
    });

    return res.status(200).json(scansWithImageUrls);
  } catch (error) {
    console.error("Error getting scans:", error);
    return res
      .status(500)
      .json({ message: "Error getting scans", error: error.message });
  }
};

// Add delete scan function
exports.deleteScan = async (req, res) => {
  try {
    const userId = req.user.id;
    const scanId = req.params.id;

    const scan = await Scan.findOne({
      where: { id: scanId, userId },
    });

    if (!scan) {
      return res
        .status(404)
        .json({ message: "Scan not found or unauthorized" });
    }

    // Delete the image file if it exists
    if (scan.picture) {
      const imagePath = path.join(
        __dirname,
        "../../uploads/scans",
        scan.picture
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await scan.destroy();
    return res.status(200).json({ message: "Scan deleted successfully" });
  } catch (error) {
    console.error("Error deleting scan:", error);
    return res
      .status(500)
      .json({ message: "Error deleting scan", error: error.message });
  }
};
