const { CropListings } = require("../assossiation");

async function seedCropListings() {
  try {
    console.log("🌱 Seeding crop listings...");

    const cropListingsData = [
      {
        supplierId: 1,
        crop_name: "Organic Wheat",
        sub_category: "Grains",
        quantity: 1000.0,
        price: 2.5,
        currency: "USD",
        description:
          "Premium organic wheat, non-GMO, perfect for baking and milling. Grown using sustainable farming practices.",
        unit: "kg",
        min_order_quantity: 50.0,
        listing_type: "fixed",
        status: "active",
      },
      {
        supplierId: 2,
        crop_name: "Fresh Tomatoes",
        sub_category: "Vegetables",
        quantity: 500.0,
        price: 1.8,
        currency: "USD",
        description:
          "Vine-ripened tomatoes, hand-picked daily. Perfect for salads, sauces, and fresh consumption.",
        unit: "kg",
        min_order_quantity: 10.0,
        listing_type: "fixed",
        status: "active",
      },
      {
        supplierId: 3,
        crop_name: "Organic Fertilizer",
        sub_category: "Agricultural Inputs",
        quantity: 2000.0,
        price: 15.0,
        currency: "USD",
        description:
          "Natural organic fertilizer made from composted plant materials. Improves soil health and crop yield.",
        unit: "kg",
        min_order_quantity: 100.0,
        listing_type: "fixed",
        status: "active",
      },
      {
        supplierId: 4,
        crop_name: "Corn Seeds",
        sub_category: "Seeds",
        quantity: 5000.0,
        price: 0.5,
        currency: "USD",
        description:
          "High-yield hybrid corn seeds, disease-resistant variety. Suitable for various climate conditions.",
        unit: "kg",
        min_order_quantity: 5.0,
        listing_type: "fixed",
        status: "active",
      },
      {
        supplierId: 5,
        crop_name: "Premium Coffee Beans",
        sub_category: "Beverage Crops",
        quantity: 300.0,
        price: 8.0,
        currency: "USD",
        description:
          "Arabica coffee beans, shade-grown, single-origin. Perfect for specialty coffee production.",
        unit: "kg",
        min_order_quantity: 5.0,
        listing_type: "fixed",
        status: "active",
      },
      {
        supplierId: 6,
        crop_name: "Hydroponic Lettuce",
        sub_category: "Vegetables",
        quantity: 200.0,
        price: 3.5,
        currency: "USD",
        description:
          "Fresh hydroponically grown lettuce, pesticide-free. Available in various varieties.",
        unit: "kg",
        min_order_quantity: 5.0,
        listing_type: "fixed",
        status: "active",
      },
      {
        supplierId: 7,
        crop_name: "Organic Chicken Feed",
        sub_category: "Animal Feed",
        quantity: 1000.0,
        price: 12.0,
        currency: "USD",
        description:
          "Nutritionally balanced organic feed for poultry. Contains essential vitamins and minerals.",
        unit: "kg",
        min_order_quantity: 25.0,
        listing_type: "fixed",
        status: "active",
      },
      {
        supplierId: 8,
        crop_name: "Alfalfa Hay",
        sub_category: "Forage",
        quantity: 2000.0,
        price: 4.0,
        currency: "USD",
        description:
          "Premium quality alfalfa hay, high in protein and nutrients. Perfect for livestock feed.",
        unit: "kg",
        min_order_quantity: 100.0,
        listing_type: "fixed",
        status: "active",
      },
      {
        supplierId: 9,
        crop_name: "Organic Strawberries",
        sub_category: "Fruits",
        quantity: 200.0,
        price: 4.99,
        currency: "USD",
        description:
          "Fresh organic strawberries, hand-picked at peak ripeness. Sweet, juicy, and perfect for fresh consumption or processing.",
        unit: "kg",
        min_order_quantity: 5.0,
        listing_type: "fixed",
        status: "active",
      },
      {
        supplierId: 10,
        crop_name: "Rainbow Carrots",
        sub_category: "Vegetables",
        quantity: 300.0,
        price: 2.99,
        currency: "USD",
        description:
          "Colorful mix of organic rainbow carrots (purple, yellow, orange, and white). Rich in nutrients and perfect for both fresh consumption and processing.",
        unit: "kg",
        min_order_quantity: 10.0,
        listing_type: "fixed",
        status: "active",
      },
    ];

    await CropListings.bulkCreate(cropListingsData);
    console.log(`✅ Created ${cropListingsData.length} crop listings`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding crop listings:", error);
    throw error;
  }
}

module.exports = seedCropListings;
