require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Route imports
const animalGastonRoutes = require("./routes/animalGastonRoutes");
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require("./routes/transactionRoutes");
const userRoutes = require("./routes/userRoutes");
const stockRoutes = require("./routes/stockRoutes");
const pesticideRoutes = require('./routes/pesticideRoutes');
const blogRoutes = require("./routes/blogRoutes");
const scanRoutes = require("./routes/scanRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const accountRoutes = require("./routes/accountRoutes");
const cropRoutes = require("./routes/crops");
const cropDetailsRoutes = require("./routes/cropsDetails");
const animalRoutes = require("./routes/animalRoutes");
const animalDetailsRoutes = require("./routes/animalsDetails");
const animal = require("./routes/animal");
const stockStatisticsRoutes = require("./routes/stockStatisticsRoutes");

const app = express();
const port = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const profilesDir = path.join(uploadsDir, 'profiles');
const commentsUploadsDir = path.join(uploadsDir, 'comments');

fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(profilesDir, { recursive: true });
fs.mkdirSync(commentsUploadsDir, { recursive: true });

// Add this after your middleware setup
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Add error handling for multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File is too large. Maximum size is 5MB'
      });
    }
    return res.status(400).json({
      message: 'File upload error',
      error: err.message
    });
  }
  next(err);
});

// Routes
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/animals", animalGastonRoutes);
app.use('/api/pesticides', pesticideRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/cropsDetails", cropDetailsRoutes);
app.use("/api/animalDetails", animalDetailsRoutes);
app.use("/api/animal", animal);
app.use("/api/stock-statistics", stockStatisticsRoutes);
app.use("/api/categories", categoryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Test route for image serving
app.get('/test-image', (req, res) => {
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
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});