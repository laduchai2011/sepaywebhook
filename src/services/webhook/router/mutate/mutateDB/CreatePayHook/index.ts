import sql from 'mssql';
import { PayHookField } from '@src/dataStruct/payHook';
import { CreatePayHookBodyField } from '@src/dataStruct/payHook/body';

class MutateDB_CreatePayHook {
    private _connectionPool: sql.ConnectionPool | undefined;
    private _createPayHookBody: CreatePayHookBodyField | undefined;

    constructor() {}

    set_connection_pool(connectionPool: sql.ConnectionPool): void {
        this._connectionPool = connectionPool;
    }

    setCreatePayHookBody(createPayHookBody: CreatePayHookBodyField): void {
        this._createPayHookBody = createPayHookBody;
    }

    async run(): Promise<sql.IProcedureResult<PayHookField> | undefined> {
        if (this._connectionPool !== undefined && this._createPayHookBody !== undefined) {
            try {
                const result = await this._connectionPool
                    .request()
                    .input('id', sql.Int, this._createPayHookBody.id)
                    .input('gateway', sql.VarChar(255), this._createPayHookBody.gateway)
                    .input('transactionDate', sql.DateTime, this._createPayHookBody.transactionDate)
                    .input('accountNumber', sql.VarChar(255), this._createPayHookBody.accountNumber)
                    .input('subAccount', sql.VarChar(255), this._createPayHookBody.subAccount)
                    .input('code', sql.VarChar(255), this._createPayHookBody.code)
                    .input('content', sql.VarChar(255), this._createPayHookBody.content)
                    .input('transferType', sql.VarChar(255), this._createPayHookBody.transferType)
                    .input('description', sql.VarChar(255), this._createPayHookBody.description)
                    .input('transferAmount', sql.Decimal(20, 2), this._createPayHookBody.transferAmount)
                    .input('referenceCode', sql.VarChar(255), this._createPayHookBody.referenceCode)
                    .input('accumulated', sql.Decimal(20, 2), this._createPayHookBody.accumulated)
                    .input('agentPayId', sql.Int, this._createPayHookBody.agentPayId)
                    .input('orderId', sql.Int, this._createPayHookBody.orderId)
                    .input('requireTakeMoneyId', sql.Int, this._createPayHookBody.requireTakeMoneyId)
                    .input('walletId', sql.Int, this._createPayHookBody.walletId)
                    .execute('CreatePayHook');

                return result;
            } catch (error) {
                console.error(error);
            }
        }
    }
}

export default MutateDB_CreatePayHook;
