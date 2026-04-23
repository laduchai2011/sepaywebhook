import sql from 'mssql';
import { WalletField } from '@src/dataStruct/wallet';
import { TakeMoneyBodyField } from '@src/dataStruct/wallet/body';

class MutateDB_TakeMoney {
    private _connectionPool: sql.ConnectionPool | undefined;
    private _takeMoneyBody: TakeMoneyBodyField | undefined;

    constructor() {}

    set_connection_pool(connectionPool: sql.ConnectionPool): void {
        this._connectionPool = connectionPool;
    }

    setTakeMoneyBody(takeMoneyBody: TakeMoneyBodyField): void {
        this._takeMoneyBody = takeMoneyBody;
    }

    async run(): Promise<sql.IProcedureResult<WalletField> | undefined> {
        if (this._connectionPool !== undefined && this._takeMoneyBody !== undefined) {
            try {
                const result = await this._connectionPool
                    .request()
                    .input('amount', sql.Decimal(20, 2), this._takeMoneyBody.amount)
                    .input('bankId', sql.Int, this._takeMoneyBody.bankId)
                    .input('payHookId', sql.Int, this._takeMoneyBody.payHookId)
                    .input('requireTakeMoneyId', sql.Int, this._takeMoneyBody.requireTakeMoneyId)
                    .input('walletId', sql.Int, this._takeMoneyBody.walletId)
                    .input('accountId', sql.Int, this._takeMoneyBody.accountId)
                    .execute('TakeMoney');

                return result;
            } catch (error) {
                console.error(error);
            }
        }
    }
}

export default MutateDB_TakeMoney;
