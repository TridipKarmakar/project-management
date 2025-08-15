import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./.env"
})

const port = process.env.PORT || 3000

connectDB()
  .then(() => {
      app.listen(port, () => {
        console.log(`Example app listening on port https://probable-palm-tree-9r6774gp4w73rg7-${port}.app.github.dev/`)
    })  

  })
  .catch((err)=> {
    console.log("Mongodb connection error",err);
    process.exit(1)

  })
