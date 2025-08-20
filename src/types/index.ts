export interface User {
  userId: string;
}

export interface BankAccount {
  accountId: string;
  userId: string;
  accountType: string;
  balance: number;
  accountName: string;
  status: string;
}
