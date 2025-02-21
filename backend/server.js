const express = require("express");
const cors = require("cors");
const App = express();
const port = process.env.PORT || 5000
const db=require("./models/index")

App.use(cors())
App.use(express.json());
App.use(express.urlencoded({ extended: true }));





App.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
