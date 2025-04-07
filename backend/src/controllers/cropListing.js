const { CropListings, Suppliers, Media } = require("../database/assossiation");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Get all crop listings for a supplier
exports.getSupplierCropListings = async (req, res) => {
  try {
    const supplierId = req.params.supplierId;

    const cropListings = await CropListings.findAll({
      where: { supplierId },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, cropListings });
  } catch (error) {
    console.error("Error fetching supplier crop listings:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create a new crop listing
exports.createCropListing = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const supplier = await Suppliers.findOne({ where: { userId } });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier account not found",
      });
    }

    // Create the crop listing
    const newListing = await CropListings.create({
      ...req.body,
      supplierId: supplier.id,
      status: "active",
    });

    // Handle image uploads if present
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        // Generate unique filename
        const filename = `${uuidv4()}${path.extname(file.originalname)}`;
        const uploadPath = path.join(
          __dirname,
          "../../uploads/crops",
          filename
        );

        // Ensure directory exists
        await fs.promises.mkdir(path.dirname(uploadPath), { recursive: true });

        // Write file to disk
        await fs.promises.writeFile(uploadPath, file.buffer);

        // Create media record
        return Media.create({
          url: `/uploads/crops/${filename}`,
          type: "image",
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          cropListingId: newListing.id,
          file_path: uploadPath,
          file_type: file.mimetype,
        });
      });

      await Promise.all(uploadPromises);
    }

    // Fetch the created listing with its images
    const listingWithImages = await CropListings.findOne({
      where: { id: newListing.id },
      include: [
        {
          model: Media,
          as: "media",
          attributes: ["id", "url", "type", "originalName"],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Crop listing created successfully",
      cropListing: listingWithImages,
    });
  } catch (error) {
    console.error("Error creating crop listing:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update an existing crop listing
exports.updateCropListing = async (req, res) => {
  try {
    // Handle both id and userId from token
    const userId = req.user.userId || req.user.id;
    const listingId = req.params.id;

    // Find the supplier by userId
    const supplier = await Suppliers.findOne({ where: { userId } });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier account not found",
      });
    }

    // Find the listing
    const listing = await CropListings.findOne({
      where: {
        id: listingId,
        supplierId: supplier.id,
      },
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message:
          "Crop listing not found or you don't have permission to update it",
      });
    }

    // Update the listing
    await listing.update(req.body);

    return res.status(200).json({
      success: true,
      message: "Crop listing updated successfully",
      cropListing: listing,
    });
  } catch (error) {
    console.error("Error updating crop listing:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a crop listing
exports.deleteCropListing = async (req, res) => {
  try {
    // Handle both id and userId from token
    const userId = req.user.userId || req.user.id;
    const listingId = req.params.id;

    // Find the supplier by userId
    const supplier = await Suppliers.findOne({ where: { userId } });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier account not found",
      });
    }

    // Find the listing
    const listing = await CropListings.findOne({
      where: {
        id: listingId,
        supplierId: supplier.id,
      },
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message:
          "Crop listing not found or you don't have permission to delete it",
      });
    }

    // Delete the listing
    await listing.destroy();

    return res.status(200).json({
      success: true,
      message: "Crop listing deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting crop listing:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get a single crop listing by ID
exports.getCropListingById = async (req, res) => {
  try {
    const listingId = req.params.id;

    const listing = await CropListings.findOne({
      where: { id: listingId },
      include: [
        {
          model: Media,
          as: "media",
          attributes: ["id", "url", "type", "originalName"],
        },
      ],
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Crop listing not found",
      });
    }

    return res.status(200).json({
      success: true,
      cropListing: listing,
    });
  } catch (error) {
    console.error("Error fetching crop listing:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all crop listings (for marketplace)
exports.getAllCropListings = async (req, res) => {
  try {
    const cropListings = await CropListings.findAll({
      where: { status: "active" },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Suppliers,
          as: "supplier",
          attributes: [
            "id",
            "company_name",
            "company_logo",
            "userId",
            "company_phone",
          ],
        },
        {
          model: Media,
          as: "media",
          attributes: ["id", "url", "type", "originalName"],
        },
      ],
    });

    // Add debug logging

    return res.status(200).json({ success: true, cropListings });
  } catch (error) {
    console.error("Error fetching all crop listings:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all crop listings for a specific supplier (for profile view)
exports.getSupplierProducts = async (req, res) => {
  try {
    const supplierId = req.params.supplierId;

    const cropListings = await CropListings.findAll({
      where: {
        supplierId,
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Media,
          as: "media",
          attributes: ["id", "url", "type", "originalName"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      cropListings,
    });
  } catch (error) {
    console.error("Error fetching supplier products:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
