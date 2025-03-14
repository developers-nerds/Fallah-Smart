require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require('path');

// Route imports
const animalGastonRoutes = require("./routes/animalGastonRoutes");
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require("./routes/transactionRoutes");
const userRoutes = require("./routes/userRoutes");
const stockRoutes = require("./routes/stockRoutes");
const pesticideRoutes = require("./routes/pesticideRoutes");
const blogRoutes = require("./routes/blogRoutes");
const scanRoutes = require("./routes/scanRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const accountRoutes = require("./routes/accountRoutes");
const cropRoutes = require("./routes/crops");
const cropDetailsRoutes = require("./routes/cropsDetails");
const animalRoutes = require("./routes/animalRoutes");
const animalDetailsRoutes = require("./routes/animalsDetails");
const animal = require("./routes/animal");
const stockStatisticsRoutes = require("./routes/stockStatisticsRoutes");


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

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/animals", animalGastonRoutes);
app.use('/api/pesticides', pesticideRoutes);
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


///////////////////////Education Routes///////////////////////
app.use("/api/education/animals", Education_AnimalsRoute);
app.use("/api/education/crops", Education_CropsRoute);
app.use("/api/education/questions", Education_QuestionsRoute);
app.use("/api/education/quizzes", Education_QuizzesRoute);
app.use("/api/education/replies", Education_RepliesRoute);
app.use("/api/education/userProgress", Education_UserProgressRoute);
app.use("/api/education/videos", Education_VideosRoute);
app.use("/api/education/additionalVideos", Education_AdditionalVideosRoute);
app.use("/api/education/questionsAndAnswers", Education_QuestionsAndAnswersRoute);






// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
