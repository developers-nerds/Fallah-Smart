const { Sequelize, DataTypes } = require("sequelize")
require("dotenv").config()
const connection = new Sequelize(process.env.DATABASE, process.env.USER, process.env.PASSWORD, {
    host: process.env.HOST,
    dialect: "mysql",
  });
  connection
  .authenticate()
  .then(() => {
    console.log("db is connected");
  })
  .catch((err) => {
    throw err;
  });
  const db={}


   // connection
  // .sync({ force: true })
  // .then(() => console.log("tables are created"))
  // .catch((err) => {
  //   throw err;
  // });
  module.exports=db