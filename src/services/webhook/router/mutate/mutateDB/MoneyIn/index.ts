import sql from 'mssql';
import { WalletField } from '@src/dataStruct/wallet';
import { MoneyInBodyField } from '@src/dataStruct/wallet/body';

class MutateDB_MoneyIn {
    private _connectionPool: sql.ConnectionPool | undefined;
    private _moneyInBody: MoneyInBodyField | undefined;

    constructor() {}

    set_connection_pool(connectionPool: sql.ConnectionPool): void {
        this._connectionPool = connectionPool;
    }

    setMoneyInBody(moneyInBody: MoneyInBodyField): void {
        this._moneyInBody = moneyInBody;
    }

    async run(): Promise<sql.IProcedureResult<WalletField> | undefined> {
        if (this._connectionPool !== undefined && this._moneyInBody !== undefined) {
            try {
                const result = await this._connectionPool
                    .request()
                    .input('walletId', sql.Int, this._moneyInBody.walletId)
                    .input('addedAmount', sql.BigInt, this._moneyInBody.addedAmount)
                    .execute('MoneyIn');

                return result;
            } catch (error) {
                console.error(error);
            }
        }
    }
}

export default MutateDB_MoneyIn;
