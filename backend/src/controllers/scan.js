const sequelize = require("../database/connection");
const { DataTypes } = require("sequelize");
const Scan = require("../database/models/Scans")(sequelize, DataTypes);

// Create a new scan with image
exports.createScan = async (req, res) => {
  try {
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    // Get the image data and mime type
    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    // Convert buffer to base64 string for storage
    const base64Image = imageBuffer.toString("base64");
    // Get AI response from request body or set default
    const aiResponse = req.body.ai_response || "No analysis available";
    // Create the scan record
    const scan = await Scan.create({
      picture: base64Image,
      picture_mime_type: mimeType,
      ai_response: aiResponse,
      UserId: req.user.id, // Assuming user ID is available from auth middleware
    });

    return res.status(201).json({
      message: "Scan created successfully",
      scan: {
        id: scan.id,
        ai_response: scan.ai_response,
        createdAt: scan.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating scan:", error);
    return res
      .status(500)
      .json({ message: "Failed to create scan", error: error.message });
  }
};

// Get all scans for the authenticated user
exports.getUserScans = async (req, res) => {
  try {
    const scans = await Scan.findAll({
      where: { UserId: req.user.id },
      order: [["createdAt", "DESC"]],
      attributes: ["id", "ai_response", "createdAt"],
    });

    return res.status(200).json({ scans });
  } catch (error) {
    console.error("Error fetching scans:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch scans", error: error.message });
  }
};

// Get a specific scan by ID
exports.getScanById = async (req, res) => {
  try {
    const scan = await Scan.findOne({
      where: {
        id: req.params.id,
        UserId: req.user.id,
      },
    });

    if (!scan) {
      return res.status(404).json({ message: "Scan not found" });
    }

    // Create a response object with the image as a data URL
    const scanData = {
      id: scan.id,
      ai_response: scan.ai_response,
      createdAt: scan.createdAt,
      image: scan.picture
        ? `data:${scan.picture_mime_type};base64,${scan.picture}`
        : null,
    };

    return res.status(200).json({ scan: scanData });
  } catch (error) {
    console.error("Error fetching scan:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch scan", error: error.message });
  }
};

// Delete a scan
exports.deleteScan = async (req, res) => {
  try {
    const result = await Scan.destroy({
      where: {
        id: req.params.id,
        UserId: req.user.id,
      },
    });

    if (result === 0) {
      return res
        .status(404)
        .json({ message: "Scan not found or not authorized to delete" });
    }

    return res.status(200).json({ message: "Scan deleted successfully" });
  } catch (error) {
    console.error("Error deleting scan:", error);
    return res
      .status(500)
      .json({ message: "Failed to delete scan", error: error.message });
  }
};
