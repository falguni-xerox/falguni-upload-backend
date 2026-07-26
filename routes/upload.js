const express = require("express");
const router = express.Router();

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const archiver = require("archiver");


// ------------------------------------
// Upload Root
// ------------------------------------

const UPLOAD_ROOT = path.join(
    __dirname,
    "..",
    "uploads"
);

const META_FILE = path.join(
    UPLOAD_ROOT,
    "files.json"
);


// Create Upload Folder

if (!fs.existsSync(UPLOAD_ROOT)) {

    fs.mkdirSync(
        UPLOAD_ROOT,
        {
            recursive: true
        }
    );

}


// ------------------------------------
// Metadata Helpers
// ------------------------------------

function loadMetadata() {

    try {

        if (!fs.existsSync(META_FILE)) {

            fs.writeFileSync(
                META_FILE,
                "[]"
            );

        }


        return JSON.parse(
            fs.readFileSync(
                META_FILE,
                "utf8"
            )
        );


    } catch (err) {

        console.error(
            "Metadata Read Error:",
            err
        );

        return [];

    }

}



function saveMetadata(data) {

    try {

        fs.writeFileSync(

            META_FILE,

            JSON.stringify(
                data,
                null,
                2
            )

        );


    } catch (err) {

        console.error(
            "Metadata Save Error:",
            err
        );

    }

}


// ------------------------------------
// Generate Order ID
// ------------------------------------

function generateJobId() {


    const now = new Date();


    const yyyy =
        now.getFullYear();


    const mm =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const dd =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    const date =
        `${yyyy}${mm}${dd}`;


    const metadata =
        loadMetadata();



    const todayOrders =
        metadata.filter(
            item =>
                item.jobId &&
                item.jobId.startsWith(
                    `ORD-${date}`
                )
        );



    const number =
        String(
            todayOrders.length + 1
        ).padStart(
            3,
            "0"
        );


    return `ORD-${date}-${number}`;

}



// ------------------------------------
// Multer Storage
// ------------------------------------

const storage = multer.diskStorage({


    destination(req, file, cb) {


        // Create one Order ID
        // for complete upload batch

        if (!req.jobId) {

            req.jobId =
                generateJobId();

        }



        const orderFolder =
            path.join(
                UPLOAD_ROOT,
                req.jobId
            );



        if (!fs.existsSync(orderFolder)) {

            fs.mkdirSync(
                orderFolder,
                {
                    recursive:true
                }
            );

        }



        cb(
            null,
            orderFolder
        );


    },



    filename(req, file, cb) {


        const ext =
            path.extname(
                file.originalname
            );


        const uniqueName =

            Date.now()
            +
            "-"
            +
            Math.floor(
                Math.random() * 1000000
            )
            +
            ext;



        cb(
            null,
            uniqueName
        );


    }


});



// ------------------------------------
// Multer Upload
// ------------------------------------

const upload = multer({

    storage,

    limits: {

        fileSize:
            100 * 1024 * 1024

    }

});



// ------------------------------------
// Root API
// ------------------------------------

router.get("/", (req,res)=>{


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


});




// ------------------------------------
// Upload Files
// ------------------------------------

router.post(

"/",


(req,res,next)=>{


    upload.array(
        "files",
        100
    )
    (req,res,function(err){



        if(err instanceof multer.MulterError){


            return res.status(400)
            .json({

                success:false,

                message:
                    err.message

            });


        }



        if(err){


            return res.status(500)
            .json({

                success:false,

                message:
                    err.message

            });


        }



        next();



    });


},



(req,res)=>{


    try{


        if(!req.files ||
           req.files.length===0){


            return res.status(400)
            .json({

                success:false,

                message:
                    "No files uploaded."

            });


        }



        let metadata =
            loadMetadata();



        const uploadedFiles=[];



        for(const file of req.files){



            const item={


                id:
                    Date.now()
                    +
                    Math.floor(
                        Math.random()*10000
                    ),


                jobId:
                    req.jobId,


                displayName:
                    file.originalname,


                storedName:
                    file.filename,


                size:
                    file.size,


                mimetype:
                    file.mimetype,


                uploadedAt:
                    new Date()
                    .toISOString()


            };



            metadata.push(item);

            uploadedFiles.push(item);



        }



        saveMetadata(metadata);



res.json({


    success:true,


    orderNumber:
        req.jobId,


    jobId:
        req.jobId,


    displayTime:
        900,


    message:
        `${uploadedFiles.length} file(s) uploaded successfully.`,


    count:
        uploadedFiles.length,


    files:
        uploadedFiles


});


    }
    catch(err){


        console.error(err);


        res.status(500)
        .json({

            success:false,

            message:
                "Upload failed."

        });


    }



});

// ------------------------------------
// Safe File Path
// ------------------------------------

function getSafeFilePath(jobId, fileName) {


    const safeJob =
        path.basename(jobId);


    const safeFile =
        path.basename(fileName);



    const fullPath =
        path.join(
            UPLOAD_ROOT,
            safeJob,
            safeFile
        );



    if (!fullPath.startsWith(UPLOAD_ROOT)) {

        return null;

    }



    return fullPath;


}



