import express, { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
import Handle_SepayWebhook from './handle/SepayWebhook';

dotenv.config();

const router_mutate_webhook: Router = express.Router();

const handle_sepayWebhook = new Handle_SepayWebhook()

router_mutate_webhook.post('/', (_: Request, res: Response) => {
    res.send('(POST) Express + TypeScript Server: router_mutate_account');
});

router_mutate_webhook.post('/sepay-webhook', handle_sepayWebhook.main);

export default router_mutate_webhook;
