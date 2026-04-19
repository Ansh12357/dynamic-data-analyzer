const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const multer = require("multer");
const XLSX = require("xlsx");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder
app.use(express.static("public"));

// Multer setup
const upload = multer({ dest: "uploads/" });

// Model
const Data = require("./models/Data");

// HOME
app.get("/", (req, res) => {
  res.send("Dynamic Data Analyzer Running 🚀");
});


// ================= EXCEL UPLOAD =================
app.post("/upload", upload.single("file"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).send("No file uploaded ❌");
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];

    const sheetData =
      XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // old data clear (optional)
    await Data.deleteMany();

    await Data.insertMany(sheetData);

    res.send("Excel Uploaded & Data Saved ✅");

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// ================= GET DATA =================
app.get("/data", async (req, res) => {
  try {
    const data = await Data.find();
    res.json(data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


// ================= ANALYZE FIELDS =================
app.get("/analyze", async (req, res) => {
  try {

    const data = await Data.find().lean();

    if (!data.length) return res.json({ numeric: [], categorical: [] });

    const sample = data[0];

    let numeric = [];
    let categorical = [];

    for (let key in sample) {
      if (typeof sample[key] === "number") {
        numeric.push(key);
      } else {
        categorical.push(key);
      }
    }

    res.json({ numeric, categorical });

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// ================= DYNAMIC GRAPH =================
app.get("/dynamic-graph", async (req, res) => {
  try {

    const { xField, yField } = req.query;

    const result = await Data.aggregate([
      {
        $group: {
          _id: `$${xField}`,
          total: { $sum: `$${yField}` }
        }
      }
    ]);

    res.json(result);

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// ================= DELETE =================
app.delete("/delete/:id", async (req, res) => {
  try {

    await Data.findByIdAndDelete(req.params.id);
    res.send("Deleted ✅");

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// ================= DOWNLOAD EXCEL =================
app.get("/download-report", async (req, res) => {
  try {

    const data = await Data.find().lean();

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    const filePath = "report.xlsx";
    XLSX.writeFile(workbook, filePath);

    res.download(filePath);

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// ================= MONGODB =================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log(err.message));


// ================= SERVER =================
app.listen(5000, () => {
  console.log("Server running: http://localhost:5000 🚀");
});