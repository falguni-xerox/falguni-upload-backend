const fs = require("fs");
const path = require("path");
const multer = require("multer");

const {

upload,

UPLOAD_ROOT,

META_FILE,

loadMetadata,

saveMetadata

} = require("../config/uploadConfig");


const {

getSafeFilePath

} = require("../utils/fileHelper");


const {

createZip

} = require("../utils/zipHelper");



// ------------------------------------
// Home API
// ------------------------------------

exports.home = (req,res)=>{


res.json({

success:true,

message:
"Falguni Upload Portal V2 API Running",


endpoints:{


upload:
"POST /upload",


orders:
"GET /upload/files",


download:
"GET /upload/download/:jobId/:fileName",


zip:
"POST /upload/download-zip",


delete:
"DELETE /upload/order/:jobId"


}


});


};




// ------------------------------------
// Upload Files
// ------------------------------------

exports.uploadFiles=[


(req,res,next)=>{


upload.array(
"files",
100

)(req,res,function(err){



if(err instanceof multer.MulterError){


return res.status(400).json({

success:false,

message:err.message


});


}



if(err){


return res.status(500).json({

success:false,

message:err.message


});


}



next();


});


},




(req,res)=>{


try{


if(
!req.files ||
req.files.length===0
){


return res.status(400).json({

success:false,

message:"No files uploaded."


});


}



let metadata =
loadMetadata(
META_FILE
);



const uploadedFiles=[];



for(const file of req.files){



const item={



id:

Date.now()

+

Math.floor(
Math.random()*10000
),



jobId:req.jobId,



displayName:

file.originalname,



storedName:

file.filename,



size:

file.size,



mimetype:

file.mimetype,



downloaded:false,


downloadCount:0,


downloadedAt:null,


uploadedAt:

new Date()
.toISOString()



};




metadata.push(item);


uploadedFiles.push(item);



}




saveMetadata(

META_FILE,

metadata

);




res.json({


success:true,


orderNumber:req.jobId,


jobId:req.jobId,


displayTime:900,


message:

`${uploadedFiles.length} file(s) uploaded successfully.`,


count:

uploadedFiles.length,


files:

uploadedFiles



});



}

catch(err){


console.error(err);



res.status(500).json({

success:false,

message:"Upload failed."

});


}



}


];





// ------------------------------------
// GET /upload/files
// ------------------------------------

