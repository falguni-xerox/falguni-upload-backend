const fs = require("fs");
const archiver = require("archiver");

// ------------------------------------
// Create ZIP Archive
// ------------------------------------

async function createZip(
    res,
    jobId,
    files,
    getSafeFilePath,
    uploadRoot
) {

    res.setHeader(
        "Content-Type",
        "application/zip"
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${jobId}.zip"`
    );

    const archive = archiver(
        "zip",
        {
            zlib: {
                level: 9
            }
        }
    );

    archive.on(
        "error",
        err => {
            throw err;
        }
    );

    archive.pipe(res);

    for (const file of files) {

        const filePath =
            getSafeFilePath(
                uploadRoot,
                file.jobId,
                file.storedName
            );

        if (
            filePath &&
            fs.existsSync(filePath)
        ) {

            archive.file(
                filePath,
                {
                    name:
                        file.displayName
                }
            );

        }

    }

    await archive.finalize();

}

// ------------------------------------
// Exports
// ------------------------------------

module.exports = {

    createZip

};