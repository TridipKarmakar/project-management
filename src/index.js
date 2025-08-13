import dotenv from "dotenv";
import app from "./app.js";
dotenv.config({
    path: "./.env"
})

const port = process.env.PORT || 3000



app.listen(port, () => {
  console.log(`Example app listening on port https://probable-palm-tree-9r6774gp4w73rg7-${port}.app.github.dev/`)
})
