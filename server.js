import express from 'express';
import identifyRoutes from './routes/identity-route.js'
import dotenv from 'dotenv';
dotenv.config();
const app=express();

const PORT=process.env.PORT||4000;
app.use(express.json());

app.use('/identify',identifyRoutes);

app.listen(PORT,()=>{
     console.log("listening to the port ",PORT);
})