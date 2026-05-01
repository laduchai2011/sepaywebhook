import { mssql_server } from '@src/connect';
import { Request, Response } from 'express';
import MutateDB_CreatePayHook from '../../mutateDB/CreatePayHook';
import MutateDB_UpdateAgentPaid from '../../mutateDB/UpdateAgentPaid';
import MutateDB_PayOrder from '../../mutateDB/PayOrder';
import MutateDB_TakeMoney from '../../mutateDB/TakeMoney';
import { sendStringMessage } from '@src/messageQueue/Producer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { PayHookField } from '@src/dataStruct/payHook';
import { TakeMoneyBodyField } from '@src/dataStruct/wallet/body';
import { getEnv } from '@src/mode';
import { myEnv } from '@src/mode/type';

dotenv.config();

const prefix = getEnv() !== myEnv.Prod ? '_dev' : '';

const SECRET = process.env.SEPAY_SECRET!;
const rowBody = 'hello ztks';

function signHmac(data: string, secret: string) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function verifySignature(rawBody: string, signature: string, secret: string) {
    const hash = signHmac(rawBody, secret);
    return hash === signature;
}

function getHeader(rawHeaders: string[], key: string) {
    for (let i = 0; i < rawHeaders.length; i += 2) {
        if (rawHeaders[i].toLowerCase() === key.toLowerCase()) {
            return rawHeaders[i + 1];
        }
    }
    return undefined;
}

enum payTable {
    AGENT = 'agentPay',
    ORDER = 'orderPay',
    TAKE_MONEY = 'takeMoney',
}

class Handle_SepayWebhook {
    private _mssql_server = mssql_server;

    constructor() {
        this._mssql_server.init();
    }

