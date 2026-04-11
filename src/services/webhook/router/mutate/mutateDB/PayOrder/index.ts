import sql from 'mssql';
import { WalletField } from '@src/dataStruct/wallet';
import { PayOrderBodyField } from '@src/dataStruct/wallet/body';

class MutateDB_PayOrder {
    private _connectionPool: sql.ConnectionPool | undefined;
    private _payOrderBody: PayOrderBodyField | undefined;

    constructor() {}

    set_connection_pool(connectionPool: sql.ConnectionPool): void {
        this._connectionPool = connectionPool;
    }

    setPayOrderBody(payOrderBody: PayOrderBodyField): void {
        this._payOrderBody = payOrderBody;
    }

    async run(): Promise<sql.IProcedureResult<WalletField> | undefined> {
        if (this._connectionPool !== undefined && this._payOrderBody !== undefined) {
            try {
                const result = await this._connectionPool
                    .request()
                    .input('walletId', sql.Int, this._payOrderBody.walletId)
                    .input('addedAmount', sql.Decimal(20, 2), this._payOrderBody.addedAmount)
                    .input('orderId', sql.Int, this._payOrderBody.orderId)
                    .input('payHookId', sql.Int, this._payOrderBody.payHookId)
                    .execute('PayOrder');

                return result;
            } catch (error) {
                console.error(error);
            }
        }
    }
}

export default MutateDB_PayOrder;
