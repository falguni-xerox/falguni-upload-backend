const fs = require("fs");
const path = require("path");


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



// ------------------------------------
// Create Upload Folder
// ------------------------------------

if(
    !fs.existsSync(UPLOAD_ROOT)
){

    fs.mkdirSync(
        UPLOAD_ROOT,
        {
            recursive:true
        }
    );

}



module.exports = {

    UPLOAD_ROOT,

    META_FILE

};