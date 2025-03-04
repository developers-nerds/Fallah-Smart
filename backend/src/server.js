require('dotenv').config();
const express = require("express");
const stockRoutes = require("./routes/stockRoutes");
// const animalRoutes = require("./routes/animalRoutes");
const pesticideRoutes = require('./routes/pesticideRoutes');
const app = express();
const port = process.env.Port;
const cors = require("cors");
const path = require('path');
const blogRoutes = require("./routes/blogRoutes");
const userRoutes = require("./routes/userRoutes");
const scanRoutes = require("./routes/scanRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const cropRoutes = require("./routes/crops");
const cropDetailsRoutes = require("./routes/cropsDetails");
const animalDetailsRoutes = require("./routes/animalsDetails");
const animal = require("./routes/animal");



// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/stocks", stockRoutes);
// app.use("/api/animals", animalRoutes);
app.use('/api/pesticides', pesticideRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/cropsDetails", cropDetailsRoutes);
app.use("/api/animalDetails", animalDetailsRoutes);
app.use("/api/animal", animal);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});