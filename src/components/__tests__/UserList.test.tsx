import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserList from '../UserList'
import { fetchUsers } from '../../services/api'
import { PagedResponse, User } from '../../types'

vi.mock('../../services/api')

const mockFetchUsers = vi.mocked(fetchUsers)

const createMockUser = (id: string): User => ({
  userId: id,
})

const createMockPagedResponse = (
  page: number,
  size: number,
  totalElements: number
): PagedResponse<User> => {
  const totalPages = Math.ceil(totalElements / size)
  const startIndex = page * size
  const endIndex = Math.min(startIndex + size, totalElements)
  const content = Array.from(
    { length: endIndex - startIndex },
    (_, i) => createMockUser(`USER${String(startIndex + i + 1).padStart(3, '0')}`)
  )

  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    first: page === 0,
    last: page === totalPages - 1,
  }
}

describe('UserList', () => {
  const mockOnUserSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Pagination with >40 users', () => {
    it('should render pagination controls when there are more than 40 users', async () => {
      mockFetchUsers.mockResolvedValue(createMockPagedResponse(0, 20, 50))

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />)

      await waitFor(() => {
        expect(screen.getByText('50 total users')).toBeInTheDocument()
      })

      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should display correct users on first page', async () => {
      mockFetchUsers.mockResolvedValue(createMockPagedResponse(0, 20, 50))

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />)

      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument()
        expect(screen.getByText('USER020')).toBeInTheDocument()
      })

      expect(screen.queryByText('USER021')).not.toBeInTheDocument()
    })

    it('should navigate to next page when next button is clicked', async () => {
      const user = userEvent.setup()
      mockFetchUsers
        .mockResolvedValueOnce(createMockPagedResponse(0, 20, 50))
        .mockResolvedValueOnce(createMockPagedResponse(1, 20, 50))

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />)

      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument()
      })

      const nextButton = screen.getByRole('link', { name: /next/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(mockFetchUsers).toHaveBeenCalledWith(1, 20)
        expect(screen.getByText('USER021')).toBeInTheDocument()
        expect(screen.getByText('USER040')).toBeInTheDocument()
      })
    })

    it('should navigate to previous page when previous button is clicked', async () => {
      const user = userEvent.setup()
      
      mockFetchUsers
        .mockResolvedValueOnce(createMockPagedResponse(0, 20, 50))
        .mockResolvedValueOnce(createMockPagedResponse(1, 20, 50))
        .mockResolvedValueOnce(createMockPagedResponse(0, 20, 50))
      
      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />)

      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument()
      })

      const nextButton = screen.getByRole('link', { name: /next/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('USER021')).toBeInTheDocument()
      })
      
      const prevButton = screen.getByRole('link', { name: /previous/i })
      await user.click(prevButton)

      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument()
        expect(screen.getByText('USER020')).toBeInTheDocument()
      })
    })

    it('should navigate to specific page when page number is clicked', async () => {
      const user = userEvent.setup()
      
      mockFetchUsers.mockResolvedValue(createMockPagedResponse(0, 20, 50))
      
      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />)

      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument()
      })

      mockFetchUsers.mockClear()
      mockFetchUsers.mockResolvedValue(createMockPagedResponse(2, 20, 50))
      
      const page3Button = screen.getByRole('link', { name: '3' })
      await user.click(page3Button)

      await waitFor(() => {
        expect(mockFetchUsers).toHaveBeenCalledWith(2, 20)
      })
      
      await waitFor(() => {
        expect(screen.getByText('USER041')).toBeInTheDocument()
        expect(screen.getByText('USER050')).toBeInTheDocument()
      })
    })

    it('should disable previous button on first page', async () => {
      mockFetchUsers.mockResolvedValue(createMockPagedResponse(0, 20, 50))

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />)

      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument()
      })

      const prevButton = screen.getByRole('link', { name: /previous/i })
      expect(prevButton.className).toContain('pointer-events-none')
      expect(prevButton.className).toContain('opacity-50')
    })

    it('should disable next button on last page', async () => {
      mockFetchUsers.mockResolvedValue(createMockPagedResponse(2, 20, 50))

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />)

      await waitFor(() => {
        expect(screen.getByText('USER041')).toBeInTheDocument()
      })

      const nextButton = screen.getByRole('link', { name: /next/i })
      expect(nextButton.className).toContain('pointer-events-none')
      expect(nextButton.className).toContain('opacity-50')
    })

    it('should show ellipsis for large number of pages', async () => {
      mockFetchUsers.mockResolvedValue(createMockPagedResponse(5, 20, 200))

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />)

      await waitFor(() => {
        expect(screen.getByText('200 total users')).toBeInTheDocument()
      })

      const ellipsis = screen.queryAllByText('More pages')
      expect(ellipsis.length).toBeGreaterThan(0)
    })

    it('should highlight current page', async () => {
      mockFetchUsers.mockResolvedValue(createMockPagedResponse(0, 20, 50))

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />)

      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument()
      })

      const activePageLink = screen.getByRole('link', { current: 'page' })
      expect(activePageLink).toBeInTheDocument()
      expect(activePageLink.textContent).toBe('1')
    })
  })

  describe('User selection', () => {
    it('should call onUserSelect when user is clicked', async () => {
      const user = userEvent.setup()
      mockFetchUsers.mockResolvedValue(createMockPagedResponse(0, 20, 50))

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />)

      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument()
      })

      const userButton = screen.getByRole('button', { name: /USER001/i })
      await user.click(userButton)

      expect(mockOnUserSelect).toHaveBeenCalledWith('USER001')
    })

    it('should highlight selected user', async () => {
      mockFetchUsers.mockResolvedValue(createMockPagedResponse(0, 20, 50))

      render(<UserList selectedUserId="USER005" onUserSelect={mockOnUserSelect} />)

      await waitFor(() => {
        expect(screen.getByText('USER005')).toBeInTheDocument()
      })

      const selectedUserButton = screen.getByRole('button', { name: /USER005/i })
      expect(selectedUserButton.className).toContain('bg-blue-100')
      expect(selectedUserButton.className).toContain('border-blue-500')
      expect(selectedUserButton.className).toContain('text-blue-800')
    })
  })

  describe('Loading and error states', () => {
    it('should show loading state initially', () => {
      mockFetchUsers.mockImplementation(() => new Promise(() => {}))

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />)

      expect(screen.getByText('Loading users...')).toBeInTheDocument()
    })

    it('should show error state when API fails', async () => {
      const user = userEvent.setup()
      mockFetchUsers.mockRejectedValue(new Error('API Error'))

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />)

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /try again/i })
      expect(retryButton).toBeInTheDocument()

      mockFetchUsers.mockResolvedValue(createMockPagedResponse(0, 20, 50))
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('USER001')).toBeInTheDocument()
      })
    })

    it('should show empty state when no users found', async () => {
      mockFetchUsers.mockResolvedValue(createMockPagedResponse(0, 20, 0))

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />)

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument()
      })

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('should handle exactly 40 users (2 pages)', async () => {
      mockFetchUsers.mockResolvedValue(createMockPagedResponse(0, 20, 40))

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />)

      await waitFor(() => {
        expect(screen.getByText('40 total users')).toBeInTheDocument()
      })

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.queryByText('3')).not.toBeInTheDocument()
    })

    it('should handle single page with less than 20 users', async () => {
      mockFetchUsers.mockResolvedValue(createMockPagedResponse(0, 20, 15))

      render(<UserList selectedUserId={null} onUserSelect={mockOnUserSelect} />)

      await waitFor(() => {
        expect(screen.getByText('15 total users')).toBeInTheDocument()
      })

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    })
  })
})
