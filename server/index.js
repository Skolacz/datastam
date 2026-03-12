require("dotenv").config();

const express = require("express");
const app = express();

app.use(express.json());

// Load routes
const apiRoutes = require("./api");
app.use("/api", apiRoutes);

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
