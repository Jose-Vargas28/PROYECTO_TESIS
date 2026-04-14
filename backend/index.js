console.log("iniciando servidor....")

const express = require("express")
const connectDB = require("./config/db")

const app = express()

// conectar BD
connectDB()

app.use(express.json())

app.get("/",(req, res) =>{
    res.send("API funcionando")

});

app.listen(3000, () =>{
    console.log("Servidor corriendo en puerto 3000")

})
