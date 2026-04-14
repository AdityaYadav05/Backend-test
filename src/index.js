import dotenv from 'dotenv';
import {connectDB} from './db/index.js';
import dns from 'node:dns/promises';
import app from './app.js';
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config({
    path: './.env'
});

const PORT = process.env.PORT || 8000;
connectDB()
.then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })
})
.catch((err) => {
    console.error('Failed to connect to the database:', err);   
})









 