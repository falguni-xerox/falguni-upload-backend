const multer = require("multer");


const {

    upload,

    META_FILE,

    loadMetadata,

    saveMetadata

} = require("../config/uploadConfig");





// ------------------------------------
// Upload Files
// ------------------------------------

exports.uploadFiles = [



(req,res,next)=>{


    upload.array(

        "files",

        100

    )

    (req,res,function(err){



        if(err instanceof multer.MulterError){


            return res.status(400).json({


                success:false,


                message:err.message


            });


        }





        if(err){


            return res.status(500).json({


                success:false,


                message:err.message


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


        return res.status(400).json({


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






            // ORIGINAL NAME

            displayName:

            file.originalname,







            // SERVER STORED NAME

            storedName:

            file.filename,







            size:

            file.size,






            mimetype:

            file.mimetype,







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



    console.error(

        "Upload Error:",

        err

    );




    res.status(500).json({



        success:false,



        message:

        "Upload failed."



    });



}



}



];
