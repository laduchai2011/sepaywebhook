import express, { Express } from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import process from 'process';
import cors from 'cors';
import { mssql_server } from '@src/connect';
import { redis_server } from '@src/connect';
import { rabbit_server } from '@src/connect';
import ServiceRedis from '@src/cache/cacheRedis';
import { connectMongo } from './connect/mongo';
import { getEnv } from './mode';
import { myEnv } from './mode/type';

dotenv.config();

const services = (process.env.SERVICES ?? '').split(',').map((s) => s.trim());

// import service_image from './services/image';
// import service_video from './services/video';
// import service_account from '@src/services/account';
// import service_myCustomer from './services/myCustomer';
// import service_message from './services/message';
// import service_note from './services/note';

const app: Express = express();

const isProduct = process.env.NODE_ENV === 'production';
const port = isProduct ? process.env.PORT : 7000;

const apiString = isProduct ? '' : '/api';
const prefix = getEnv() === myEnv.Dev ? '/api' : '';

app.use(cookieParser());
app.use(apiString, express.json());
app.use(apiString, express.urlencoded({ extended: true }));

// app.use((req, res, next) => {
//     const allowedOrigins = ['http://zalo5k.local.com:3000'];
//     const origin = req.headers.origin as string;
//     if (allowedOrigins.includes(origin)) {
//         res.header('Access-Control-Allow-Origin', origin);
//     }
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Content-Type');
//     res.header('Access-Control-Allow-Credentials', 'true');

//     // 👉 Quan trọng: xử lý preflight
//     if (req.method === 'OPTIONS') {
//         res.sendStatus(200);
//         return;
//     }

//     next();
// });
const originArray: string[] = ['http://zalo5k.local.com:3000'];
app.use(
    cors({
        origin: originArray,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
    })
);

app.use(`${apiString}/hello`, (req, res) => {
    res.send('hello');
});

(async () => {
    await mssql_server.init();
    await redis_server.init();
    await rabbit_server.init();

    const serviceRedis = ServiceRedis.getInstance();
    await serviceRedis.init();

    await connectMongo();

    if (services.includes('webhook')) {
        const service_webhook = (await import('./services/webhook')).default;
        app.use(`${prefix}/service_webhook`, service_webhook);
    }
})();

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
