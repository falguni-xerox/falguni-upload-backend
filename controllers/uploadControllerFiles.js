const fs = require("fs");

const {

    UPLOAD_ROOT,
    META_FILE,
    loadMetadata,
    saveMetadata

} = require("../config/uploadConfig");


const {

    getSafeFilePath

} = require("../utils/fileHelper");





// ------------------------------------
// GET /upload/files
// ------------------------------------

exports.getFiles = (req,res)=>{


try{


let metadata =
loadMetadata(META_FILE);





// Remove missing files

metadata =
metadata.filter(item=>{


const filePath =
getSafeFilePath(

    UPLOAD_ROOT,

    item.jobId,

    item.storedName

);



return (

filePath &&
fs.existsSync(filePath)

);


});






// Normalize download status

metadata =
metadata.map(file=>{


return {

...file,


downloaded:
file.downloaded === true,


downloadCount:
file.downloadCount || 0,


downloadedAt:
file.downloadedAt || null


};


});






// Save cleaned metadata

saveMetadata(

META_FILE,

metadata

);







const orders = {};





metadata.forEach(file=>{



if(!orders[file.jobId]){


orders[file.jobId]={


jobId:file.jobId,


uploadedAt:
file.uploadedAt,


files:[]


};


}







orders[file.jobId].files.push({



id:file.id,


displayName:
file.displayName,


originalName:
file.displayName,


storedName:
file.storedName,


mimetype:
file.mimetype,


size:
file.size,


sizeKB:+(

file.size / 1024

).toFixed(2),






downloadUrl:

`/upload/download/${encodeURIComponent(file.jobId)}/${encodeURIComponent(file.storedName)}`,





// IMPORTANT

downloaded:
file.downloaded === true,




downloadCount:
file.downloadCount || 0,




downloadedAt:
file.downloadedAt || null



});



});







res.json({


success:true,


count:Object.keys(orders).length,


orders:Object.values(orders)



});



}



catch(err){


console.error(

"Files Error:",

err

);



res.status(500).json({


success:false,


message:err.message


});


}



};