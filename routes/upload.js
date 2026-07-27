const express = require("express");

const router = express.Router();


const controller = require("../controllers/uploadController");




// ------------------------------------
// Home
// ------------------------------------

router.get(
    "/",
    controller.home
);




// ------------------------------------
// Upload Files
// ------------------------------------

router.post(
    "/",
    controller.uploadFiles
);




// ------------------------------------
// Debug Metadata
// ------------------------------------

router.get(
    "/debug-metadata",
    controller.debugMetadata
);




// ------------------------------------
// Order Wise Files
// ------------------------------------

router.get(
    "/files",
    controller.getFiles
);




// ------------------------------------
// Download Single File
// ------------------------------------

router.get(
    "/download/:jobId/:fileName",
    controller.downloadFile
);




// ------------------------------------
// Download Complete Order ZIP
// ------------------------------------

router.post(
    "/download-zip",
    controller.downloadZip
);




// ------------------------------------
// Delete Complete Order
// ------------------------------------

router.delete(
    "/order/:jobId",
    controller.deleteOrder
);

// ------------------------------------
// Delete All Orders
// ------------------------------------

router.delete(
    "/orders",
    controller.deleteAllOrders
);



// ------------------------------------
// 404
// ------------------------------------

router.use(
    controller.notFound
);




// ------------------------------------
// Export
// ------------------------------------

module.exports = router;