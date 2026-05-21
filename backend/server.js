require("dotenv").config();

const cors = require("cors");
const express = require("express");
const path = require("path");

const applyRoutes = require("./routes/apply");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(cors());
app.use(express.json());

// Serve the frontend from the dedicated folder.
app.use(express.static(path.join(__dirname, "../frontend")));

// Serve local resumes statically (fallback system)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount API routes
app.use("/api", applyRoutes);
app.use("/api", adminRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});