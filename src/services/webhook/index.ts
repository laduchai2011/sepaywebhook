import express, { Express } from 'express';
import dotenv from 'dotenv';

dotenv.config();

import router_query_webhook from './router/query';
import router_mutate_webhook from './router/mutate';

const service_webhook: Express = express();

service_webhook.use(`/query`, router_query_webhook);
service_webhook.use(`/mutate`, router_mutate_webhook);

export default service_webhook;
