const {
  Suppliers,
  CropListings,
  CropOrders,
  Auctions,
} = require("../database/assossiation");
const path = require("path");
const fs = require("fs");
const validator = require("validator");

const getSupplierByUserId = async (req, res) => {
  try {
    const userId = req.user.id;

    const supplier = await Suppliers.findOne({
      where: { userId: userId },
    });

    if (!supplier) {
      return res.status(200).json({
        hasAccount: false,
        message: "User does not have a supplier account",
      });
    }
    const productsNumber = await CropListings.findAll({
      where: { supplierId: supplier.id, status: "active" },
    });
    const ordersNumber = await CropOrders.findAll({
      where: { supplierId: supplier.id },
    });
    const auctionsNumber = await Auctions.findAll({
      where: { supplierId: supplier.id },
    });
    return res.status(200).json({
      productsNumber: productsNumber.length,
      ordersNumber: ordersNumber.length,
      auctionsNumber: auctionsNumber.length,
      hasAccount: true,
      supplier,
    });
  } catch (error) {
    console.error("Error in getSupplierByUserId:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const createSupplier = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      company_name,
      about_us,
      company_address,
      company_phone,
      company_email,
      company_website,
      open_time,
      close_time,
    } = req.body;

    // Log the incoming request files
    console.log("Incoming files:", {
      hasFiles: !!req.files,
      fileKeys: req.files ? Object.keys(req.files) : [],
    });

    // Validate required fields
    if (
      !company_name ||
      !company_address ||
      !company_phone ||
      !company_email
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate company name and email format
    if (!validator.isLength(company_name, { min: 2 })) {
      return res.status(400).json({
        success: false,
        message: "Company name must be at least 2 characters long",
      });
    }

    // Email validation
    if (!validator.isEmail(company_email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Check if supplier already exists
    const existingSupplier = await Suppliers.findOne({
      where: { userId: userId },
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: "Supplier account already exists for this user",
      });
    }

    // Handle file uploads
    let company_logo = null;
    let company_banner = null;

    // Ensure the upload directory exists
    const uploadDir = path.join(__dirname, "../../uploads/company");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    if (req.files) {
      console.log("Processing file uploads...");

      // Handle logo upload
      if (req.files.company_logo && req.files.company_logo[0]) {
        const logoFile = req.files.company_logo[0];
        console.log("Processing logo:", {
          originalName: logoFile.originalname,
          size: logoFile.size,
          mimetype: logoFile.mimetype,
        });

        const logoExt = path.extname(logoFile.originalname);
        const logoFileName = `logo_${userId}_${Date.now()}${logoExt}`;
        const logoPath = path.join(uploadDir, logoFileName);

        // Save the file
        fs.writeFileSync(logoPath, logoFile.buffer);
        company_logo = `/uploads/company/${logoFileName}`;
        console.log("Logo saved successfully:", company_logo);
      }

      // Handle banner upload
      if (req.files.company_banner && req.files.company_banner[0]) {
        const bannerFile = req.files.company_banner[0];
        console.log("Processing banner:", {
          originalName: bannerFile.originalname,
          size: bannerFile.size,
          mimetype: bannerFile.mimetype,
        });

        const bannerExt = path.extname(bannerFile.originalname);
        const bannerFileName = `banner_${userId}_${Date.now()}${bannerExt}`;
        const bannerPath = path.join(uploadDir, bannerFileName);

        // Save the file
        fs.writeFileSync(bannerPath, bannerFile.buffer);
        company_banner = `/uploads/company/${bannerFileName}`;
        console.log("Banner saved successfully:", company_banner);
      }
    }

    // Create new supplier
    const supplier = await Suppliers.create({
      userId,
      company_name,
      about_us,
      company_address,
      company_phone,
      company_email,
      company_website: company_website || "",
      company_logo,
      company_banner,
      open_time,
      close_time,
    });

    console.log("Supplier created successfully:", {
      id: supplier.id,
      company_name: supplier.company_name,
      has_logo: !!company_logo,
      has_banner: !!company_banner,
    });

    return res.status(201).json({
      success: true,
      message: "Supplier account created successfully",
      supplier,
    });
  } catch (error) {
    console.error("Error in createSupplier:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getSupplierByUserId,
  createSupplier,
};
