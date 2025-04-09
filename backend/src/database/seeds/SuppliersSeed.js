const { Suppliers } = require("../assossiation");
const path = require("path");

async function seedSuppliers() {
  try {
    console.log("🌱 Seeding suppliers...");

    // Professional company data for 10 suppliers
    const supplierData = [
      {
        company_name: "AgriTech Solutions",
        about_us:
          "Leading provider of sustainable agricultural technology solutions. We specialize in advanced irrigation systems, soil monitoring, and precision farming equipment to optimize crop yields and resource efficiency.",
        company_address: "123 Innovation Drive, Agrarian Valley, CA 94025",
        company_phone: "+1 (555) 234-5678",
        company_email: "info@agritechsolutions.com",
        company_website: "www.agritechsolutions.com",
      },
      {
        company_name: "FarmFresh Distributors",
        about_us:
          "Connecting farmers with markets since 1985. We provide reliable distribution services for fresh produce, ensuring quality from farm to table while supporting local agriculture communities.",
        company_address: "456 Harvest Road, Greenfield, OR 97123",
        company_phone: "+1 (555) 876-5432",
        company_email: "contact@farmfreshdist.com",
        company_website: "www.farmfreshdistributors.com",
      },
      {
        company_name: "EcoGrow Fertilizers",
        about_us:
          "Producers of premium organic fertilizers and soil amendments. Our environmentally responsible products enhance soil health and crop productivity without harmful chemicals.",
        company_address: "789 Organic Way, Fertile Hills, WA 98765",
        company_phone: "+1 (555) 432-9876",
        company_email: "support@ecogrow.com",
        company_website: "www.ecogrowfertilizers.com",
      },
      {
        company_name: "Harvest Machinery",
        about_us:
          "Specialized manufacturer of agricultural equipment for small to medium farms. Our machinery is designed for efficiency, durability, and ease of maintenance to meet modern farming needs.",
        company_address: "321 Equipment Lane, Machinery Park, IL 60614",
        company_phone: "+1 (555) 789-0123",
        company_email: "sales@harvestmachinery.com",
        company_website: "www.harvestmachinery.com",
      },
      {
        company_name: "SeedPro Genetics",
        about_us:
          "Developing high-yield, disease-resistant crop varieties through advanced breeding techniques. Our seeds are tailored for different climates and soil conditions to maximize agricultural productivity.",
        company_address: "567 Research Blvd, Cropville, IA 52240",
        company_phone: "+1 (555) 345-6789",
        company_email: "info@seedprogenetics.com",
        company_website: "www.seedprogenetics.com",
      },
      {
        company_name: "AquaFarm Systems",
        about_us:
          "Pioneers in aquaponics and hydroponics solutions for sustainable farming. Our integrated systems enable efficient water use and year-round production in various environmental conditions.",
        company_address: "890 Water Circle, Blue Springs, FL 33901",
        company_phone: "+1 (555) 567-8901",
        company_email: "solutions@aquafarm.com",
        company_website: "www.aquafarmsystems.com",
      },
      {
        company_name: "Livestock Nutrition Inc.",
        about_us:
          "Providing comprehensive animal nutrition products and consultation services. We develop specialized feed formulations for optimal livestock health, growth, and productivity.",
        company_address: "432 Animal Health Road, Stockton, TX 75482",
        company_phone: "+1 (555) 234-5678",
        company_email: "feed@livestocknutrition.com",
        company_website: "www.livestocknutritioninc.com",
      },
      {
        company_name: "GreenHorizon Consulting",
        about_us:
          "Agricultural consulting firm offering expert guidance on sustainable farming practices, crop rotation, pest management, and farm business development for improved profitability.",
        company_address: "765 Advisory Street, Consultant City, NE 68508",
        company_phone: "+1 (555) 901-2345",
        company_email: "consult@greenhorizon.com",
        company_website: "www.greenhorizonconsulting.com",
      },
      {
        company_name: "FarmTech Innovations",
        about_us:
          "Creating smart farm management solutions through IoT, AI, and data analytics. Our technology helps farmers make informed decisions to improve efficiency and sustainability.",
        company_address: "198 Tech Avenue, Smart City, CA 95814",
        company_phone: "+1 (555) 678-9012",
        company_email: "info@farmtechinnovations.com",
        company_website: "www.farmtechinnovations.com",
      },
      {
        company_name: "Organic Supply Co.",
        about_us:
          "Your one-stop shop for certified organic farming supplies and equipment. We provide everything from organic seeds to natural pest control solutions for sustainable agriculture.",
        company_address: "543 Natural Street, Organicville, VT 05401",
        company_phone: "+1 (555) 345-6789",
        company_email: "shop@organicsupplyco.com",
        company_website: "www.organicsupplyco.com",
      },
    ];

    // Create 10 suppliers with userIds from 1 to 10
    const suppliersToCreate = [];

    for (let i = 0; i < 10; i++) {
      const userId = i + 1; // userId from 1 to 10
      const logoPath = `/uploads/seeds/company/logo/${i + 1}${
        i + 1 <= 3 || i + 1 === 4 || i + 1 === 10 ? ".png" : ".jpg"
      }`;
      const bannerPath = `/uploads/seeds/company/banner/${i + 1}.jpg`;

      // Business hours (varies by company)
      let openTime, closeTime;

      if (i % 3 === 0) {
        // Some open early
        openTime = "08:00:00";
        closeTime = "17:00:00";
      } else if (i % 3 === 1) {
        // Some open standard hours
        openTime = "09:00:00";
        closeTime = "18:00:00";
      } else {
        // Some have extended hours
        openTime = "07:30:00";
        closeTime = "19:00:00";
      }

      suppliersToCreate.push({
        userId: userId,
        company_name: supplierData[i].company_name,
        about_us: supplierData[i].about_us,
        company_address: supplierData[i].company_address,
        company_phone: supplierData[i].company_phone,
        company_email: supplierData[i].company_email,
        company_website: supplierData[i].company_website,
        company_logo: logoPath,
        company_banner: bannerPath,
        is_verified: true, // All verified for investor demo
        open_time: openTime,
        close_time: closeTime,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await Suppliers.bulkCreate(suppliersToCreate);
    console.log(
      `✅ Created ${suppliersToCreate.length} suppliers with professional data`
    );

    return true;
  } catch (error) {
    console.error("❌ Error seeding suppliers:", error);
    throw error;
  }
}

module.exports = seedSuppliers;
