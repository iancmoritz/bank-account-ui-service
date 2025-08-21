import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import UserList from '../UserList';
import { fetchUsers } from '../../services/api';
import { PagedResponse, User } from '../../types';

vi.mock('../../services/api', () => ({
  fetchUsers: vi.fn(),
}));

const mockFetchUsers = vi.mocked(fetchUsers);

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

describe('UserList', () => {
  const mockOnUserSelect = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockFetchUsers.mockClear();
    mockOnUserSelect.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Pagination with <= 20 users (no pagination)', () => {
    it('should not show pagination controls when there are 15 users', async () => {
      const users = Array.from({ length: 15 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
      const mockResponse = createMockPagedResponse(users, 0, 20, 15);
      
      mockFetchUsers.mockResolvedValue(mockResponse);

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

      await waitFor(() => {
        expect(screen.getByText('15 total users')).toBeInTheDocument();
      });

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('should not show pagination controls when there are exactly 20 users', async () => {
      const users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
      const mockResponse = createMockPagedResponse(users, 0, 20, 20);
      
      mockFetchUsers.mockResolvedValue(mockResponse);

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

      await waitFor(() => {
        expect(screen.getByText('20 total users')).toBeInTheDocument();
      });

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });
  });

  describe('Pagination with > 20 users (pagination required)', () => {
    it('should show pagination controls when there are 25 users (2 pages)', async () => {
      const users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
      const mockResponse = createMockPagedResponse(users, 0, 20, 25);
      
      mockFetchUsers.mockResolvedValue(mockResponse);

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

      await waitFor(() => {
        expect(screen.getByText('25 total users')).toBeInTheDocument();
      });

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /go to previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /go to next page/i })).toBeInTheDocument();
    });

    it('should show pagination controls when there are exactly 41 users (3 pages)', async () => {
      const users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
      const mockResponse = createMockPagedResponse(users, 0, 20, 41);
      
      mockFetchUsers.mockResolvedValue(mockResponse);

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

      await waitFor(() => {
        expect(screen.getByText('41 total users')).toBeInTheDocument();
      });

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should show pagination controls with ellipsis when there are 50 users (3 pages)', async () => {
      const users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
      const mockResponse = createMockPagedResponse(users, 0, 20, 50);
      
      mockFetchUsers.mockResolvedValue(mockResponse);

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

      await waitFor(() => {
        expect(screen.getByText('50 total users')).toBeInTheDocument();
      });

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Pagination navigation', () => {
    it('should disable Previous button on first page', async () => {
      const users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
      const mockResponse = createMockPagedResponse(users, 0, 20, 50);
      
      mockFetchUsers.mockResolvedValue(mockResponse);

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

      await waitFor(() => {
        expect(screen.getByText('50 total users')).toBeInTheDocument();
      });

      const previousButton = screen.getByRole('link', { name: /go to previous page/i });
      expect(previousButton).toHaveClass('pointer-events-none', 'opacity-50');
    });

    it('should disable Next button on last page', async () => {
      const users = Array.from({ length: 10 }, (_, i) => createMockUser(`USER${String(i + 41).padStart(3, '0')}`));
      const mockResponse = createMockPagedResponse(users, 2, 20, 50);
      
      mockFetchUsers.mockResolvedValue(mockResponse);

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

      await waitFor(() => {
        expect(screen.getByText('50 total users')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('link', { name: /go to next page/i });
      expect(nextButton).toHaveClass('pointer-events-none', 'opacity-50');
    });

    it('should navigate to next page when Next button is clicked', async () => {
      const page1Users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
      const page2Users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 21).padStart(3, '0')}`));
      
      const page1Response = createMockPagedResponse(page1Users, 0, 20, 50);
      const page2Response = createMockPagedResponse(page2Users, 1, 20, 50);
      
      mockFetchUsers
        .mockResolvedValueOnce(page1Response)
        .mockResolvedValueOnce(page2Response);

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('link', { name: /go to next page/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockFetchUsers).toHaveBeenCalledWith(1, 20);
      });

      await waitFor(() => {
        expect(screen.getByText('USER021')).toBeInTheDocument();
      });
    });

    it('should navigate to previous page when Previous button is clicked', async () => {
      const page2Users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 21).padStart(3, '0')}`));
      const page1Users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
      
      const page2Response = createMockPagedResponse(page2Users, 1, 20, 50);
      const page1Response = createMockPagedResponse(page1Users, 0, 20, 50);
      
      mockFetchUsers
        .mockResolvedValueOnce(page2Response)
        .mockResolvedValueOnce(page1Response);

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

      await waitFor(() => {
        expect(screen.getByText('USER021')).toBeInTheDocument();
      });

      const previousButton = screen.getByRole('link', { name: /go to previous page/i });
      fireEvent.click(previousButton);

      await waitFor(() => {
        expect(mockFetchUsers).toHaveBeenCalledWith(0, 20);
      });

      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument();
      });
    });

    it('should navigate to specific page when page number is clicked', async () => {
      const page1Users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
      const page3Users = Array.from({ length: 10 }, (_, i) => createMockUser(`USER${String(i + 41).padStart(3, '0')}`));
      
      const page1Response = createMockPagedResponse(page1Users, 0, 20, 50);
      const page3Response = createMockPagedResponse(page3Users, 2, 20, 50);
      
      mockFetchUsers
        .mockResolvedValueOnce(page1Response)
        .mockResolvedValueOnce(page3Response);

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument();
      });

      const page3Button = screen.getByText('3');
      fireEvent.click(page3Button);

      await waitFor(() => {
        expect(mockFetchUsers).toHaveBeenCalledWith(2, 20);
      });

      await waitFor(() => {
        expect(screen.getByText('USER041')).toBeInTheDocument();
      });
    });
  });

  describe('User selection with pagination', () => {
    it('should call onUserSelect when a user is clicked', async () => {
      const users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
      const mockResponse = createMockPagedResponse(users, 0, 20, 50);
      
      mockFetchUsers.mockResolvedValue(mockResponse);

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument();
      });

      const userButton = screen.getByText('USER001');
      fireEvent.click(userButton);

      expect(mockOnUserSelect).toHaveBeenCalledWith('USER001');
    });

    it('should highlight selected user', async () => {
      const users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
      const mockResponse = createMockPagedResponse(users, 0, 20, 50);
      
      mockFetchUsers.mockResolvedValue(mockResponse);

      render(<UserList selectedUserId="USER005" onUserSelect={mockOnUserSelect} />);

      await waitFor(() => {
        expect(screen.getByText('USER005')).toBeInTheDocument();
      });

      const selectedUserButton = screen.getByText('USER005').closest('button');
      expect(selectedUserButton).toHaveClass('bg-blue-100', 'border-blue-500', 'text-blue-800');
    });
  });

  describe('Error handling', () => {
    it('should show error message when API call fails', async () => {
      mockFetchUsers.mockRejectedValue(new Error('Failed to fetch users'));

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch users')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should retry API call when Try Again button is clicked', async () => {
      const users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
      const mockResponse = createMockPagedResponse(users, 0, 20, 50);
      
      mockFetchUsers
        .mockRejectedValueOnce(new Error('Failed to fetch users'))
        .mockResolvedValueOnce(mockResponse);

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch users')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner while fetching users', async () => {
      const users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
      const mockResponse = createMockPagedResponse(users, 0, 20, 50);
      
      mockFetchUsers.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockResponse), 100)));

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

      expect(screen.getByText('Loading users...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('Edge cases with large datasets', () => {
    it('should handle 100 users across 5 pages', async () => {
      const users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
      const mockResponse = createMockPagedResponse(users, 0, 20, 100);
      
      mockFetchUsers.mockResolvedValue(mockResponse);

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

      await waitFor(() => {
        expect(screen.getByText('100 total users')).toBeInTheDocument();
      });

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should handle exactly 60 users (3 full pages)', async () => {
      const users = Array.from({ length: 20 }, (_, i) => createMockUser(`USER${String(i + 1).padStart(3, '0')}`));
      const mockResponse = createMockPagedResponse(users, 0, 20, 60);
      
      mockFetchUsers.mockResolvedValue(mockResponse);

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

      await waitFor(() => {
        expect(screen.getByText('60 total users')).toBeInTheDocument();
      });

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
