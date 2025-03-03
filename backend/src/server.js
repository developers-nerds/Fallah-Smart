require('dotenv').config();
const express = require("express");
require("dotenv").config();
const app = express();
const port = 5000;
const cors = require("cors");
const path = require('path');
const blogRoutes = require("./routes/blogRoutes");
const userRoutes = require("./routes/userRoutes");
const scanRoutes = require("./routes/scanRoutes");
const conversationRoutes = require("./routes/conversationRoutes");

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/blog", blogRoutes);

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

app.use("/api/scans", scanRoutes);
app.use("/api/conversations", conversationRoutes);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
