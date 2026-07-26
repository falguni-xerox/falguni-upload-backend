const fs = require("fs");
const path = require("path");
const multer = require("multer");

const {
    loadMetadata,
    saveMetadata
} = require("../utils/metadata");

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

if (!fs.existsSync(UPLOAD_ROOT)) {

    fs.mkdirSync(
        UPLOAD_ROOT,
        {
            recursive: true
        }
    );

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
        loadMetadata(
            META_FILE
        );

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

const storage =
    multer.diskStorage({

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



    fs.mkdirSync(

        orderFolder,

        {
            recursive:true
        }

    );



    console.log(
        "UPLOAD FOLDER:",
        orderFolder
    );



    cb(
        null,
        orderFolder
    );


},

        filename(
            req,
            file,
            cb
        ) {

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

const upload =
    multer({

        storage,

        limits: {

            fileSize:
                100 * 1024 * 1024

        }

    });

// ------------------------------------
// Exports
// ------------------------------------

module.exports = {

    upload,

    UPLOAD_ROOT,

    META_FILE,

    loadMetadata,

    saveMetadata,

    generateJobId

};