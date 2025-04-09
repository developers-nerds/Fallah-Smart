const { Media } = require("../assossiation");

async function seedMarketplaceMedia() {
  try {
    console.log("🌱 Seeding marketplace media...");

    const mediaData = [
      // Organic Wheat (3 images)
      {
        url: "/uploads/seeds/company/crop listing/Organic Wheat1.jpg",
        type: "image",
        originalName: "Organic Wheat1.jpg",
        mimeType: "image/jpeg",
        title: "Organic Wheat Field",
        description: "Premium organic wheat field view",
        cropListingId: 1,
      },
      {
        url: "/uploads/seeds/company/crop listing/Organic Wheat2.jpg",
        type: "image",
        originalName: "Organic Wheat2.jpg",
        mimeType: "image/jpeg",
        title: "Organic Wheat Grains",
        description: "Close-up of organic wheat grains",
        cropListingId: 1,
      },
      {
        url: "/uploads/seeds/company/crop listing/Organic Wheat3.jpg",
        type: "image",
        originalName: "Organic Wheat3.jpg",
        mimeType: "image/jpeg",
        title: "Organic Wheat Harvest",
        description: "Harvesting organic wheat",
        cropListingId: 1,
      },

      // Fresh Tomatoes (4 images)
      {
        url: "/uploads/seeds/company/crop listing/Tomatoes1.jpg",
        type: "image",
        originalName: "Tomatoes1.jpg",
        mimeType: "image/jpeg",
        title: "Fresh Tomatoes",
        description: "Vine-ripened tomatoes",
        cropListingId: 2,
      },
      {
        url: "/uploads/seeds/company/crop listing/Tomatoes2.jpg",
        type: "image",
        originalName: "Tomatoes2.jpg",
        mimeType: "image/jpeg",
        title: "Tomato Harvest",
        description: "Freshly harvested tomatoes",
        cropListingId: 2,
      },
      {
        url: "/uploads/seeds/company/crop listing/Tomatoes3.jpg",
        type: "image",
        originalName: "Tomatoes3.jpg",
        mimeType: "image/jpeg",
        title: "Tomato Quality",
        description: "Quality check of tomatoes",
        cropListingId: 2,
      },
      {
        url: "/uploads/seeds/company/crop listing/Tomatoes4.jpg",
        type: "image",
        originalName: "Tomatoes4.jpg",
        mimeType: "image/jpeg",
        title: "Tomato Packaging",
        description: "Packaged tomatoes ready for delivery",
        cropListingId: 2,
      },

      // Organic Fertilizer (3 images)
      {
        url: "/uploads/seeds/company/crop listing/OrganicFertilizer1.jpg",
        type: "image",
        originalName: "OrganicFertilizer1.jpg",
        mimeType: "image/jpeg",
        title: "Organic Fertilizer",
        description: "Natural organic fertilizer product",
        cropListingId: 3,
      },
      {
        url: "/uploads/seeds/company/crop listing/OrganicFertilizer2.jpg",
        type: "image",
        originalName: "OrganicFertilizer2.jpg",
        mimeType: "image/jpeg",
        title: "Fertilizer Application",
        description: "Applying organic fertilizer to crops",
        cropListingId: 3,
      },
      {
        url: "/uploads/seeds/company/crop listing/OrganicFertilizer3.jpg",
        type: "image",
        originalName: "OrganicFertilizer3.jpg",
        mimeType: "image/jpeg",
        title: "Fertilizer Packaging",
        description: "Packaged organic fertilizer",
        cropListingId: 3,
      },

      // Corn Seeds (3 images)
      {
        url: "/uploads/seeds/company/crop listing/CornSeeds1.jpg",
        type: "image",
        originalName: "CornSeeds1.jpg",
        mimeType: "image/jpeg",
        title: "Corn Seeds",
        description: "High-quality corn seeds",
        cropListingId: 4,
      },
      {
        url: "/uploads/seeds/company/crop listing/CornSeeds2.jpg",
        type: "image",
        originalName: "CornSeeds2.jpg",
        mimeType: "image/jpeg",
        title: "Corn Field",
        description: "Corn field grown from our seeds",
        cropListingId: 4,
      },
      {
        url: "/uploads/seeds/company/crop listing/CornSeeds3.jpg",
        type: "image",
        originalName: "CornSeeds3.jpg",
        mimeType: "image/jpeg",
        title: "Corn Harvest",
        description: "Harvesting corn from our seeds",
        cropListingId: 4,
      },

      // Premium Coffee Beans (3 images)
      {
        url: "/uploads/seeds/company/crop listing/CoffeeBeans1.jpg",
        type: "image",
        originalName: "CoffeeBeans1.jpg",
        mimeType: "image/jpeg",
        title: "Coffee Beans",
        description: "Premium Arabica coffee beans",
        cropListingId: 5,
      },
      {
        url: "/uploads/seeds/company/crop listing/CoffeeBeans2.jpg",
        type: "image",
        originalName: "CoffeeBeans2.jpg",
        mimeType: "image/jpeg",
        title: "Coffee Plantation",
        description: "Shade-grown coffee plantation",
        cropListingId: 5,
      },
      {
        url: "/uploads/seeds/company/crop listing/CoffeeBeans3.jpg",
        type: "image",
        originalName: "CoffeeBeans3.jpg",
        mimeType: "image/jpeg",
        title: "Coffee Processing",
        description: "Processing premium coffee beans",
        cropListingId: 5,
      },

      // Hydroponic Lettuce (3 images)
      {
        url: "/uploads/seeds/company/crop listing/Lettuce1.jpg",
        type: "image",
        originalName: "Lettuce1.jpg",
        mimeType: "image/jpeg",
        title: "Hydroponic Lettuce",
        description: "Fresh hydroponic lettuce",
        cropListingId: 6,
      },
      {
        url: "/uploads/seeds/company/crop listing/Lettuce2.jpg",
        type: "image",
        originalName: "Lettuce2.jpg",
        mimeType: "image/jpeg",
        title: "Lettuce Farm",
        description: "Hydroponic lettuce farm",
        cropListingId: 6,
      },
      {
        url: "/uploads/seeds/company/crop listing/Lettuce3.jpg",
        type: "image",
        originalName: "Lettuce3.jpg",
        mimeType: "image/jpeg",
        title: "Lettuce Packaging",
        description: "Packaged hydroponic lettuce",
        cropListingId: 6,
      },

      // Organic Chicken Feed (1 image)
      {
        url: "/uploads/seeds/company/crop listing/Organic Chicken Feed.jpg",
        type: "image",
        originalName: "Organic Chicken Feed.jpg",
        mimeType: "image/jpeg",
        title: "Organic Chicken Feed",
        description: "Nutritionally balanced organic feed",
        cropListingId: 7,
      },

      // Alfalfa Hay (3 images)
      {
        url: "/uploads/seeds/company/crop listing/Alfalfa Hay1.jpg",
        type: "image",
        originalName: "Alfalfa Hay1.jpg",
        mimeType: "image/jpeg",
        title: "Alfalfa Hay",
        description: "Premium quality alfalfa hay",
        cropListingId: 8,
      },
      {
        url: "/uploads/seeds/company/crop listing/Alfalfa Hay2.jpg",
        type: "image",
        originalName: "Alfalfa Hay2.jpg",
        mimeType: "image/jpeg",
        title: "Alfalfa Field",
        description: "Alfalfa field ready for harvest",
        cropListingId: 8,
      },
      {
        url: "/uploads/seeds/company/crop listing/AlfalfaHay3.jpg",
        type: "image",
        originalName: "AlfalfaHay3.jpg",
        mimeType: "image/jpeg",
        title: "Alfalfa Bales",
        description: "Baled alfalfa hay",
        cropListingId: 8,
      },

      // Organic Strawberries (3 images)
      {
        url: "/uploads/seeds/company/crop listing/Strawberries1.jpg",
        type: "image",
        originalName: "Strawberries1.jpg",
        mimeType: "image/jpeg",
        title: "Organic Strawberries",
        description: "Fresh organic strawberries",
        cropListingId: 9,
      },
      {
        url: "/uploads/seeds/company/crop listing/Strawberries2.jpg",
        type: "image",
        originalName: "Strawberries2.jpg",
        mimeType: "image/jpeg",
        title: "Strawberry Field",
        description: "Organic strawberry field",
        cropListingId: 9,
      },
      {
        url: "/uploads/seeds/company/crop listing/Strawberries3.jpg",
        type: "image",
        originalName: "Strawberries3.jpg",
        mimeType: "image/jpeg",
        title: "Strawberry Harvest",
        description: "Harvesting organic strawberries",
        cropListingId: 9,
      },

      // Rainbow Carrots (2 images)
      {
        url: "/uploads/seeds/company/crop listing/Carrots1.jpg",
        type: "image",
        originalName: "Carrots1.jpg",
        mimeType: "image/jpeg",
        title: "Rainbow Carrots",
        description: "Colorful mix of organic rainbow carrots",
        cropListingId: 10,
      },
      {
        url: "/uploads/seeds/company/crop listing/Carrots2.jpg",
        type: "image",
        originalName: "Carrots2.jpg",
        mimeType: "image/jpeg",
        title: "Carrot Harvest",
        description: "Harvesting rainbow carrots",
        cropListingId: 10,
      },
    ];

    await Media.bulkCreate(mediaData);
    console.log(`✅ Created ${mediaData.length} media entries`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding marketplace media:", error);
    throw error;
  }
}

module.exports = seedMarketplaceMedia;
