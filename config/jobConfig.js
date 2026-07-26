const {
    loadMetadata
} = require("../utils/metadata");


const {
    META_FILE
} = require("./pathConfig");



// ------------------------------------
// Generate Order ID
// ------------------------------------

function generateJobId(){


const now = new Date();



const yyyy =

now.getFullYear();




const mm =

String(
    now.getMonth()+1
)

.padStart(
    2,
    "0"
);




const dd =

String(
    now.getDate()
)

.padStart(
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

metadata.filter(item=>


item.jobId &&

item.jobId.startsWith(

`ORD-${date}`

)


);






const number =

String(

todayOrders.length + 1

)

.padStart(

3,

"0"

);







return (

`ORD-${date}-${number}`

);



}




module.exports = {


    generateJobId


};