
const mongoose = require("mongoose")

const connectDB = async() =>{
    try{
        await mongoose.connect("mongodb+srv://adminTesis:yFJtz8i57JqZhrem@cluster0.d6grk.mongodb.net/tesisDB")
        console.log("MongoDB conectado")
    }catch (error){
        console.error(error)
        process.exit(1)
    }
}

module.exports = connectDB