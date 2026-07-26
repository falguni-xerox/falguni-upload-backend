// ------------------------------------
// Main Controller Export
// ------------------------------------


// Home + 404

const homeController = require("./uploadControllerHome");


// Upload

const uploadControllerUpload = require("./uploadControllerUpload");


// Files List

const uploadControllerFiles = require("./uploadControllerFiles");


// Download + ZIP

const uploadControllerDownload = require("./uploadControllerDownload");


// Delete

const uploadControllerDelete = require("./uploadControllerDelete");




// ------------------------------------
// Export All Controllers
// ------------------------------------

module.exports = {


// Home API

home:

homeController.home,



// Upload

uploadFiles:

uploadControllerUpload.uploadFiles,



// Files

getFiles:

uploadControllerFiles.getFiles,



// Download

downloadFile:

uploadControllerDownload.downloadFile,



// ZIP

downloadZip:

uploadControllerDownload.downloadZip,



// Delete

deleteOrder:

uploadControllerDelete.deleteOrder,



// 404

notFound:

homeController.notFound


};