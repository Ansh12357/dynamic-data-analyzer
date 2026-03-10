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

// Import Model
const Data = require("./models/Data");


// HOME ROUTE
app.get("/", (req, res) => {
  res.send("Server + MongoDB Running 🚀");
});


// UPLOAD PAGE
app.get("/upload", (req, res) => {
  res.send(`
    <h2>Upload Excel File</h2>
    <form action="/upload" method="POST" enctype="multipart/form-data">
      <input type="file" name="file" required/>
      <button type="submit">Upload</button>
    </form>
  `);
});


// ADD DATA
app.post("/add", async (req, res) => {
  try {

    const newData = new Data(req.body);
    await newData.save();

    res.send("Data Saved ✅");

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// GET ALL DATA
app.get("/data", async (req, res) => {
  try {

    const data = await Data.find();
    res.json(data);

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// TEST DATA
app.get("/test-add", async (req, res) => {
  try {

    const newData = new Data({
      name: "Ansh",
      email: "ansh@gmail.com",
      sales: 7000,
      city: "Gurgaon"
    });

    await newData.save();

    res.send("Test Data Saved ✅");

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// EXCEL UPLOAD
app.post("/upload", upload.single("file"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).send("No file uploaded ❌");
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];

    const sheetData =
      XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    await Data.insertMany(sheetData);

    res.send("Excel Data Uploaded & Saved ✅");

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// TOTAL SALES
app.get("/total-sales", async (req, res) => {
  try {

    const data = await Data.find();

    const total = data.reduce((sum, item) => {
      return sum + item.sales;
    }, 0);

    res.json({ totalSales: total });

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// TOP SALES PERSON
app.get("/top-sales", async (req, res) => {
  try {

    const top = await Data.findOne().sort({ sales: -1 });

    res.json(top);

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// CITY SALES GRAPH
app.get("/city-sales", async (req, res) => {
  try {

    const result = await Data.aggregate([
      {
        $group: {
          _id: "$city",
          totalSales: { $sum: "$sales" }
        }
      }
    ]);

    res.json(result);

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// DELETE DATA
app.delete("/delete/:id", async (req, res) => {
  try {

    await Data.findByIdAndDelete(req.params.id);

    res.send("Data Deleted Successfully ✅");

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// UPDATE DATA
app.put("/update/:id", async (req, res) => {
  try {

    const updated = await Data.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// DOWNLOAD EXCEL REPORT
app.get("/download-report", async (req, res) => {
  try {

    const data = await Data.find().lean();

    const cleanData = data.map(item => ({
      name: item.name,
      email: item.email,
      sales: item.sales,
      city: item.city
    }));

    const worksheet =
      XLSX.utils.json_to_sheet(cleanData);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Sales Report"
    );

    const filePath = "sales-report.xlsx";

    XLSX.writeFile(workbook, filePath);

    res.download(filePath);

  } catch (error) {
    res.status(500).send(error.message);
  }
});


// MONGODB CONNECTION
mongoose.connect(process.env.MONGO_URI)
.then(() => {

  console.log("MongoDB Connected ✅");

})
.catch((err) => {

  console.log("Mongo Error:", err.message);

});


// SERVER START
app.listen(5000, () => {

  console.log("Server running on http://localhost:5000 🚀");

});