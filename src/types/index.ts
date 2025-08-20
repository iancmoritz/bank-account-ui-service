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

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
