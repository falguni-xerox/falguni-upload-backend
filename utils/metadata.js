const fs = require("fs");


// ------------------------------------
// Load Metadata
// ------------------------------------

function loadMetadata(metaFile) {

try {


if (!fs.existsSync(metaFile)) {


fs.writeFileSync(

metaFile,

"[]",

"utf8"

);


}



return JSON.parse(

fs.readFileSync(

metaFile,

"utf8"

)

);



}

catch(err){


console.error(

"Metadata Read Error:",

err

);


return [];


}


}





// ------------------------------------
// Save Metadata
// ------------------------------------

function saveMetadata(metaFile,data){

try{


fs.writeFileSync(

metaFile,

JSON.stringify(

data,

null,

2

),

"utf8"

);



console.log(

"METADATA SAVED:",

metaFile

);


console.log(

"RECORD COUNT:",

data.length

);



}

catch(err){


console.error(

"Metadata Save Error:",

err

);



}



}





// ------------------------------------
// Exports
// ------------------------------------

module.exports = {


loadMetadata,

saveMetadata


};