    main = async (req: Request<any, any, PayHookField>, res: Response) => {
        // console.log(req)
        // signature có thể là string | string[]
        // const headers = req.headers;
        // console.log('headers', headers)

        const apiKey = getHeader(req.rawHeaders, 'Authorization');

        if (!apiKey) {
            console.log('apiKey undefine');
            res.send('apiKey undefine');
            return;
        }

        let signature = '';

        if (apiKey.startsWith('Apikey ')) {
            signature = apiKey.slice(7);
        }

        const isValid = verifySignature(rowBody, signature, SECRET);

        if (!isValid) {
            console.log('Invalid signature');
            res.status(401).send('Invalid signature');
            return;
        }

        console.log('Webhook từ SePay:', req.body);

        const content = req.body.content;
        console.log('content', content);

        if (!content) {
            console.log('Invalid content');
            res.status(401).send('Invalid signature');
            return;
        }

        const match = content.match(/ztks\S*/);

        const result = match ? match[0] : null;

        if (!result) {
            console.log('Invalid Content');
            res.status(401).send('Invalid Content');
            return;
        }

        const parts = result.split('j');

        console.log('parts', parts);

        const payType = parts[1];
        const id = parts[2];
        const walletId = Number(parts[3]);

        const mutateDB_createPayHook = new MutateDB_CreatePayHook();
        const connection_pool = this._mssql_server.get_connectionPool();
        if (!connection_pool) {
            res.status(500).json({ message: 'Kết nối cơ sở dữ liệu không thành công !' });
            return;
        }
        mutateDB_createPayHook.set_connection_pool(connection_pool);

        switch (payType) {
            case payTable.AGENT: {
                console.log('payTable.AGENT');
                const agentPayId = Number(id);
                const payHookBody = { ...req.body };
                payHookBody.agentPayId = agentPayId;
                payHookBody.orderId = null;
                payHookBody.walletId = walletId;
                payHookBody.requireTakeMoneyId = null;
                mutateDB_createPayHook.setCreatePayHookBody(payHookBody);

                try {
                    const result1 = await mutateDB_createPayHook.run();
                    if (!(result1?.recordset.length && result1?.recordset.length > 0)) {
                        res.status(500).json({
                            message: 'Ghi payHook vào database không thành công !',
                        });
                        return;
                    }

                    const mutateDB_updateAgentPaid = new MutateDB_UpdateAgentPaid();
                    mutateDB_updateAgentPaid.set_connection_pool(connection_pool);
                    mutateDB_updateAgentPaid.setUpdateAgentPaidBody({ id: agentPayId });
                    const result2 = await mutateDB_updateAgentPaid.run();
                    if (!(result2?.recordset.length && result2?.recordset.length > 0)) {
                        res.status(500).json({
                            message: 'Cập nhật agentPay và agent không thành công !',
                        });
                        return;
                    }

                    // send message
                    const agentPay = result2.recordset[0];
                    sendStringMessage(`agentPay${prefix}`, JSON.stringify(agentPay));
                    break;
                } catch (error) {
                    console.error(error);
                    res.status(500).json({
                        message: 'Đã có lỗi xảy ra !',
                        err: error,
                    });
                    return;
                }
            }
            case payTable.ORDER: {
                console.log('payTable.ORDER');
                const orderId = Number(id);
                const accountId = parts[4];
                const payHookBody = { ...req.body };
                payHookBody.agentPayId = null;
                payHookBody.orderId = orderId;
                payHookBody.walletId = walletId;
                payHookBody.requireTakeMoneyId = null;
                mutateDB_createPayHook.setCreatePayHookBody(payHookBody);

                try {
                    const result1 = await mutateDB_createPayHook.run();
                    if (!(result1?.recordset.length && result1?.recordset.length > 0)) {
                        res.status(500).json({
                            message: 'Ghi payHook vào database không thành công !',
                        });
                        return;
                    }

                    const mutateDB_payOrder = new MutateDB_PayOrder();
                    mutateDB_payOrder.set_connection_pool(connection_pool);
                    mutateDB_payOrder.setPayOrderBody({
                        walletId: walletId,
                        addedAmount: payHookBody.transferAmount,
                        orderId: orderId,
                        payHookId: payHookBody.id,
                    });
                    const result3 = await mutateDB_payOrder.run();
                    if (!(result3?.recordset.length && result3?.recordset.length > 0)) {
                        res.status(500).json({
                            message: 'Cập nhật MoneyIn không thành công !',
                        });
                        return;
                    }

                    // send message
                    const order = result3.recordset[0];
                    const payload = {
                        accountId: accountId,
                        order: order
                    }
                    sendStringMessage(`orderPay${prefix}`, JSON.stringify(payload));
                    break;
                } catch (error) {
                    console.error(error);
                    res.status(500).json({
                        message: 'Đã có lỗi xảy ra !',
                        err: error,
                    });
                    return;
                }
            }
            case payTable.TAKE_MONEY: {
                console.log('payTable.TAKE_MONEY');
                console.log('payTable.AGENT');
                const requireTakeMoneyId = Number(id);
                const payHookBody = { ...req.body };
                payHookBody.agentPayId = null;
                payHookBody.orderId = null;
                payHookBody.walletId = walletId;
                payHookBody.requireTakeMoneyId = requireTakeMoneyId;
                mutateDB_createPayHook.setCreatePayHookBody(payHookBody);

                try {
                    const result1 = await mutateDB_createPayHook.run();
                    if (!(result1?.recordset.length && result1?.recordset.length > 0)) {
                        res.status(500).json({
                            message: 'Ghi payHook vào database không thành công !',
                        });
                        return;
                    }

                    const mutateDB_takeMoney = new MutateDB_TakeMoney();
                    mutateDB_takeMoney.set_connection_pool(connection_pool);
                    const takeMoneyBody: TakeMoneyBodyField = {
                        amount: payHookBody.transferAmount,
                        bankId: Number(parts[5]),
                        payHookId: payHookBody.id,
                        requireTakeMoneyId: requireTakeMoneyId,
                        walletId: walletId,
                        accountId: Number(parts[4]),
                    };
                    mutateDB_takeMoney.setTakeMoneyBody(takeMoneyBody);
                    const result2 = await mutateDB_takeMoney.run();
                    if (!(result2?.recordset.length && result2?.recordset.length > 0)) {
                        res.status(500).json({
                            message: 'Cập nhật TakeMoney không thành công !',
                        });
                        return;
                    }

                    // send message
                    // const wallet = result2.recordset[0];
                    // sendStringMessage(`takeMoney${prefix}`, JSON.stringify(wallet));
                    break;
                } catch (error) {
                    console.error(error);
                    res.status(500).json({
                        message: 'Đã có lỗi xảy ra !',
                        err: error,
                    });
                    return;
                }
            }
            default: {
                //statements;
                break;
            }
        }

        res.status(200).json({ success: true });
        return;
    };
}

export default Handle_SepayWebhook;
