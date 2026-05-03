require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const noteRoutes = require("./routes/noteRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/notes", noteRoutes);

// DB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected Successfully"))
  .catch(err => console.error(err));

// Root
app.get("/", (req, res) => {
  res.send("API Running");
});

// Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});