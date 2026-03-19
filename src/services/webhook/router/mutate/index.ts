import express, { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
import authentication from '@src/auth';

dotenv.config();

const router_mutate_webhook: Router = express.Router();

router_mutate_webhook.post('/', (_: Request, res: Response) => {
    res.send('(POST) Express + TypeScript Server: router_mutate_account');
});

router_mutate_webhook.post('/sepay-webhook', (req: Request, res: Response) => {
    const data = req.body;

    console.log('Webhook từ SePay:', data);
    res.send('OK');
});

export default router_mutate_webhook;
