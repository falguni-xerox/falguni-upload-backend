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



console.log(
"========== MULTER START =========="
);



console.log(
"BEFORE JOB ID:",
req.jobId
);





if(!req.jobId){


req.jobId =
generateJobId();



console.log(
"NEW JOB ID GENERATED:",
req.jobId
);


}



console.log(
"FINAL JOB ID:",
req.jobId
);





console.log(
"UPLOAD ROOT:",
UPLOAD_ROOT
);






const orderFolder =
path.join(

UPLOAD_ROOT,

req.jobId

);





console.log(
"TARGET FOLDER:",
orderFolder
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


console.log(
"FOLDER CREATED:",
orderFolder
);


}





console.log(
"UPLOAD FOLDER READY:",
orderFolder
);



cb(
null,
orderFolder
);




},







filename(req,file,cb){



console.log(
"ORIGINAL FILE NAME:",
file.originalname
);





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





console.log(
"STORED FILE NAME:",
uniqueName
);





cb(

null,

uniqueName

);



}



});







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