const { CropListings, Suppliers } = require("../database/assossiation");

// Get all crop listings for a supplier
exports.getSupplierCropListings = async (req, res) => {
  try {
    const supplierId = req.params.supplierId;
    
    const cropListings = await CropListings.findAll({
      where: { supplierId },
      order: [['createdAt', 'DESC']]
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
    // Handle both id and userId from token for consistency with middleware
    const userId = req.user.userId || req.user.id;
    
    console.log("Creating crop listing for user:", userId);
    console.log("Request body:", req.body);
    
    // Find the supplier by userId
    const supplier = await Suppliers.findOne({ where: { userId } });
    
    if (!supplier) {
      console.log("Supplier not found for userId:", userId);
      return res.status(404).json({ 
        success: false, 
        message: "Supplier account not found" 
      });
    }
    
    console.log("Found supplier:", supplier.id);
    
    // Create the crop listing with the supplier's ID
    const newListing = await CropListings.create({
      ...req.body,
      supplierId: supplier.id,
      status: "active"
    });
    
    console.log("Created new listing:", newListing.id);
    
    return res.status(201).json({ 
      success: true, 
      message: "Crop listing created successfully", 
      cropListing: newListing 
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
        message: "Supplier account not found" 
      });
    }
    
    // Find the listing
    const listing = await CropListings.findOne({ 
      where: { 
        id: listingId,
        supplierId: supplier.id
      }
    });
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Crop listing not found or you don't have permission to update it"
      });
    }
    
    // Update the listing
    await listing.update(req.body);
    
    return res.status(200).json({
      success: true,
      message: "Crop listing updated successfully",
      cropListing: listing
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
        message: "Supplier account not found" 
      });
    }
    
    // Find the listing
    const listing = await CropListings.findOne({ 
      where: { 
        id: listingId,
        supplierId: supplier.id
      }
    });
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Crop listing not found or you don't have permission to delete it"
      });
    }
    
    // Delete the listing
    await listing.destroy();
    
    return res.status(200).json({
      success: true,
      message: "Crop listing deleted successfully"
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
    
    const listing = await CropListings.findByPk(listingId);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Crop listing not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      cropListing: listing
    });
  } catch (error) {
    console.error("Error fetching crop listing:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all crop listings (for marketplace)
exports.getAllCropListings = async (req, res) => {
  try {
    console.log("Fetching all crop listings");
    
    const cropListings = await CropListings.findAll({
      where: { status: 'active' },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Suppliers,
          as: 'supplier',
          attributes: ['id', 'company_name', 'company_logo']
        }
      ]
    });
    
    console.log(`Found ${cropListings.length} active listings`);
    
    return res.status(200).json({ success: true, cropListings });
  } catch (error) {
    console.error("Error fetching all crop listings:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
