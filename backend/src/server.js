require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require('path');
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

const app = express();
const port = process.env.PORT; // Using uppercase PORT as it's more common in environment variables

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/pesticides", pesticideRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/cropsDetails", cropDetailsRoutes);
app.use("/api/animalDetails", animalDetailsRoutes);
app.use("/api/animal", animal);
// Uncomment if you want to use this route
// app.use("/api/animals", animalRoutes);
app.use('/api/categories', categoryRoutes);
// Test image endpoint
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