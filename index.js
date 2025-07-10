const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectToDatabase } = require("./db/connect");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Sample Route
app.get("/", (req, res) => {
  res.send("FitNexus Server Running...");
});

// Import routes
app.use("/api/users", require("./routes/user.routes"));

// Start Server
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
  });
});
