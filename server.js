const express = require("express");
const cors = require("cors");
const path = require("path");

const uploadRoute = require("./routes/upload");

const app = express();


// ======================================
// CORS CONFIG
// ======================================

const allowedOrigins = [

    "https://falgunixerox.in",

    "https://www.falgunixerox.in",

    "https://falguni-upload-frontend.vercel.app",

    "http://localhost:5500",

    "http://127.0.0.1:5500"

];


const corsOptions = {

    origin: function (origin, callback) {


        // Allow Postman / Server requests
        if (!origin) {

            return callback(null, true);

        }


        if (allowedOrigins.includes(origin)) {

            return callback(null, true);

        }


        console.log("Blocked CORS:", origin);

        return callback(null, false);


    },


    methods: [

        "GET",
        "POST",
        "DELETE",
        "OPTIONS"

    ],


    allowedHeaders: [

        "Content-Type"

    ],


    credentials: true

};



app.use(cors(corsOptions));


// Preflight request
app.options("*", cors(corsOptions));




// ======================================
// BODY PARSER
// ======================================


app.use(express.json());

app.use(express.urlencoded({

    extended: true

}));




// ======================================
// STATIC FRONTEND
// ======================================


app.use(express.static(

    path.join(__dirname, "../Frontend")

));




// ======================================
// HOME
// ======================================


app.get("/", (req, res) => {


    res.sendFile(

        path.join(__dirname, "../Frontend/index.html")

    );


});




// ======================================
// ADMIN PAGE
// ======================================


app.get("/admin", (req, res) => {


    res.sendFile(

        path.join(__dirname, "../Frontend/admin.html")

    );


});




// ======================================
// UPLOAD ROUTES
// ======================================


app.use("/upload", uploadRoute);




// ======================================
// DIRECT FILE ROUTE SUPPORT
// ======================================

// /files support
app.get("/files", (req, res) => {


    res.redirect("/upload/files");


});



// /download support
app.get("/download/:file", (req, res) => {


    res.redirect(

        `/upload/download/${req.params.file}`

    );


});




// ======================================
// HEALTH CHECK
// ======================================


app.get("/health", (req, res) => {


    res.json({

        success: true,

        message: "Backend Running"

    });


});




// ======================================
// ERROR HANDLER
// ======================================


app.use((err, req, res, next) => {


    console.error(err);


    res.status(500).json({

        success:false,

        message:"Server Error"

    });


});




// ======================================
// START SERVER
// ======================================


const PORT = process.env.PORT || 10000;


app.listen(PORT, "0.0.0.0", () => {


    console.log("------------------------------------");

    console.log(`Server Running : ${PORT}`);

    console.log("------------------------------------");


});