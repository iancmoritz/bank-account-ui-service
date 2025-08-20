import axios from 'axios';
import { User, BankAccount } from '../types';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const fetchUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get<User[]>('/api/v1/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
};

export const fetchAccountsByUserId = async (userId: string): Promise<BankAccount[]> => {
  try {
    const response = await api.get<BankAccount[]>(`/api/v1/accounts/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw new Error('Failed to fetch accounts');
  }
};
