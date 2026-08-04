const shopConfig = require("./config/shopConfig");
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

    "https://upload.falgunixerox.in",

    "https://falguni-upload-frontend.vercel.app",

    "http://localhost:5500",

    "http://127.0.0.1:5500"

];


app.use(cors({

    origin:function(origin,callback){


        // Allow Postman / direct API

        if(!origin){

            return callback(null,true);

        }



        if(
            allowedOrigins.includes(origin)
        ){

            return callback(null,true);

        }



        console.log(
            "CORS BLOCKED:",
            origin
        );


        return callback(null,false);


    },


    methods:[

        "GET",
        "POST",
        "DELETE",
        "OPTIONS"

    ],


    allowedHeaders:[

        "Content-Type",
        "Authorization"

    ],


    // IMPORTANT FOR DOWNLOAD FILENAME

    exposedHeaders:[

        "Content-Disposition"

    ],


    credentials:true


}));




// ======================================
// BODY PARSER
// ======================================

app.use(
    express.json()
);


app.use(
    express.urlencoded({

        extended:true

    })
);




// ======================================
// STATIC FRONTEND
// ======================================

app.use(
    express.static(
        path.join(__dirname,"../Frontend")
    )
);




// ======================================
// FRONTEND PAGES
// ======================================

app.get("/",(req,res)=>{

    res.sendFile(

        path.join(
            __dirname,
            "../Frontend/index.html"
        )

    );

});



app.get("/admin",(req,res)=>{

    res.sendFile(

        path.join(
            __dirname,
            "../Frontend/admin.html"
        )

    );

});




// ======================================
// API ROUTES
// ======================================

app.use(
    "/upload",
    uploadRoute
);




// ======================================
// HEALTH CHECK
// ======================================

app.get("/health",(req,res)=>{


    res.json({

        success:true,

        message:"Backend Running"

    });


});




// ======================================
// 404 HANDLER
// ======================================

app.use((req,res)=>{


    res.status(404).json({

        success:false,

        message:"Route Not Found"

    });


});




// ======================================
// ERROR HANDLER
// ======================================

app.use((err,req,res,next)=>{


    console.error(
        "SERVER ERROR:",
        err
    );


    res.status(500).json({

        success:false,

        message:"Internal Server Error"

    });


});




// ======================================
// START SERVER
// ======================================

const PORT =
process.env.PORT || 10000;


app.listen(
    PORT,
    "0.0.0.0",
    ()=>{


        console.log("------------------------------------");

        console.log(
            `Server Running : ${PORT}`
        );

        console.log("------------------------------------");


    }
);
// Shop Info API
app.get("/api/shop-info", (req, res) => {
  res.json(shopConfig);
});