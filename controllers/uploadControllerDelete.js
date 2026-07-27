const fs = require("fs");
const path = require("path");


const {

    UPLOAD_ROOT,

    META_FILE,

    loadMetadata,

    saveMetadata

} = require("../config/uploadConfig");




// ------------------------------------
// Delete Complete Order
// ------------------------------------

exports.deleteOrder = (req,res)=>{


try{


    const jobId =

    decodeURIComponent(

        req.params.jobId

    );


    // ------------------------------------
// Delete All Orders
// ------------------------------------

exports.deleteAllOrders = (req, res) => {

    try {

        // Delete all upload folders
        if (fs.existsSync(UPLOAD_ROOT)) {

            const folders = fs.readdirSync(UPLOAD_ROOT);

            for (const folder of folders) {

                fs.rmSync(
                    path.join(UPLOAD_ROOT, folder),
                    {
                        recursive: true,
                        force: true
                    }
                );

            }

        }

        // Clear metadata
        saveMetadata(
            META_FILE,
            []
        );

        res.json({

            success: true,

            message: "All orders deleted successfully."

        });

    }
    catch (err) {

        console.error(
            "Delete All Error:",
            err
        );

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};






    // Upload folder path

    const orderFolder =

    path.join(

        UPLOAD_ROOT,

        path.basename(jobId)

    );








    // Remove physical files

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









    // Remove metadata

    let metadata =

    loadMetadata(

        META_FILE

    );








    metadata =

    metadata.filter(file=>



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



    console.error(

        "Delete Error:",

        err

    );






    res.status(500).json({



        success:false,



        message:

        err.message



    });



}



};