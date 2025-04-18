require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { startNotificationCron } = require('./cron/notificationCron');

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
const crop=require("./routes/crops")
const cropDetailsRoutes = require("./routes/cropsDetails");
const animalRoutes = require("./routes/animalRoutes");
const animalDetailsRoutes = require("./routes/animalsDetails");
const animal = require("./routes/animal");
const stockStatisticsRoutes = require("./routes/stockStatisticsRoutes");
const suppliersRoutes = require("./routes/suppliersRoutes");
const aiRoutes = require("./routes/aiRoutes");
const phoneAuthRoutes = require("./routes/phoneAuthRoutes");

const verificationRoutes = require("./routes/verificationRoutes");
// New stock management routes
const stockFeedRoutes = require("./routes/stockFeedRoutes");
const stockSeedsRoutes = require("./routes/stockSeedsRoutes");
const stockFertilizerRoutes = require("./routes/stockFertilizerRoutes");
const stockEquipmentRoutes = require("./routes/stockEquipmentRoutes");
const stockToolsRoutes = require("./routes/stockToolsRoutes");
const stockHarvestRoutes = require("./routes/stockHarvestRoutes");
const stockDashboardRoutes = require("./routes/stockDashboardRoutes");

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

const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const port = process.env.PORT || 5000;
const host = process.env.HOST || 'localhost'; 

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from these origins
    const allowedOrigins = [  
      'http://localhost:5174',
       'http://localhost:5173',
      'http://localhost:3000',     // React dev server
      'http://localhost:8081',     // Possible alternative port 
      'http://localhost:5000'      // Same origin
    ];

    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow credentials (cookies, auth headers)
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply CORS with options
app.use(cors(corsOptions));

// Middleware
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
    console.error('Multer error:', err);
    
    // Handle specific Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File is too large. Maximum size is 5MB',
        error: err.message,
        code: err.code
      });
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected field in form submission. Please check your form field names.',
        error: err.message,
        code: err.code,
        field: err.field
      });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files uploaded',
        error: err.message,
        code: err.code
      });
    }
    
    // Generic multer error handler
    return res.status(400).json({
      message: 'File upload error',
      error: err.message,
      code: err.code
    });
  }
  
  // For other errors, continue to the next error handler
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
app.use("/api/crop", crop);
app.use("/api/cropsDetails", cropDetailsRoutes);
app.use("/api/animalDetails", animalDetailsRoutes);
app.use("/api/animal", animal);
app.use("/api/stock-statistics", stockStatisticsRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/phone-auth", phoneAuthRoutes);

// New stock management routes
app.use("/api/stock/feed", stockFeedRoutes);
app.use("/api/stock/seeds", stockSeedsRoutes);
app.use("/api/stock/fertilizer", stockFertilizerRoutes);
app.use("/api/stock/equipment", stockEquipmentRoutes);
app.use("/api/stock/tools", stockToolsRoutes);
app.use("/api/stock/harvest", stockHarvestRoutes);
app.use("/api/stock-dashboard", stockDashboardRoutes);

//Education Routes
app.use("/api/education/animals", Education_AnimalsRoute);
app.use("/api/education/crops", Education_CropsRoute);
app.use("/api/education/questions", Education_QuestionsRoute);
app.use("/api/education/quizzes", Education_QuizzesRoute);
app.use("/api/education/replies", Education_RepliesRoute);
app.use("/api/education/userProgress", Education_UserProgressRoute);
app.use("/api/education/videos", Education_VideosRoute);
app.use("/api/education/additionalVideos", Education_AdditionalVideosRoute);
app.use("/api/education/questionsAndAnswers", Education_QuestionsAndAnswersRoute);

// Notification routes
app.use('/api/stock/notifications', notificationRoutes);
// Import the Education Chat routes
const EducationChatRoute = require("./routes/Educationchat");
app.use("/api/verification", verificationRoutes);

// Use the Education Chat routes
app.use("/api/education/chat", EducationChatRoute);

// Import all routes
// const Education_QuestionRoute = require('./routes/Education_QuestionAndAnswerRoute');
// const Education_RepliesRoute = require('./routes/Education_RepliesRoute');
const Education_LikesRoute = require("./routes/Education_LikesRoute");

// Use all routes
// app.use('/api/education/qna', Education_QuestionRoute);
// app.use('/api/education/replies', Education_RepliesRoute);
app.use("/api/education/likes", Education_LikesRoute);

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

// Start cron jobs
startNotificationCron();

// Validate required environment variables
if (!process.env.FCM_SERVER_KEY) {
  console.warn('FCM_SERVER_KEY environment variable is not set! Push notifications via FCM will not work.');
} else {
  console.log('FCM_SERVER_KEY is configured, push notifications should work.');
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API available at http://${host}:${port}/api`);
  console.log(`Database connected to ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT}`);
});
