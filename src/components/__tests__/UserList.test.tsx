import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import UserList from '../UserList';
import * as api from '../../services/api';
import { getMockUsersPage } from '../../test/mocks/api';

vi.mock('../../services/api');

const mockFetchUsers = vi.mocked(api.fetchUsers);

describe('UserList', () => {
  const mockOnUserSelect = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const renderUserList = (selectedUserId: string | null = null) => {
    return render(
      <UserList
        selectedUserId={selectedUserId}
        onUserSelect={mockOnUserSelect}
      />
    );
  };

  describe('Pagination - Next Button', () => {
    it('should advance to next page when Next button is clicked and not on last page', async () => {
      const user = userEvent.setup();
      
      mockFetchUsers
        .mockResolvedValueOnce(getMockUsersPage(0, 20))
        .mockResolvedValueOnce(getMockUsersPage(1, 20));

      renderUserList();

      await waitFor(() => {
        expect(screen.getByText('user-1')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('link', { name: /go to next page/i });
      expect(nextButton).not.toHaveClass('pointer-events-none opacity-50');

      await user.click(nextButton);

      await waitFor(() => {
        expect(mockFetchUsers).toHaveBeenCalledWith(1, 20);
      });

      await waitFor(() => {
        expect(screen.getByText('user-21')).toBeInTheDocument();
      });
    });

    it('should be disabled on the last page', async () => {
      mockFetchUsers.mockResolvedValue(getMockUsersPage(2, 20));

      renderUserList();

      await waitFor(() => {
        expect(screen.getByText('user-41')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('link', { name: /go to next page/i });
      expect(nextButton).toHaveClass('pointer-events-none', 'opacity-50');
    });

    it('should not call handlePageChange when Next button is clicked on last page', async () => {
      const user = userEvent.setup();
      
      mockFetchUsers.mockResolvedValue(getMockUsersPage(2, 20));

      renderUserList();

      await waitFor(() => {
        expect(screen.getByText('user-41')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('link', { name: /go to next page/i });
      
      await user.click(nextButton);

      expect(mockFetchUsers).toHaveBeenCalledTimes(2);
    });
  });

  describe('Pagination - Previous Button', () => {
    it('should navigate to previous page when Previous button is clicked and not on first page', async () => {
      const user = userEvent.setup();
      
      mockFetchUsers
        .mockResolvedValueOnce(getMockUsersPage(1, 20))
        .mockResolvedValueOnce(getMockUsersPage(0, 20));

      renderUserList();

      await waitFor(() => {
        expect(screen.getByText('user-21')).toBeInTheDocument();
      });

      const prevButton = screen.getByRole('link', { name: /go to previous page/i });
      expect(prevButton).not.toHaveClass('pointer-events-none', 'opacity-50');

      await user.click(prevButton);

      await waitFor(() => {
        expect(mockFetchUsers).toHaveBeenCalledWith(0, 20);
      });

      await waitFor(() => {
        expect(screen.getByText('user-1')).toBeInTheDocument();
      });
    });

    it('should be disabled on the first page', async () => {
      mockFetchUsers.mockResolvedValue(getMockUsersPage(0, 20));

      renderUserList();

      await waitFor(() => {
        expect(screen.getByText('user-1')).toBeInTheDocument();
      });

      const prevButton = screen.getByRole('link', { name: /go to previous page/i });
      expect(prevButton).toHaveClass('pointer-events-none opacity-50');
    });

    it('should not call handlePageChange when Previous button is clicked on first page', async () => {
      const user = userEvent.setup();
      
      mockFetchUsers.mockResolvedValue(getMockUsersPage(0, 20));

      renderUserList();

      await waitFor(() => {
        expect(screen.getByText('user-1')).toBeInTheDocument();
      });

      const prevButton = screen.getByRole('link', { name: /go to previous page/i });
      
      await user.click(prevButton);

      expect(mockFetchUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pagination - Page Number Buttons', () => {
    it('should navigate to specific page when page number is clicked', async () => {
      const user = userEvent.setup();
      
      mockFetchUsers
        .mockResolvedValueOnce(getMockUsersPage(0, 20))
        .mockResolvedValueOnce(getMockUsersPage(1, 20));

      renderUserList();

      await waitFor(() => {
        expect(screen.getByText('user-1')).toBeInTheDocument();
      });

      const page2Button = screen.getByRole('link', { name: '2' });
      await user.click(page2Button);

      await waitFor(() => {
        expect(mockFetchUsers).toHaveBeenCalledWith(1, 20);
      });

      await waitFor(() => {
        expect(screen.getByText('user-21')).toBeInTheDocument();
      });
    });

    it('should highlight the current page', async () => {
      mockFetchUsers.mockResolvedValue(getMockUsersPage(1, 20));

      renderUserList();

      await waitFor(() => {
        expect(screen.getByText('user-21')).toBeInTheDocument();
      });

      const page2Button = screen.getByRole('link', { name: '2' });
      expect(page2Button).toBeInTheDocument();
    });
  });

  describe('User Selection', () => {
    it('should call onUserSelect when a user is clicked', async () => {
      const user = userEvent.setup();
      
      mockFetchUsers.mockResolvedValue(getMockUsersPage(0, 20));

      renderUserList();

      await waitFor(() => {
        expect(screen.getByText('user-1')).toBeInTheDocument();
      });

      const userButton = screen.getByText('user-1');
      await user.click(userButton);

      expect(mockOnUserSelect).toHaveBeenCalledWith('user-1');
    });

    it('should highlight the selected user', async () => {
      mockFetchUsers.mockResolvedValue(getMockUsersPage(0, 20));

      renderUserList('user-2');

      await waitFor(() => {
        expect(screen.getByText('user-2')).toBeInTheDocument();
      });

      const selectedUserButton = screen.getByText('user-2').closest('button');
      expect(selectedUserButton).toHaveClass('bg-blue-100 border-2 border-blue-500 text-blue-800');
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state initially', () => {
      mockFetchUsers.mockImplementation(() => new Promise(() => {}));

      renderUserList();

      expect(screen.getByText('Loading users...')).toBeInTheDocument();
      expect(screen.getByText('Loading users...')).toBeInTheDocument();
    });

    it('should show error state when API call fails', async () => {
      mockFetchUsers.mockRejectedValue(new Error('API Error'));

      renderUserList();

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should retry loading when Try Again button is clicked', async () => {
      const user = userEvent.setup();
      
      mockFetchUsers
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(getMockUsersPage(0, 20));

      renderUserList();

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('user-1')).toBeInTheDocument();
      });

      expect(mockFetchUsers).toHaveBeenCalledTimes(2);
    });

    it('should show empty state when no users are returned', async () => {
      mockFetchUsers.mockResolvedValue({
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      });

      renderUserList();

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination Display', () => {
    it('should not show pagination when there is only one page', async () => {
      mockFetchUsers.mockResolvedValue({
        content: [{ userId: 'user-1' }],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      });

      renderUserList();

      await waitFor(() => {
        expect(screen.getByText('user-1')).toBeInTheDocument();
      });

      expect(screen.queryByRole('navigation', { name: /pagination/i })).not.toBeInTheDocument();
    });

    it('should show pagination when there are multiple pages', async () => {
      mockFetchUsers.mockResolvedValue(getMockUsersPage(0, 20));

      renderUserList();

      await waitFor(() => {
        expect(screen.getByText('user-1')).toBeInTheDocument();
      });

      expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
    });

    it('should display correct total users count', async () => {
      mockFetchUsers.mockResolvedValue(getMockUsersPage(0, 20));

      renderUserList();

      await waitFor(() => {
        expect(screen.getByText('50 total users')).toBeInTheDocument();
      });
    });
  });
});
