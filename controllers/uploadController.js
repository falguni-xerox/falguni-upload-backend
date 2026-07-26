const fs = require("fs");
const path = require("path");
const multer = require("multer");

const {
    upload,
    UPLOAD_ROOT,
    META_FILE,
    loadMetadata,
    saveMetadata
} = require("../config/uploadConfig");

const {
    getSafeFilePath
} = require("../utils/fileHelper");

const {
    createZip
} = require("../utils/zipHelper");


// ------------------------------------
// Home API
// ------------------------------------

exports.home = (req, res) => {

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
// Upload Files
// ------------------------------------

exports.uploadFiles = [

(req,res,next)=>{


    upload.array(
        "files",
        100
    )(req,res,function(err){


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


    if(
        !req.files ||
        req.files.length===0
    ){

        return res.status(400)
        .json({

            success:false,

            message:
                "No files uploaded."

        });

    }



    let metadata =
        loadMetadata(
            META_FILE
        );



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


            // NEW

            downloaded:false,


            downloadCount:0,


            downloadedAt:null,


            uploadedAt:
                new Date()
                .toISOString()


        };



        metadata.push(item);


        uploadedFiles.push(item);



    }



    saveMetadata(

        META_FILE,

        metadata

    );



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


}

];
// ------------------------------------
// GET /upload/files
// Order Wise Files
// ------------------------------------

exports.getFiles = (req, res) => {

try {


    let metadata =
        loadMetadata(
            META_FILE
        );


    // Remove Missing Files

    metadata =
        metadata.filter(item=>{


            const filePath =
                getSafeFilePath(

                    UPLOAD_ROOT,

                    item.jobId,

                    item.storedName

                );


            return (

                filePath &&

                fs.existsSync(filePath)

            );


        });



    saveMetadata(

        META_FILE,

        metadata

    );



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
                +(
                    file.size / 1024
                ).toFixed(2),



            downloadUrl:

                `/upload/download/${encodeURIComponent(file.jobId)}/${encodeURIComponent(file.storedName)}`,



            // NEW STATUS

            downloaded:

                file.downloaded || false,


            downloadCount:

                file.downloadCount || 0,


            downloadedAt:

                file.downloadedAt || null



        });



    });



    const orderList =
        Object.values(
            orders
        );



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



};



// ------------------------------------
// Download Single File
// ------------------------------------

exports.downloadFile = (req,res)=>{

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

            UPLOAD_ROOT,

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



    let metadata =
        loadMetadata(
            META_FILE
        );



    const fileInfo =
        metadata.find(


            item =>


                item.jobId === jobId &&


                item.storedName === fileName



        );



    // -----------------------------
    // DOWNLOAD STATUS UPDATE
    // -----------------------------


    if(fileInfo){


        fileInfo.downloaded =
            true;



        fileInfo.downloadCount =
            (
                fileInfo.downloadCount || 0
            ) + 1;



        fileInfo.downloadedAt =

            new Date()
            .toISOString();



        saveMetadata(

            META_FILE,

            metadata

        );


    }




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


};
// ------------------------------------
// Download Complete Order ZIP
// ------------------------------------

exports.downloadZip = async (req,res)=>{

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



    let metadata =
        loadMetadata(
            META_FILE
        );



    const orderFiles =
        metadata.filter(

            file =>

                file.jobId === jobId

        );



    if(
        orderFiles.length === 0
    ){


        return res.status(404)
        .json({

            success:false,

            message:
                "Order not found."

        });


    }



    // --------------------------------
    // Mark ZIP Download Status
    // --------------------------------


    metadata =
        metadata.map(file=>{


            if(file.jobId === jobId){


                file.downloaded =
                    true;


                file.downloadCount =

                    (
                        file.downloadCount || 0
                    )
                    +
                    1;



                file.downloadedAt =

                    new Date()
                    .toISOString();


            }


            return file;


        });



    saveMetadata(

        META_FILE,

        metadata

    );



    await createZip(


        res,


        jobId,


        orderFiles,


        getSafeFilePath,


        UPLOAD_ROOT



    );



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


};



// ------------------------------------
// Delete Complete Order
// ------------------------------------

exports.deleteOrder = (req,res)=>{


try{


    const jobId =
        decodeURIComponent(

            req.params.jobId

        );



    const orderFolder =
        path.join(

            UPLOAD_ROOT,

            path.basename(
                jobId
            )

        );



    if(
        fs.existsSync(
            orderFolder
        )
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
        loadMetadata(

            META_FILE

        );



    metadata =
        metadata.filter(

            file =>

                file.jobId !== jobId

        );



    saveMetadata(

        META_FILE,

        metadata

    );



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



};



// ------------------------------------
// 404 Handler
// ------------------------------------

exports.notFound = (req,res)=>{


    res.status(404)
    .json({

        success:false,

        message:
            "Route not found."

    });


};