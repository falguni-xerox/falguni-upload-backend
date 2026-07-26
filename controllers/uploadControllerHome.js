// ------------------------------------
// Home API
// ------------------------------------

exports.home = (req,res)=>{

    res.json({

        success:true,

        message:
        "Falguni Upload Portal V2 API Running",

        endpoints:{

            upload:
            "POST /upload",

            orders:
            "GET /upload/files",

            download:
            "GET /upload/download/:jobId/:fileName",

            zip:
            "POST /upload/download-zip",

            delete:
            "DELETE /upload/order/:jobId"

        }

    });

};




// ------------------------------------
// 404 Handler
// ------------------------------------

exports.notFound=(req,res)=>{


    res.status(404).json({

        success:false,

        message:
        "Route not found."

    });


};