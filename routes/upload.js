const express = require("express");
const router = express.Router();

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const archiver = require("archiver");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "temp");

// Create upload folder if missing
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// -----------------------------
// Clean Upload Folder
// -----------------------------
function cleanUploadFolder() {
    try {
        if (!fs.existsSync(UPLOAD_DIR)) return;

        const files = fs.readdirSync(UPLOAD_DIR);

        for (const file of files) {
            const filePath = path.join(UPLOAD_DIR, file);

            try {
                const stat = fs.statSync(filePath);

                if (stat.isFile()) {
                    fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.error("Delete Error:", err.message);
            }
        }
    } catch (err) {
        console.error("Clean Folder Error:", err.message);
    }
}

// -----------------------------
// Multer Storage
// -----------------------------
const storage = multer.diskStorage({

destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
},
    filename(req, file, cb) {

        cb(null, file.originalname);

    }

});

const upload = multer({

    storage,

    limits: {
        fileSize: 100 * 1024 * 1024 // 100 MB
    }

});

// -----------------------------
// Safe File Path
// -----------------------------
function getSafeFilePath(fileName) {

    const safeName = path.basename(fileName);

    const fullPath = path.join(UPLOAD_DIR, safeName);

    if (!fullPath.startsWith(UPLOAD_DIR)) {
        return null;
    }

    return fullPath;

}

// -----------------------------
// File List
// -----------------------------
function getFiles() {

    if (!fs.existsSync(UPLOAD_DIR)) {
        return [];
    }

    const files = fs.readdirSync(UPLOAD_DIR);

    return files
        .map(file => {

            const filePath = path.join(UPLOAD_DIR, file);
            const stat = fs.statSync(filePath);

            return {

                name: file,
                size: stat.size,
                createdAt: stat.birthtime,
                modifiedAt: stat.mtime

            };

        })
        .sort((a, b) => b.modifiedAt - a.modifiedAt);

}
// ------------------------------------
// GET /upload
// ------------------------------------
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Falguni Upload Portal API Running",
        endpoints: {
            upload: "POST /upload",
            files: "GET /upload/files",
            download: "GET /upload/download/:fileName",
            downloadZip: "POST /upload/download-zip"
        }
    });
});

// ------------------------------------
// POST /upload
// ------------------------------------
router.post(
    "/",
    (req, res, next) => {

        // Auto clean before every upload request
        try {
            cleanUploadFolder();
        } catch (err) {
            console.error("Clean Error:", err.message);
        }

        upload.array("files", 100)(req, res, function (err) {

            if (err instanceof multer.MulterError) {

                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({
                        success: false,
                        message: "One or more files exceed the maximum size (100 MB)."
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

            const uploadedFiles = req.files.map(file => ({
                name: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                uploadedAt: new Date()
            }));

            return res.status(200).json({
                success: true,
                message: `${uploadedFiles.length} file(s) uploaded successfully.`,
                count: uploadedFiles.length,
                files: uploadedFiles
            });

        } catch (err) {

            console.error("Upload Error:", err);

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
// Latest uploads first
// ------------------------------------
router.get("/files", (req, res) => {

    try {

        if (!fs.existsSync(UPLOAD_DIR)) {

            return res.json({
                success: true,
                count: 0,
                files: []
            });

        }

        const files = fs.readdirSync(UPLOAD_DIR);

        const fileList = files
            .map(file => {

                const filePath = path.join(UPLOAD_DIR, file);

                try {

                    const stat = fs.statSync(filePath);

return {
    displayName: file,
    storedName: file,
    type: path.extname(file).toLowerCase(),
    size: stat.size,
    sizeKB: +(stat.size / 1024).toFixed(2),
    createdAt: stat.birthtime,
    modifiedAt: stat.mtime,
    downloadUrl:
        "/upload/download/" +
        encodeURIComponent(file)
};

                } catch (err) {

                    return null;

                }

            })
            .filter(Boolean)
            .sort((a, b) => {

                return (
                    new Date(b.modifiedAt).getTime() -
                    new Date(a.modifiedAt).getTime()
                );

            });

        return res.status(200).json({

            success: true,
            count: fileList.length,
            files: fileList

        });

    } catch (err) {

        console.error("Get Files Error:", err);

        return res.status(500).json({

            success: false,
            message: "Unable to fetch uploaded files.",
            error: err.message

        });

    }

});
// ------------------------------------
// GET /upload/download/:fileName
// Secure Single File Download
// ------------------------------------
router.get("/download/:fileName", (req, res) => {

    try {

        const requestedFile = decodeURIComponent(req.params.fileName || "");

        // Prevent Path Traversal
        const filePath = getSafeFilePath(requestedFile);

        if (!filePath) {
            return res.status(400).json({
                success: false,
                message: "Invalid file name."
            });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "File not found."
            });
        }

        const stat = fs.statSync(filePath);

        if (!stat.isFile()) {
            return res.status(400).json({
                success: false,
                message: "Invalid file."
            });
        }

        return res.download(
            filePath,
            path.basename(filePath),
            (err) => {

                if (err) {

                    console.error("Download Error:", err);

                    if (!res.headersSent) {
                        return res.status(500).json({
                            success: false,
                            message: "Unable to download file."
                        });
                    }

                }

            }
        );

    } catch (err) {

        console.error("Download Route Error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error.",
            error: err.message
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

        res.setHeader("Content-Type", "application/zip");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="Falguni_Files_${Date.now()}.zip"`
        );

        const archive = archiver("zip", {
            zlib: {
                level: 9
            }
        });

        archive.on("error", (err) => {

            console.error("ZIP Error:", err);

            if (!res.headersSent) {
                return res.status(500).json({
                    success: false,
                    message: "ZIP creation failed."
                });
            }

            res.end();

        });

        archive.pipe(res);

        for (const fileName of files) {

            const safePath = getSafeFilePath(fileName);

            if (!safePath) {
                continue;
            }

            if (!fs.existsSync(safePath)) {
                continue;
            }

            const stat = fs.statSync(safePath);

            if (!stat.isFile()) {
                continue;
            }

            archive.file(safePath, {
                name: path.basename(safePath)
            });

        }

        await archive.finalize();

    } catch (err) {

        console.error("ZIP Route Error:", err);

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error.",
                error: err.message
            });
        }

    }

});

// ------------------------------------
// 404 Handler
// ------------------------------------
router.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "Route not found."
    });

});

// ------------------------------------
// Export Router
// ------------------------------------
module.exports = router;