exports.getFiles=(req,res)=>{


try{


let metadata=

loadMetadata(
META_FILE
);




// remove missing files


metadata=

metadata.filter(item=>{


const filePath=

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



saveMetadata(

META_FILE,

metadata

);




const orders={};




metadata.forEach(file=>{


if(!orders[file.jobId]){


orders[file.jobId]={


jobId:file.jobId,


uploadedAt:file.uploadedAt,


files:[]


};


}




orders[file.jobId].files.push({



id:file.id,


displayName:file.displayName,


originalName:file.displayName,


storedName:file.storedName,


mimetype:file.mimetype,


size:file.size,


sizeKB:

+(file.size/1024).toFixed(2),




downloadUrl:

`/upload/download/${encodeURIComponent(file.jobId)}/${encodeURIComponent(file.storedName)}`,



downloaded:

file.downloaded || false,



downloadCount:

file.downloadCount || 0,



downloadedAt:

file.downloadedAt || null



});



});




res.json({


success:true,


count:

Object.keys(orders).length,


orders:

Object.values(orders)



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
// ------------------------------------
// Download Single File
// ------------------------------------

exports.downloadFile = (req,res)=>{


try{


const jobId =

decodeURIComponent(
    req.params.jobId
);



const storedName =

decodeURIComponent(
    req.params.fileName
);




// Get physical file path

const filePath =

getSafeFilePath(

    UPLOAD_ROOT,

    jobId,

    storedName

);




if(

!filePath ||

!fs.existsSync(filePath)

){


return res.status(404).json({

success:false,

message:"File not found."

});


}





// Load metadata

let metadata =

loadMetadata(

META_FILE

);





const fileInfo =

metadata.find(item=>


item.jobId === jobId &&


item.storedName === storedName



);






// Update download status

if(fileInfo){



fileInfo.downloaded = true;



fileInfo.downloadCount =

(fileInfo.downloadCount || 0)

+ 1;



fileInfo.downloadedAt =

new Date()
.toISOString();





saveMetadata(

META_FILE,

metadata

);



}







// Original filename

const originalName =


fileInfo

?

fileInfo.displayName

:

storedName;






// MIME TYPE

const mimeType =


fileInfo && fileInfo.mimetype

?

fileInfo.mimetype

:

"application/octet-stream";







// Force correct download headers


res.setHeader(

"Content-Type",

mimeType

);




res.setHeader(

"Content-Disposition",

`attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`

);





// Cache control

res.setHeader(

"Cache-Control",

"no-cache"

);






// Send file

res.sendFile(

path.resolve(filePath),

(err)=>{


if(err){

console.error(
"Send File Error:",
err
);


}

}


);



}

catch(err){



console.error(
"Download Error:",
err
);



res.status(500).json({

success:false,

message:err.message


});



}


};
// ------------------------------------
// Download Complete Order ZIP
// ------------------------------------

exports.downloadZip = async (req,res)=>{


try{


const jobId =

req.body.jobId;



if(!jobId){


return res.status(400).json({

success:false,

message:"Job ID required."

});


}





let metadata =

loadMetadata(

META_FILE

);





const orderFiles =

metadata.filter(file=>

file.jobId === jobId

);





if(
orderFiles.length===0
){


return res.status(404).json({

success:false,

message:"Order not found."

});


}





// --------------------------------
// Mark ZIP Download Status
// --------------------------------


metadata =

metadata.map(file=>{


if(
file.jobId === jobId
){


file.downloaded = true;



file.downloadCount =

(file.downloadCount || 0)

+ 1;



file.downloadedAt =

new Date()
.toISOString();



}



return file;



});





saveMetadata(

META_FILE,

metadata

);







await createZip(

res,

jobId,

orderFiles,

getSafeFilePath,

UPLOAD_ROOT

);



}

catch(err){



console.error(

"ZIP Error:",

err

);




if(!res.headersSent){


res.status(500).json({

success:false,

message:err.message


});


}



}


};







// ------------------------------------
// Delete Complete Order
// ------------------------------------

exports.deleteOrder=(req,res)=>{


try{


const jobId =

decodeURIComponent(

req.params.jobId

);





const orderFolder =

path.join(

UPLOAD_ROOT,

path.basename(jobId)

);





if(
fs.existsSync(orderFolder)
){



fs.rmSync(

orderFolder,

{

recursive:true,

force:true

}

);



}






let metadata =

loadMetadata(

META_FILE

);






metadata =

metadata.filter(file=>


file.jobId !== jobId



);







saveMetadata(

META_FILE,

metadata

);






res.json({

success:true,

message:"Order deleted successfully."

});





}

catch(err){



console.error(

"Delete Error:",

err

);




res.status(500).json({

success:false,

message:err.message


});



}



};







// ------------------------------------
// 404 Handler
// ------------------------------------

exports.notFound=(req,res)=>{


res.status(404).json({

success:false,

message:"Route not found."

});


};
const API =
"https://api.falgunixerox.in/upload";



// -------------------------------------
// Load Orders
// -------------------------------------

async function loadFiles(){


try{


const response =

await fetch(
`${API}/files`
);



const data =

await response.json();





const container =

document.getElementById(
"ordersContainer"
);




const totalOrders =

document.getElementById(
"totalOrders"
);




if(totalOrders){


totalOrders.innerHTML =

data.orders?.length || 0;


}






if(

!data.success ||

!Array.isArray(data.orders) ||

data.orders.length===0

){


container.innerHTML =

`<p class="text-center text-gray-500">
No orders found
</p>`;

return;


}






container.innerHTML="";





data.orders.forEach(

(order,index)=>{


container.insertAdjacentHTML(

"beforeend",

renderOrder(

order,

index

)

);


});


}

catch(err){


console.error(

"Load Error:",

err

);


}



}






// -------------------------------------
// Single File Download
// -------------------------------------

async function downloadFile(

url,

btn,

fileName,

fileId

){


try{



btn.dataset.id = fileId;



btn.disabled=true;



btn.innerHTML=

`
Downloading...
`;






const response =

await fetch(url);




if(!response.ok){

throw new Error(
"Download failed"
);

}




const blob =

await response.blob();




const blobUrl =

URL.createObjectURL(
blob
);




const a =

document.createElement(
"a"
);




a.href =

blobUrl;



a.download =

fileName;




document.body.appendChild(a);



a.click();



a.remove();



URL.revokeObjectURL(
blobUrl
);





// Save permanent status

localStorage.setItem(

"downloaded_"+fileId,

"true"

);





markDownloaded(btn);



}

catch(err){



console.error(err);



btn.disabled=false;



btn.innerHTML=

`
Download
`;



alert(
"Download Failed"
);



}



}







// -------------------------------------
// Mark Green Button
// -------------------------------------

function markDownloaded(btn){



btn.disabled=true;



btn.innerHTML=

`
Downloaded
`;



btn.className=

`
bg-green-600
text-white
px-3
py-1.5
rounded-lg
text-sm
flex
items-center
gap-1
cursor-not-allowed
`;



}







// -------------------------------------
// Check Download Status
// -------------------------------------

function checkDownloaded(

file,

btn

){



if(

file.downloaded === true ||

localStorage.getItem(

"downloaded_"+file.id

)

){


markDownloaded(btn);


}



}








// -------------------------------------
// ZIP Download
// -------------------------------------

async function downloadZip(jobId){


try{


const response =

await fetch(

`${API}/download-zip`,

{


method:"POST",


headers:{


"Content-Type":

"application/json"


},


body:JSON.stringify({

jobId

})


}

);





if(!response.ok){


throw new Error(
"ZIP failed"
);


}





const blob =

await response.blob();




const url =

URL.createObjectURL(
blob
);




const a =

document.createElement(
"a"
);



a.href=url;



a.download=

`${jobId}.zip`;




document.body.appendChild(a);



a.click();



a.remove();



URL.revokeObjectURL(url);





// refresh status

loadFiles();



}

catch(err){


console.error(

"ZIP Error",

err

);



alert(
"ZIP Download Failed"
);



}



}







// -------------------------------------
// Delete Order
// -------------------------------------

async function deleteOrder(jobId){



if(
!confirm(
`Delete ${jobId}?`
)
){

return;

}



try{



const response =

await fetch(

`${API}/order/${encodeURIComponent(jobId)}`,

{


method:"DELETE"


}

);




const data =

await response.json();





if(

!response.ok ||

!data.success

){


throw new Error(
data.message
);


}





loadFiles();



}

catch(err){



console.error(err);



alert(
"Delete Failed"
);



}



}






// -------------------------------------
// Refresh Button
// -------------------------------------

document

.getElementById(

"refreshBtn"

)

?.addEventListener(

"click",

loadFiles

);







// -------------------------------------
// Start
// -------------------------------------

window.addEventListener(

"DOMContentLoaded",

loadFiles

);






// Auto Refresh

setInterval(

()=>{


loadFiles();


},

5000

);