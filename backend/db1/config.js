const dotenv= require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const uri = process.env.URI;

const connectDb =  async () => {

    try {
        const connect = await mongoose.connect(uri);
        if(connect){
            console.log(`connected`);
            
     
            
        }else{
            console.log(`not connected`);
            
        }

    } catch (error) {
        console.log(error);
        process.exit(1);
        
    }

}

module.exports = connectDb;