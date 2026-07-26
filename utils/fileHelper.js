const path = require("path");

// ------------------------------------
// Safe File Path Helper
// ------------------------------------

function getSafeFilePath(
    uploadRoot,
    jobId,
    fileName
) {

    const safeJob =
        path.basename(jobId);

    const safeFile =
        path.basename(fileName);

    const fullPath =
        path.join(
            uploadRoot,
            safeJob,
            safeFile
        );

    // Prevent Path Traversal
    if (
        !fullPath.startsWith(
            uploadRoot
        )
    ) {

        return null;

    }

    return fullPath;

}

// ------------------------------------
// Exports
// ------------------------------------

module.exports = {

    getSafeFilePath

};