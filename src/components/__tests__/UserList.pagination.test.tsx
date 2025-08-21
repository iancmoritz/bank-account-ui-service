import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import UserList from '../UserList';
import * as api from '../../services/api';
import { PagedResponse, User } from '../../types';

const createMockUser = (id: string): User => ({
  userId: id,
});

const createMockPagedResponse = (
  users: User[],
  page: number,
  size: number,
  totalElements: number
): PagedResponse<User> => ({
  content: users,
  page,
  size,
  totalElements,
  totalPages: Math.ceil(totalElements / size),
  first: page === 0,
  last: page === Math.ceil(totalElements / size) - 1,
});

describe('UserList Pagination with >40 Users', () => {
  const mockOnUserSelect = vi.fn();
  let fetchUsersSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnUserSelect.mockClear();
    fetchUsersSpy = vi.spyOn(api, 'fetchUsers');
  });

  it('should show pagination controls when there are 50 users (3 pages)', async () => {
    const users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
    const mockResponse = createMockPagedResponse(users, 0, 20, 50);
    
    fetchUsersSpy.mockResolvedValue(mockResponse);

    render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

    await waitFor(() => {
      expect(screen.getByText('50 total users')).toBeInTheDocument();
    });

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should navigate between pages when there are 50 users', async () => {
    const page1Users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
    const page2Users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 21).padStart(3, '0')}`));
    
    const page1Response = createMockPagedResponse(page1Users, 0, 20, 50);
    const page2Response = createMockPagedResponse(page2Users, 1, 20, 50);
    
    fetchUsersSpy
      .mockResolvedValueOnce(page1Response)
      .mockResolvedValueOnce(page2Response);

    render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

    await waitFor(() => {
      expect(screen.getByText('USER001')).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('link', { name: /go to next page/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(fetchUsersSpy).toHaveBeenCalledWith(1, 20);
    });

    await waitFor(() => {
      expect(screen.getByText('USER021')).toBeInTheDocument();
    });
  });

  it('should handle exactly 41 users (3 pages)', async () => {
    const users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
    const mockResponse = createMockPagedResponse(users, 0, 20, 41);
    
    fetchUsersSpy.mockResolvedValue(mockResponse);

    render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

    await waitFor(() => {
      expect(screen.getByText('41 total users')).toBeInTheDocument();
    });

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should call onUserSelect when a user is clicked with pagination', async () => {
    const users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
    const mockResponse = createMockPagedResponse(users, 0, 20, 50);
    
    fetchUsersSpy.mockResolvedValue(mockResponse);

    render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

    await waitFor(() => {
      expect(screen.getByText('USER001')).toBeInTheDocument();
    });

    const userButton = screen.getByText('USER001');
    fireEvent.click(userButton);

    expect(mockOnUserSelect).toHaveBeenCalledWith('USER001');
  });
});
