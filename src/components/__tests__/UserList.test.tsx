import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserList from '../UserList';
import { fetchUsers } from '../../services/api';

jest.mock('../../services/api');
const mockFetchUsers = fetchUsers as jest.MockedFunction<typeof fetchUsers>;

const mockUsers = [
  { userId: 'USER001' },
  { userId: 'USER002' },
  { userId: 'USER003' },
];

const mockPagedResponse = {
  content: mockUsers,
  page: 0,
  size: 20,
  totalElements: 50,
  totalPages: 3,
  first: true,
  last: false,
};

describe('UserList', () => {
  const mockOnUserSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchUsers.mockResolvedValue(mockPagedResponse);
  });

  it('renders users list correctly', async () => {
    render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('USER001')).toBeInTheDocument();
      expect(screen.getByText('USER002')).toBeInTheDocument();
      expect(screen.getByText('USER003')).toBeInTheDocument();
    });
  });

  it('calls onUserSelect when a user is clicked', async () => {
    render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('USER001')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('USER001'));
    expect(mockOnUserSelect).toHaveBeenCalledWith('USER001');
  });

  it('highlights selected user', async () => {
    render(<UserList selectedUserId="USER002" onUserSelect={mockOnUserSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('USER002')).toBeInTheDocument();
    });

    const selectedUserButton = screen.getByText('USER002').closest('button');
    expect(selectedUserButton).toHaveClass('bg-blue-100', 'border-blue-500');
  });

  describe('Pagination', () => {
    it('renders pagination when there are multiple pages', async () => {
      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument();
      });

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('does not render pagination when there is only one page', async () => {
      mockFetchUsers.mockResolvedValue({
        ...mockPagedResponse,
        totalPages: 1,
        last: true,
      });

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument();
      });

      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('disables Previous button on first page', async () => {
      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
      });

      const previousButton = screen.getByText('Previous').closest('a');
      expect(previousButton).toHaveClass('pointer-events-none', 'opacity-50');
    });

    it('disables Next button on last page', async () => {
      mockFetchUsers.mockResolvedValue({
        ...mockPagedResponse,
        page: 2,
        first: false,
        last: true,
      });

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next').closest('a');
      expect(nextButton?.className).toContain('pointer-events-none');
      expect(nextButton?.className).toContain('opacity-50');
    });

    it('navigates to next page when Next button is clicked', async () => {
      const user = userEvent.setup();
      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      expect(mockFetchUsers).toHaveBeenCalledWith(1, 20);
    });

    it('navigates to previous page when Previous button is clicked', async () => {
      const user = userEvent.setup();
      mockFetchUsers.mockResolvedValue({
        ...mockPagedResponse,
        page: 1,
        first: false,
      });

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
      });

      const previousButton = screen.getByText('Previous');
      await user.click(previousButton);

      expect(mockFetchUsers).toHaveBeenCalledWith(0, 20);
    });

    it('navigates to specific page when page number is clicked', async () => {
      const user = userEvent.setup();
      mockFetchUsers.mockResolvedValue({
        ...mockPagedResponse,
        totalPages: 5,
      });

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });

      const pageButton = screen.getByText('3');
      await user.click(pageButton);

      expect(mockFetchUsers).toHaveBeenCalledWith(2, 20);
    });

    it('does not navigate beyond last page when Next is clicked on last page', async () => {
      const user = userEvent.setup();
      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      mockFetchUsers.mockResolvedValue({
        ...mockPagedResponse,
        page: 2,
        first: false,
        last: true,
      });

      const pageButton = screen.getByText('3');
      await user.click(pageButton);

      await waitFor(() => {
        expect(mockFetchUsers).toHaveBeenLastCalledWith(2, 20);
      });

      mockFetchUsers.mockClear();
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      expect(mockFetchUsers).not.toHaveBeenCalled();
    });

    it('does not navigate before first page when Previous is clicked on first page', async () => {
      const user = userEvent.setup();
      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
      });

      const previousButton = screen.getByText('Previous');
      await user.click(previousButton);

      expect(mockFetchUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading state initially', () => {
      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
      
      expect(screen.getByText('Loading users...')).toBeInTheDocument();
      expect(screen.getByText('Loading users...').previousElementSibling).toHaveClass('animate-spin');
    });

    it('shows error state when API call fails', async () => {
      mockFetchUsers.mockRejectedValue(new Error('API Error'));

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('retries loading when Try Again button is clicked', async () => {
      const user = userEvent.setup();
      mockFetchUsers.mockRejectedValueOnce(new Error('API Error'));
      mockFetchUsers.mockResolvedValueOnce(mockPagedResponse);

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument();
      });
    });

    it('shows empty state when no users are found', async () => {
      mockFetchUsers.mockResolvedValue({
        ...mockPagedResponse,
        content: [],
        totalElements: 0,
        totalPages: 0,
      });

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });
  });

  describe('Debug Logging', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('logs page changes when handlePageChange is called', async () => {
      const user = userEvent.setup();
      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      expect(consoleSpy).toHaveBeenCalledWith('Changing page to:', 1, 'from:', 0);
    });

    it('logs useEffect triggers when currentPage changes', async () => {
      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('useEffect triggered, loading page:', 0);
      });
    });
  });
});
