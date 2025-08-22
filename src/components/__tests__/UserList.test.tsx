import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserList from '../UserList';
import { fetchUsers } from '../../services/api';
import { PagedResponse, User } from '../../types';

jest.mock('../../services/api');
const mockFetchUsers = fetchUsers as jest.MockedFunction<typeof fetchUsers>;

const mockUsers: User[] = [
  { userId: 'USER001' },
  { userId: 'USER002' },
  { userId: 'USER003' },
];

const createMockPagedResponse = (
  content: User[],
  page: number,
  totalPages: number,
  totalElements: number,
  isFirst: boolean = false,
  isLast: boolean = false
): PagedResponse<User> => ({
  content,
  page,
  size: 20,
  totalElements,
  totalPages,
  first: isFirst,
  last: isLast,
});

describe('UserList Pagination', () => {
  const mockOnUserSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render users and pagination controls', async () => {
    const mockResponse = createMockPagedResponse(mockUsers, 0, 3, 50, true, false);
    mockFetchUsers.mockResolvedValue(mockResponse);

    render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

    await waitFor(() => {
      expect(screen.getByText('USER001')).toBeInTheDocument();
      expect(screen.getByText('USER002')).toBeInTheDocument();
      expect(screen.getByText('USER003')).toBeInTheDocument();
    });

    expect(screen.getByText('50 total users')).toBeInTheDocument();
    expect(screen.getByLabelText(/next/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/previous/i)).toBeInTheDocument();
  });

  it('should call handlePageChange and trigger API call when Next button is clicked', async () => {
    const firstPageResponse = createMockPagedResponse(mockUsers, 0, 3, 50, true, false);
    const secondPageResponse = createMockPagedResponse(
      [{ userId: 'USER004' }, { userId: 'USER005' }],
      1,
      3,
      50,
      false,
      false
    );

    mockFetchUsers
      .mockResolvedValueOnce(firstPageResponse)
      .mockResolvedValueOnce(secondPageResponse);

    render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

    await waitFor(() => {
      expect(screen.getByText('USER001')).toBeInTheDocument();
    });

    const nextButton = screen.getByLabelText(/next/i);
    expect(nextButton).not.toHaveClass('pointer-events-none');

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockFetchUsers).toHaveBeenCalledTimes(2);
      expect(mockFetchUsers).toHaveBeenLastCalledWith(1, 20);
    });

    expect(console.log).toHaveBeenCalledWith('Changing page to:', 1, 'from:', 0);
    expect(console.log).toHaveBeenCalledWith('useEffect triggered, loading page:', 1);
  });

  it('should call handlePageChange and trigger API call when Previous button is clicked', async () => {
    const secondPageResponse = createMockPagedResponse(
      [{ userId: 'USER004' }, { userId: 'USER005' }],
      1,
      3,
      50,
      false,
      false
    );
    const firstPageResponse = createMockPagedResponse(mockUsers, 0, 3, 50, true, false);

    mockFetchUsers
      .mockResolvedValueOnce(secondPageResponse)
      .mockResolvedValueOnce(firstPageResponse);

    render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

    await waitFor(() => {
      expect(screen.getByText('USER004')).toBeInTheDocument();
    });

    const prevButton = screen.getByLabelText(/previous/i);
    expect(prevButton).not.toHaveClass('pointer-events-none');

    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(mockFetchUsers).toHaveBeenCalledTimes(2);
      expect(mockFetchUsers).toHaveBeenLastCalledWith(0, 20);
    });

    expect(console.log).toHaveBeenCalledWith('Changing page to:', 0, 'from:', 1);
    expect(console.log).toHaveBeenCalledWith('useEffect triggered, loading page:', 0);
  });

  it('should navigate to specific page when page number is clicked', async () => {
    const firstPageResponse = createMockPagedResponse(mockUsers, 0, 5, 100, true, false);
    const thirdPageResponse = createMockPagedResponse(
      [{ userId: 'USER007' }, { userId: 'USER008' }],
      2,
      5,
      100,
      false,
      false
    );

    mockFetchUsers
      .mockResolvedValueOnce(firstPageResponse)
      .mockResolvedValueOnce(thirdPageResponse);

    render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

    await waitFor(() => {
      expect(screen.getByText('USER001')).toBeInTheDocument();
    });

    const pageThreeButton = screen.getByRole('link', { name: '3' });
    fireEvent.click(pageThreeButton);

    await waitFor(() => {
      expect(mockFetchUsers).toHaveBeenCalledTimes(2);
      expect(mockFetchUsers).toHaveBeenLastCalledWith(2, 20);
    });

    expect(console.log).toHaveBeenCalledWith('Changing page to:', 2, 'from:', 0);
    expect(console.log).toHaveBeenCalledWith('useEffect triggered, loading page:', 2);
  });

  it('should disable Next button on last page', async () => {
    const lastPageResponse = createMockPagedResponse(
      [{ userId: 'USER099' }],
      2,
      3,
      50,
      false,
      true
    );
    mockFetchUsers.mockResolvedValue(lastPageResponse);

    render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

    await waitFor(() => {
      expect(screen.getByText('USER099')).toBeInTheDocument();
    });

    const nextButton = screen.getByLabelText(/next/i);
    expect(nextButton).toHaveClass('pointer-events-none opacity-50');

    fireEvent.click(nextButton);

    expect(mockFetchUsers).toHaveBeenCalledTimes(1);
    expect(console.log).not.toHaveBeenCalledWith('Changing page to:', 3, 'from:', 2);
  });

  it('should disable Previous button on first page', async () => {
    const firstPageResponse = createMockPagedResponse(mockUsers, 0, 3, 50, true, false);
    mockFetchUsers.mockResolvedValue(firstPageResponse);

    render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

    await waitFor(() => {
      expect(screen.getByText('USER001')).toBeInTheDocument();
    });

    const prevButton = screen.getByLabelText(/previous/i);
    expect(prevButton).toHaveClass('pointer-events-none opacity-50');

    fireEvent.click(prevButton);

    expect(mockFetchUsers).toHaveBeenCalledTimes(1);
    expect(console.log).not.toHaveBeenCalledWith('Changing page to:', -1, 'from:', 0);
  });

  it('should not show pagination when there is only one page', async () => {
    const singlePageResponse = createMockPagedResponse(mockUsers, 0, 1, 3, true, true);
    mockFetchUsers.mockResolvedValue(singlePageResponse);

    render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

    await waitFor(() => {
      expect(screen.getByText('USER001')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/next/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/previous/i)).not.toBeInTheDocument();
  });

  it('should handle user selection correctly', async () => {
    const mockResponse = createMockPagedResponse(mockUsers, 0, 1, 3, true, true);
    mockFetchUsers.mockResolvedValue(mockResponse);

    render(<UserList selectedUserId="USER002" onUserSelect={mockOnUserSelect} />);

    await waitFor(() => {
      expect(screen.getByText('USER002')).toBeInTheDocument();
    });

    const user001Button = screen.getByText('USER001').closest('button');
    const user002Button = screen.getByText('USER002').closest('button');

    expect(user002Button).toHaveClass('bg-blue-100 border-2 border-blue-500 text-blue-800');
    expect(user001Button).toHaveClass('bg-gray-50 hover:bg-gray-100 border-2 border-transparent text-gray-700');

    fireEvent.click(user001Button!);
    expect(mockOnUserSelect).toHaveBeenCalledWith('USER001');
  });

  it('should show loading state initially', () => {
    mockFetchUsers.mockImplementation(() => new Promise(() => {}));

    render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  it('should show error state and retry functionality', async () => {
    const errorMessage = 'Failed to fetch users';
    mockFetchUsers.mockRejectedValueOnce(new Error(errorMessage));

    render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    const retryButton = screen.getByText(/try again/i);
    expect(retryButton).toBeInTheDocument();

    const successResponse = createMockPagedResponse(mockUsers, 0, 1, 3, true, true);
    mockFetchUsers.mockResolvedValueOnce(successResponse);

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('USER001')).toBeInTheDocument();
    });

    expect(mockFetchUsers).toHaveBeenCalledTimes(2);
  });
});
