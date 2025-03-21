const { Suppliers } = require("../database/assossiation");

/**
 * Middleware to check if the authenticated user is a supplier
 * This middleware should be used after the auth middleware
 */
exports.isSupplier = async (req, res, next) => {
  try {
    // Extract user ID from the authenticated request - handle both id and userId formats
    // This fix handles the case where the token contains id but the middleware expects userId
    const userId = req.user.userId || req.user.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authorization required"
      });
    }
    
    // Check if user is a supplier
    const supplier = await Suppliers.findOne({ where: { userId } });
    
    if (!supplier) {
      return res.status(403).json({
        success: false,
        message: "Access denied. User is not a registered supplier."
      });
    }
    
    // Add supplier data to the request for potential use in controller
    req.supplier = supplier;
    
    // User is a supplier, proceed to the next middleware/controller
    next();
  } catch (error) {
    console.error("Error in supplier middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while checking supplier status"
    });
  }
}; 