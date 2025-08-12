import dotenv from "dotenv";


dotenv.config({
    path: "./.env"
})

let myusername = process.env.database
console.log("My user name : ",myusername);

console.log("Start of the Backend Project");
