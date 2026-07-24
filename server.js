const express = require("express");
const cors = require("cors");
const path = require("path");

const uploadRoute = require("./routes/upload");

const app = express();


// Middleware
app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// Static Files
app.use(express.static(path.join(__dirname, "../Frontend")));


// Customer Upload Page
app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "../Frontend/index.html")
    );

});


// Admin Dashboard
app.get("/admin", (req, res) => {

    res.sendFile(
        path.join(__dirname, "../Frontend/admin.html")
    );

});


// Upload Routes
app.use("/upload", uploadRoute);


// Start Server
const PORT = process.env.PORT || 5000;


app.listen(PORT, "0.0.0.0", () => {

    console.log("====================================");
    console.log(`✅ Server Running : Port ${PORT}`);
    console.log(`👤 Customer Page : /`);
    console.log(`🛠 Admin Panel   : /admin`);
    console.log("====================================");

});