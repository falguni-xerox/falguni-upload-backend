const fs = require("fs");
const path = require("path");
const multer = require("multer");


const {
    UPLOAD_ROOT
} = require("./pathConfig");


const {
    generateJobId
} = require("./jobConfig");




// ------------------------------------
// Multer Storage
// ------------------------------------

const storage = multer.diskStorage({



destination(req,file,cb){



if(!req.jobId){


    req.jobId =

        generateJobId();



    console.log(

        "NEW JOB ID:",

        req.jobId

    );


}





const orderFolder =

path.join(

    UPLOAD_ROOT,

    req.jobId

);





if(
!fs.existsSync(orderFolder)
){


    fs.mkdirSync(

        orderFolder,

        {
            recursive:true
        }

    );


}





console.log(

    "UPLOAD FOLDER:",

    orderFolder

);





cb(

    null,

    orderFolder

);



},






filename(req,file,cb){



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

Math.random()*1000000

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
// Upload Middleware
// ------------------------------------

const upload = multer({



storage,



limits:{


fileSize:

100 * 1024 * 1024


}



});







module.exports = {


    upload


};