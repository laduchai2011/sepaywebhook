import sql from 'mssql';
import { AgentPayField } from '@src/dataStruct/agent';
import { UpdateAgentPaidBodyField } from '@src/dataStruct/agent/body';

class MutateDB_UpdateAgentPaid {
    private _connectionPool: sql.ConnectionPool | undefined;
    private _updateAgentPaidBody: UpdateAgentPaidBodyField | undefined;

    constructor() {}

    set_connection_pool(connectionPool: sql.ConnectionPool): void {
        this._connectionPool = connectionPool;
    }

    setUpdateAgentPaidBody(updateAgentPaidBody: UpdateAgentPaidBodyField): void {
        this._updateAgentPaidBody = updateAgentPaidBody;
    }

    async run(): Promise<sql.IProcedureResult<AgentPayField> | undefined> {
        if (this._connectionPool !== undefined && this._updateAgentPaidBody !== undefined) {
            try {
                const result = await this._connectionPool
                    .request()
                    .input('id', sql.Int, this._updateAgentPaidBody.id)
                    .execute('UpdateAgentPaid');

                return result;
            } catch (error) {
                console.error(error);
            }
        }
    }
}

export default MutateDB_UpdateAgentPaid;
