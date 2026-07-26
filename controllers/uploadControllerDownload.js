const fs = require("fs");
const path = require("path");


const {

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
// Download Single File
// ------------------------------------

exports.downloadFile = (req,res)=>{


try{


    const jobId =

    decodeURIComponent(

        req.params.jobId

    );




    const storedName =

    decodeURIComponent(

        req.params.fileName

    );






    const filePath =

    getSafeFilePath(


        UPLOAD_ROOT,


        jobId,


        storedName



    );







    if(

        !filePath ||

        !fs.existsSync(filePath)

    ){


        return res.status(404).json({


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

    metadata.find(item=>



        item.jobId === jobId &&

        item.storedName === storedName



    );








    // -----------------------------
    // Update Download Status
    // -----------------------------


    if(fileInfo){



        fileInfo.downloaded = true;




        fileInfo.downloadCount =

        (

            fileInfo.downloadCount || 0

        )

        + 1;





        fileInfo.downloadedAt =

        new Date()

        .toISOString();







        saveMetadata(


            META_FILE,


            metadata


        );



    }








    // Original filename

    const originalName =

    fileInfo && fileInfo.displayName

    ?

    fileInfo.displayName

    :

    storedName;







    // Correct MIME

    const mimeType =

    fileInfo && fileInfo.mimetype

    ?

    fileInfo.mimetype

    :

    "application/octet-stream";








    res.setHeader(

        "Content-Type",

        mimeType

    );







    res.setHeader(

        "Content-Disposition",

        `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`

    );







    res.setHeader(

        "Cache-Control",

        "no-cache"

    );







    res.sendFile(

        path.resolve(filePath),

        err=>{


            if(err){

                console.error(

                    "Send File Error:",

                    err

                );

            }


        }

    );





}

catch(err){



    console.error(

        "Download Error:",

        err

    );





    res.status(500).json({



        success:false,



        message:

        err.message



    });



}



};









// ------------------------------------
// Download Complete ZIP
// ------------------------------------

exports.downloadZip = async(req,res)=>{


try{


    const jobId =

    req.body.jobId;






    if(!jobId){


        return res.status(400).json({


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

    metadata.filter(file=>

        file.jobId === jobId

    );








    if(

        orderFiles.length===0

    ){


        return res.status(404).json({


            success:false,


            message:

            "Order not found."


        });


    }









    // Mark ZIP Download


    metadata =

    metadata.map(file=>{



        if(

            file.jobId === jobId

        ){



            file.downloaded = true;




            file.downloadCount =

            (

                file.downloadCount || 0

            )

            + 1;





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


        res.status(500).json({


            success:false,


            message:

            err.message



        });


    }



}



};