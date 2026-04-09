import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app = express();



// app.use(cors());
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(express.json({limit : '5mb'}));
// app.use(express.urlencoded());
app.use(express.urlencoded({extended : true, limit : "5mb"}))
app.use(express.static('public'));

app.use(cookieParser());

export {app};