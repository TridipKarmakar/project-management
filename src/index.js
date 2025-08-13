import dotenv from "dotenv";
import express from "express";
dotenv.config({
    path: "./.env"
})

const app = express()
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get("/instagram", (req,res) => {
    res.send("this is the an integram page")
} )


app.listen(port, () => {
  console.log(`Example app listening on port https://probable-palm-tree-9r6774gp4w73rg7-${port}.app.github.dev/`)
})
