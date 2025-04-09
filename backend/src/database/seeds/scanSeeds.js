const { Scan } = require("../assossiation");

async function seedScans() {
  try {
    console.log("🌱 Seeding scans...");

    const scanData = [
      // User 1 scans
      {
        ai_response:
          "Identified as Organic Wheat. This crop appears healthy with no visible signs of disease. The wheat is approaching maturity with golden color indicating it's ready for harvest. Protein content is estimated to be high based on appearance. Recommended action: Plan for harvest within the next 7-10 days for optimal yield.",
        picture: "/uploads/scans/Organic Wheat1.jpg",
        picture_mime_type: "image/jpeg",
        userId: 1,
      },
      {
        ai_response:
          "Detected Tomato plants with early signs of leaf spot disease. Approximately 15% of foliage affected. Recommendation: Apply organic fungicide and ensure proper spacing between plants to improve air circulation. Monitor closely for the next 5 days and remove any severely affected leaves.",
        picture: "/uploads/scans/Tomatoes2.jpg",
        picture_mime_type: "image/jpeg",
        userId: 1,
      },

      // User 2 scans
      {
        ai_response:
          "Analyzed Corn crop at approximately 60 days growth. Plants show normal development with no significant pest damage. Slight nitrogen deficiency detected by yellowing of lower leaves. Recommendation: Apply nitrogen-rich fertilizer within the next 3 days and ensure adequate irrigation of 1-1.5 inches per week.",
        picture: "/uploads/scans/CornSeeds1.jpg",
        picture_mime_type: "image/jpeg",
        userId: 2,
      },

      // User 3 scans
      {
        ai_response:
          "Coffee plant identified with signs of coffee rust (Hemileia vastatrix). Infection is at early stage with yellow spots visible on approximately 20% of leaves. Recommendation: Immediate application of copper-based fungicide, removal of infected leaves, and improvement of air circulation by pruning. Follow up with monitoring every 3 days.",
        picture: "/uploads/scans/CoffeeBeans2.jpg",
        picture_mime_type: "image/jpeg",
        userId: 3,
      },
      {
        ai_response:
          "Lettuce analysis shows healthy growth with no signs of disease or pest infestation. Plants are at optimal harvesting stage. Nutritional profile appears excellent with vibrant green color indicating high chlorophyll content. Recommendation: Harvest within the next 1-2 days for maximum quality and nutritional value.",
        picture: "/uploads/scans/Lettuce1.jpg",
        picture_mime_type: "image/jpeg",
        userId: 3,
      },

      // User 4 scans
      {
        ai_response:
          "Alfalfa hay quality assessment: Protein content estimated at 18-20%, moisture level appears optimal at approximately 12-14%. No visible mold or foreign material detected. Stem-to-leaf ratio is good with high proportion of leaves intact. This is premium quality hay suitable for dairy cattle and horses.",
        picture: "/uploads/scans/Alfalfa Hay2.jpg",
        picture_mime_type: "image/jpeg",
        userId: 4,
      },

      // User 5 scans
      {
        ai_response:
          "Strawberry plants show signs of gray mold (Botrytis cinerea) affecting approximately 10% of fruit. Current humidity levels are promoting disease development. Recommendation: Improve air circulation, remove affected fruits immediately, apply appropriate organic fungicide, and adjust watering to avoid overhead irrigation. Monitor closely over the next week.",
        picture: "/uploads/scans/Strawberries2.jpg",
        picture_mime_type: "image/jpeg",
        userId: 5,
      },

      // User 6 scans
      {
        ai_response:
          "Carrot crop assessment: Root development is optimal with expected yield of 25-30 tons per hectare. No signs of common carrot diseases such as Alternaria leaf blight or carrot rust fly damage. Soil conditions appear favorable with good moisture content. Recommendation: Continue current management practices and plan for harvest in approximately 2 weeks.",
        picture: "/uploads/scans/Carrots1.jpg",
        picture_mime_type: "image/jpeg",
        userId: 6,
      },

      // User 7 scans
      {
        ai_response:
          "Organic fertilizer analysis shows balanced NPK ratio suitable for general crop application. Microbial activity appears high based on visual assessment. No contaminants detected. Recommendation: Apply at rate of 2-3 tons per hectare for field crops or 3-5 kg per 100 square meters for garden application. Incorporate into soil for best results.",
        picture: "/uploads/scans/OrganicFertilizer1.jpg",
        picture_mime_type: "image/jpeg",
        userId: 7,
      },

      // User 8 scans
      {
        ai_response:
          "Tomato plant diagnosis indicates early blight (Alternaria solani) affecting approximately 25% of foliage. Disease is at moderate stage of progression. Recommendation: Immediate removal of severely affected leaves, application of approved fungicide, implementation of drip irrigation to avoid wetting foliage, and crop rotation planning for next season.",
        picture: "/uploads/scans/Tomatoes3.jpg",
        picture_mime_type: "image/jpeg",
        userId: 8,
      },

      // User 9 scans
      {
        ai_response:
          "Coffee bean quality assessment: Beans appear to be of premium Arabica variety with consistent size and color. Estimated cup score of 85+ based on visual quality markers. No visible defects or insect damage. Moisture content appears optimal at approximately 10-12%. These beans should produce excellent flavor profile with notes of chocolate and citrus.",
        picture: "/uploads/scans/CoffeeBeans3.jpg",
        picture_mime_type: "image/jpeg",
        userId: 9,
      },

      // User 10 scans
      {
        ai_response:
          "Wheat crop assessment at flowering stage shows optimal development. No signs of rust or powdery mildew detected. Plant density is appropriate at approximately 300-320 plants per square meter. Estimated yield based on head size and density is 5.5-6 tons per hectare. Continue with planned management and monitor for any late-season disease development.",
        picture: "/uploads/scans/Organic Wheat2.jpg",
        picture_mime_type: "image/jpeg",
        userId: 10,
      },
      {
        ai_response:
          "Lettuce analysis indicates minor aphid infestation on approximately 5% of plants. Plant growth and development otherwise normal with good size and color. Recommendation: Targeted application of insecticidal soap or neem oil to affected areas, introduction of beneficial insects such as ladybugs if available, and close monitoring over the next 7 days.",
        picture: "/uploads/scans/Lettuce3.jpg",
        picture_mime_type: "image/jpeg",
        userId: 10,
      },
    ];

    await Scan.bulkCreate(scanData);
    console.log(`✅ Created ${scanData.length} scan entries`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding scans:", error);
    throw error;
  }
}

module.exports = seedScans;