// ------------------------------------
// GET /upload/files
// Order Wise Files
// ------------------------------------

router.get("/files", (req,res)=>{


    try{


        let metadata =
            loadMetadata();



        // Remove missing files

        metadata =
            metadata.filter(item=>{


                const filePath =
                    getSafeFilePath(
                        item.jobId,
                        item.storedName
                    );


                return (
                    filePath &&
                    fs.existsSync(filePath)
                );


            });



        saveMetadata(metadata);



        const orders = {};



        metadata.forEach(file=>{


            if(!orders[file.jobId]){


                orders[file.jobId]={


                    jobId:
                        file.jobId,


                    uploadedAt:
                        file.uploadedAt,


                    files:[]


                };


            }



            orders[file.jobId]
            .files
            .push({


                id:
                    file.id,


                displayName:
                    file.displayName,


                storedName:
                    file.storedName,


                mimetype:
                    file.mimetype,


                size:
                    file.size,


                sizeKB:
                    +(file.size / 1024)
                    .toFixed(2),



                downloadUrl:

                    `/upload/download/${encodeURIComponent(file.jobId)}/${encodeURIComponent(file.storedName)}`



            });



        });



        const orderList =
            Object.values(orders);



        res.json({


            success:true,


            count:
                orderList.length,


            orders:
                orderList


        });



    }
    catch(err){


        console.error(
            "Files Error:",
            err
        );


        res.status(500)
        .json({

            success:false,

            message:
                err.message

        });



    }



});



// ------------------------------------
// Download Single File
// ------------------------------------

router.get(
"/download/:jobId/:fileName",

(req,res)=>{


    try{


        const jobId =
            decodeURIComponent(
                req.params.jobId
            );


        const fileName =
            decodeURIComponent(
                req.params.fileName
            );



        const filePath =
            getSafeFilePath(
                jobId,
                fileName
            );



        if(
            !filePath ||
            !fs.existsSync(filePath)
        ){


            return res.status(404)
            .json({

                success:false,

                message:
                    "File not found."

            });


        }



        const metadata =
            loadMetadata();



        const fileInfo =
            metadata.find(
                x =>
                    x.jobId === jobId &&
                    x.storedName === fileName
            );



        res.download(

            filePath,


            fileInfo
            ?
            fileInfo.displayName
            :
            fileName

        );



    }
    catch(err){


        console.error(err);


        res.status(500)
        .json({

            success:false,

            message:
                err.message

        });



    }



});
// ------------------------------------
// POST /upload/download-zip
// Download Complete Order ZIP
// ------------------------------------

router.post("/download-zip", async (req,res)=>{


    try{


        const jobId =
            req.body.jobId;



        if(!jobId){


            return res.status(400)
            .json({

                success:false,

                message:
                    "Job ID required."

            });


        }



        const metadata =
            loadMetadata();



        const orderFiles =
            metadata.filter(
                file =>
                    file.jobId === jobId
            );



        if(orderFiles.length === 0){


            return res.status(404)
            .json({

                success:false,

                message:
                    "Order not found."

            });


        }



        res.setHeader(

            "Content-Type",

            "application/zip"

        );



        res.setHeader(

            "Content-Disposition",

            `attachment; filename="${jobId}.zip"`

        );



        const archive =
            archiver(
                "zip",
                {
                    zlib:{
                        level:9
                    }
                }
            );



        archive.on(
            "error",
            err=>{
                throw err;
            }
        );



        archive.pipe(res);



        for(const file of orderFiles){



            const filePath =
                getSafeFilePath(
                    file.jobId,
                    file.storedName
                );



            if(
                filePath &&
                fs.existsSync(filePath)
            ){


                archive.file(

                    filePath,

                    {
                        name:
                            file.displayName
                    }

                );


            }


        }



        await archive.finalize();



    }
    catch(err){


        console.error(
            "ZIP Error:",
            err
        );


        if(!res.headersSent){


            res.status(500)
            .json({

                success:false,

                message:
                    err.message

            });


        }


    }



});




// ------------------------------------
// DELETE Complete Order
// ------------------------------------

router.delete(
"/order/:jobId",

(req,res)=>{


    try{


        const jobId =
            decodeURIComponent(
                req.params.jobId
            );



        const orderFolder =
            path.join(
                UPLOAD_ROOT,
                path.basename(jobId)
            );



        if(
            fs.existsSync(orderFolder)
        ){


            fs.rmSync(

                orderFolder,

                {
                    recursive:true,
                    force:true
                }

            );


        }



        let metadata =
            loadMetadata();



        metadata =
            metadata.filter(

                file =>
                    file.jobId !== jobId

            );



        saveMetadata(metadata);



        res.json({

            success:true,

            message:
                "Order deleted successfully."

        });



    }
    catch(err){


        console.error(err);


        res.status(500)
        .json({

            success:false,

            message:
                err.message

        });


    }


});




// ------------------------------------
// 404
// ------------------------------------

router.use((req,res)=>{


    res.status(404)
    .json({

        success:false,

        message:
            "Route not found."

    });


});




// ------------------------------------
// Export
// ------------------------------------

module.exports = router;