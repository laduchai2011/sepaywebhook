import sql from 'mssql';
import { OrderField } from '@src/dataStruct/order';
import { UpdateOrderPaidBodyField } from '@src/dataStruct/order/body';

class MutateDB_UpdateOrderPaid {
    private _connectionPool: sql.ConnectionPool | undefined;
    private _updateOrderPaidBody: UpdateOrderPaidBodyField | undefined;

    constructor() {}

    set_connection_pool(connectionPool: sql.ConnectionPool): void {
        this._connectionPool = connectionPool;
    }

    setUpdateOrderPaidBody(updateOrderPaidBody: UpdateOrderPaidBodyField): void {
        this._updateOrderPaidBody = updateOrderPaidBody;
    }

    async run(): Promise<sql.IProcedureResult<OrderField> | undefined> {
        if (this._connectionPool !== undefined && this._updateOrderPaidBody !== undefined) {
            try {
                const result = await this._connectionPool
                    .request()
                    .input('id', sql.Int, this._updateOrderPaidBody.id)
                    .input('money', sql.BigInt, this._updateOrderPaidBody.money)
                    .execute('UpdateOrderPaid');

                return result;
            } catch (error) {
                console.error(error);
            }
        }
    }
}

export default MutateDB_UpdateOrderPaid;
