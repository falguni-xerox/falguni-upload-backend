const express = require("express");
const router = express.Router();

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const archiver = require("archiver");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "temp");
const META_FILE = path.join(UPLOAD_DIR, "files.json");

// ------------------------------------
// Create Upload Folder
// ------------------------------------
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ------------------------------------
// Metadata Helpers
// ------------------------------------
function loadMetadata() {

    try {

        if (!fs.existsSync(META_FILE)) {
            fs.writeFileSync(META_FILE, "[]");
        }

        return JSON.parse(fs.readFileSync(META_FILE, "utf8"));

    } catch (err) {

        console.error("Metadata Read Error:", err);
        return [];

    }

}

function saveMetadata(data) {

    try {

        fs.writeFileSync(
            META_FILE,
            JSON.stringify(data, null, 2)
        );

    } catch (err) {

        console.error("Metadata Save Error:", err);

    }

}

// ------------------------------------
// Safe Path
// ------------------------------------
function getSafeFilePath(fileName) {

    const safeName = path.basename(fileName);

    const fullPath = path.join(UPLOAD_DIR, safeName);

    if (!fullPath.startsWith(UPLOAD_DIR)) {
        return null;
    }

    return fullPath;

}

// ------------------------------------
// Multer Storage
// ------------------------------------
const storage = multer.diskStorage({

    destination(req, file, cb) {

        cb(null, UPLOAD_DIR);

    },

    filename(req, file, cb) {

        const ext = path.extname(file.originalname);

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1000000) +
            ext;

        cb(null, uniqueName);

    }

});

const upload = multer({

    storage,

    limits: {

        fileSize: 100 * 1024 * 1024

    }

});

// ------------------------------------
// Root
// ------------------------------------
router.get("/", (req, res) => {

    res.json({

        success: true,
        message: "Falguni Upload Portal API Running",

        endpoints: {

            upload: "POST /upload",
            files: "GET /upload/files",
            download: "GET /upload/download/:fileName",
            downloadZip: "POST /upload/download-zip",
            delete: "DELETE /upload/:fileName"

        }

    });

});

// ------------------------------------
// Upload
// ------------------------------------
router.post(

    "/",

    (req, res, next) => {

        upload.array("files", 100)(req, res, function (err) {

            if (err instanceof multer.MulterError) {

                if (err.code === "LIMIT_FILE_SIZE") {

                    return res.status(400).json({

                        success: false,
                        message: "One or more files exceed 100 MB."

                    });

                }

                return res.status(400).json({

                    success: false,
                    message: err.message

                });

            }

            if (err) {

                return res.status(500).json({

                    success: false,
                    message: err.message

                });

            }

            next();

        });

    },

    (req, res) => {

        try {

            if (!req.files || req.files.length === 0) {

                return res.status(400).json({

                    success: false,
                    message: "No files uploaded."

                });

            }

            let metadata = loadMetadata();

            const uploadedFiles = [];

            for (const file of req.files) {

                const item = {

                    id:
                        Date.now().toString() +
                        Math.floor(Math.random() * 100000),

                    displayName: file.originalname,

                    storedName: file.filename,

                    size: file.size,

                    mimetype: file.mimetype,

                    uploadedAt: new Date().toISOString()

                };

                metadata.push(item);
                uploadedFiles.push(item);

            }

            saveMetadata(metadata);

            return res.status(200).json({

                success: true,

                message:
                    uploadedFiles.length +
                    " file(s) uploaded successfully.",

                count: uploadedFiles.length,

                files: uploadedFiles

            });

        } catch (err) {

            console.error(err);

            return res.status(500).json({

                success: false,
                message: "Upload failed.",
                error: err.message

            });

        }

    }

);

// ------------------------------------
// GET /upload/files
// ------------------------------------
router.get("/files", (req, res) => {

    try {

        let metadata = loadMetadata();

        // Remove records whose file no longer exists
        metadata = metadata.filter(file => {

            const filePath = getSafeFilePath(file.storedName);

            return (
                filePath &&
                fs.existsSync(filePath) &&
                fs.statSync(filePath).isFile()
            );

        });

        saveMetadata(metadata);

        const fileList = metadata
            .sort(
                (a, b) =>
                    new Date(a.uploadedAt) -
                    new Date(b.uploadedAt)
            ) // FIFO
            .map(file => ({

                id: file.id,
                displayName: file.displayName,
                storedName: file.storedName,
                mimetype: file.mimetype,
                size: file.size,
                sizeKB: +(file.size / 1024).toFixed(2),
                uploadedAt: file.uploadedAt,
                downloadUrl:
                    "/upload/download/" +
                    encodeURIComponent(file.storedName)

            }));

        return res.json({

            success: true,
            count: fileList.length,
            files: fileList

        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

// ------------------------------------
// GET /upload/download/:fileName
// ------------------------------------
router.get("/download/:fileName", (req, res) => {

    try {

        const fileName = decodeURIComponent(req.params.fileName);

        const filePath = getSafeFilePath(fileName);

        if (!filePath || !fs.existsSync(filePath)) {

            return res.status(404).json({

                success: false,
                message: "File not found."

            });

        }

        const metadata = loadMetadata();

        const fileInfo = metadata.find(
            x => x.storedName === fileName
        );

        return res.download(

            filePath,

            fileInfo
                ? fileInfo.displayName
                : path.basename(filePath)

        );

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

// ------------------------------------
// DELETE /upload/:fileName
// ------------------------------------
router.delete("/:fileName", (req, res) => {

    try {

        const fileName = decodeURIComponent(req.params.fileName);

        const filePath = getSafeFilePath(fileName);

        if (!filePath || !fs.existsSync(filePath)) {

            return res.status(404).json({

                success: false,
                message: "File not found."

            });

        }

        fs.unlinkSync(filePath);

        let metadata = loadMetadata();

        metadata = metadata.filter(
            x => x.storedName !== fileName
        );

        saveMetadata(metadata);

        return res.json({

            success: true,
            message: "File deleted successfully."

        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

// ------------------------------------
// POST /upload/download-zip
// ------------------------------------
router.post("/download-zip", async (req, res) => {

    try {

        const files = req.body.files;

        if (!Array.isArray(files) || files.length === 0) {

            return res.status(400).json({

                success: false,
                message: "No files selected."

            });

        }

        const metadata = loadMetadata();

        res.setHeader(
            "Content-Type",
            "application/zip"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="Falguni_Files_${Date.now()}.zip"`
        );

        const archive = archiver("zip", {

            zlib: { level: 9 }

        });

        archive.on("error", err => {

            throw err;

        });

        archive.pipe(res);

        for (const storedName of files) {

            const filePath = getSafeFilePath(storedName);

            if (
                filePath &&
                fs.existsSync(filePath)
            ) {

                const fileInfo = metadata.find(
                    x => x.storedName === storedName
                );

                archive.file(filePath, {

                    name: fileInfo
                        ? fileInfo.displayName
                        : storedName

                });

            }

        }

        await archive.finalize();

    } catch (err) {

        console.error(err);

        if (!res.headersSent) {

            res.status(500).json({

                success: false,
                message: err.message

            });

        }

    }

});

// ------------------------------------
// 404
// ------------------------------------
router.use((req, res) => {

    res.status(404).json({

        success: false,
        message: "Route not found."

    });

});

module.exports = router;