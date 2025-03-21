require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Route imports
const animalGastonRoutes = require("./routes/animalGastonRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const userRoutes = require("./routes/userRoutes");
const stockRoutes = require("./routes/stockRoutes");
const pesticideRoutes = require("./routes/pesticideRoutes");
const blogRoutes = require("./routes/blogRoutes");
const scanRoutes = require("./routes/scanRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const accountRoutes = require("./routes/accountRoutes");
const cropRoutes = require("./routes/cropRoutes");
const cropDetailsRoutes = require("./routes/cropsDetails");
const animalRoutes = require("./routes/animalRoutes");
const animalDetailsRoutes = require("./routes/animalsDetails");
const animal = require("./routes/animal");
const stockStatisticsRoutes = require("./routes/stockStatisticsRoutes");
const suppliersRoutes = require("./routes/suppliersRoutes");

// New stock management routes
const stockFeedRoutes = require("./routes/stockFeedRoutes");
const stockSeedsRoutes = require("./routes/stockSeedsRoutes");
const stockFertilizerRoutes = require("./routes/stockFertilizerRoutes");
const stockEquipmentRoutes = require("./routes/stockEquipmentRoutes");
const stockToolsRoutes = require("./routes/stockToolsRoutes");
const stockHarvestRoutes = require("./routes/stockHarvestRoutes");

///////////////////////Education Routes///////////////////////
const Education_AnimalsRoute = require("./routes/Education_AnimalsRoute");
const Education_CropsRoute = require("./routes/Education_CropsRoute");
const Education_QuestionsRoute = require("./routes/Education_QuestionsRoute");
const Education_QuizzesRoute = require("./routes/Education_QuizzesRoute");
const Education_RepliesRoute = require("./routes/Education_RepliesRoute");
const Education_UserProgressRoute = require("./routes/Education_UserProgressRoute");
const Education_VideosRoute = require("./routes/Education_VideosRoute");
const Education_AdditionalVideosRoute = require("./routes/Education_AdditionalVideosRoute");
const Education_QuestionsAndAnswersRoute = require("./routes/Education_QuestionsAndAnswersRoute");

////////////////////////////////End of Education Routes///////////////////////

const app = express();
const port = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
const profilesDir = path.join(uploadsDir, "profiles");
const commentsUploadsDir = path.join(uploadsDir, "comments");
const companyUploadsDir = path.join(uploadsDir, "company");

fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(profilesDir, { recursive: true });
fs.mkdirSync(commentsUploadsDir, { recursive: true });
fs.mkdirSync(companyUploadsDir, { recursive: true });

// Add this after your middleware setup
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Add error handling for multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File is too large. Maximum size is 5MB",
      });
    }
    return res.status(400).json({
      message: "File upload error",
      error: err.message,
    });
  }
  next(err);
});

// Routes
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/animals", animalGastonRoutes);
app.use("/api/pesticides", pesticideRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/cropsDetails", cropDetailsRoutes);
app.use("/api/animalDetails", animalDetailsRoutes);
app.use("/api/animal", animal);
app.use("/api/stock-statistics", stockStatisticsRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/suppliers", suppliersRoutes);

// New stock management routes
app.use("/api/stock/feed", stockFeedRoutes);
app.use("/api/stock/seeds", stockSeedsRoutes);
app.use("/api/stock/fertilizer", stockFertilizerRoutes);
app.use("/api/stock/equipment", stockEquipmentRoutes);
app.use("/api/stock/tools", stockToolsRoutes);
app.use("/api/stock/harvest", stockHarvestRoutes);

//Education Routes
app.use("/api/education/animals", Education_AnimalsRoute);
app.use("/api/education/crops", Education_CropsRoute);
app.use("/api/education/questions", Education_QuestionsRoute);
app.use("/api/education/quizzes", Education_QuizzesRoute);
app.use("/api/education/replies", Education_RepliesRoute);
app.use("/api/education/userProgress", Education_UserProgressRoute);
app.use("/api/education/videos", Education_VideosRoute);
app.use("/api/education/additionalVideos", Education_AdditionalVideosRoute);
app.use(
  "/api/education/questionsAndAnswers",
  Education_QuestionsAndAnswersRoute
);

//

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Test route for image serving

// Test image endpoint
app.get("/test-image", (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Image Test</h1>
        <img src="/uploads/test.jpg" style="max-width: 500px;" />
        <p>If you see the image above, your static file serving is working correctly.</p>
      </body>
    </html>
  `);
});

// Make uploads directory accessible
app.use("/uploads", express.static("uploads"));

app.listen(port, () => {
  // Server started successfully
});
