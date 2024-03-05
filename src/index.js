import dotenv from 'dotenv'
import connectDB from './db/index.js';
import { app } from './app.js';

dotenv.config(
    {
        path:'./.env'
    }
)

connectDB()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`App Listen.... :${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log(`Failed to connect to Mongo database`, err);
})
