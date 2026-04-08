import dotenv from 'dotenv';
import {connectDB} from './db/index.js';
import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '8.8.4.4']);


dotenv.config({
    path: './env'
});
connectDB();





 