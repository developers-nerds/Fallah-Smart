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

    // Save the buffer directly to the file
    if (req.file.buffer) {
      // If multer is configured with memory storage
      fs.writeFileSync(uniqueFilePath, req.file.buffer);
    } else if (req.file.path) {
      // If multer is configured with disk storage
      fs.copyFileSync(req.file.path, uniqueFilePath);

      // Optionally remove the temporary file if needed
      if (fs.existsSync(req.file.path) && req.file.path !== uniqueFilePath) {
        fs.unlinkSync(req.file.path);
      }
    } else {
      throw new Error("Invalid file upload configuration");
    }

    // Get the file path and mime type
    const mimeType = req.file.mimetype;

    // For image URL construction - update to include scans subfolder
    const imageUrl = `/uploads/scans/${uniqueFilename}`;

    // Get AI response from request body or set default
    const aiResponse = req.body.ai_response || "No analysis available";

    // Use raw SQL query instead of Sequelize model API
    const [results] = await sequelize.query(
      `INSERT INTO "Scans" (
        "picture", 
        "picture_mime_type", 
        "ai_response", 
        "createdAt", 
        "updatedAt", 
        "userId"
      ) 
      VALUES (
        :picture, 
        :picture_mime_type, 
        :ai_response, 
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP, 
        :userId
      )
      RETURNING *`,
      {
        replacements: {
          picture: uniqueFilename, // Store the unique filename
          picture_mime_type: mimeType,
          ai_response: aiResponse,
          userId: userId,
        },
        type: sequelize.QueryTypes.INSERT,
      }
    );

    // Now results contains the full inserted record
    const scan = results;

    return res.status(201).json({
      message: "Scan created successfully",
      scan: {
        id: scan.id,
        ai_response: scan.ai_response,
        createdAt: scan.createdAt,
        userId: userId,
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
