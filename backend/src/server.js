const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT;
const cors = require("cors")();
const userRoutes = require("./routes/userRoutes");
const scanRoutes = require("./routes/scanRoutes");

app.use(cors);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/scans", scanRoutes);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
