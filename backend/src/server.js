const express = require("express");
const app = express();
const port = 5000;
const cors = require("cors")();
const userRoutes= require("./routes/userRoutes");

app.use(cors);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/api/users", userRoutes);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
