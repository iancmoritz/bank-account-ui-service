import { User, PagedResponse } from '../../types';

export const createMockUser = (userId: string): User => ({
  userId,
});

export const createMockPagedResponse = (
  users: User[],
  page: number,
  size: number,
  totalElements: number
): PagedResponse<User> => {
  const totalPages = Math.ceil(totalElements / size);
  return {
    content: users,
    page,
    size,
    totalElements,
    totalPages,
    first: page === 0,
    last: page === totalPages - 1,
  };
};

export const mockUsers = Array.from({ length: 50 }, (_, i) =>
  createMockUser(`user-${i + 1}`)
);

export const getMockUsersPage = (page: number, size: number = 20): PagedResponse<User> => {
  const startIndex = page * size;
  const endIndex = Math.min(startIndex + size, mockUsers.length);
  const pageUsers = mockUsers.slice(startIndex, endIndex);
  
  return createMockPagedResponse(pageUsers, page, size, mockUsers.length);
};
