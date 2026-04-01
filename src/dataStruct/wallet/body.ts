export interface CreateWalletBodyField {
    amount: number;
    type: string;
    accountId: number;
}

export interface MoneyInBodyField {
    id: number;
    addedAmount: number;
}

export interface MoneyOutBodyField {
    subAmount: number;
    type: string;
    accountId: number;
}
