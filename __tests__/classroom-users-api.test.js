/**
 * @jest-environment node
 */

import handler from '../pages/api/classrooms/[id]/users';
import { loadUsers } from '../lib/users';
import { findClassroomById } from '../lib/classrooms';

// Mock the dependencies
jest.mock('../lib/users');
jest.mock('../lib/classrooms');

describe('/api/classrooms/[id]/users', () => {
  let req, res;

  beforeEach(() => {
    req = {
      method: 'GET',
      query: { id: 'test-classroom-id' },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  test('returns classroom users successfully', async () => {
    const mockClassroom = {
      id: 'test-classroom-id',
      name: 'Test Classroom',
      members: ['user-1', 'user-2', 'user-3'],
    };

    const mockUsers = [
      {
        id: 'user-1',
        name: 'Alice',
        points: 150,
        streak: 3,
        lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago (online)
        isAnonymous: false,
        avatar: 'https://example.com/alice.jpg',
      },
      {
        id: 'user-2',
        name: 'Bob',
        points: 200,
        streak: 5,
        lastSeen: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago (away)
        isAnonymous: true,
        anonymousName: 'Anonymous User 123',
        avatar: null,
      },
      {
        id: 'user-3',
        name: 'Charlie',
        points: 100,
        streak: 2,
        lastSeen: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago (offline)
        isAnonymous: false,
        avatar: null,
      },
      {
        id: 'user-4',
        name: 'David',
        points: 300,
        streak: 10,
        lastSeen: new Date().toISOString(), // Just now (online)
        isAnonymous: false,
        avatar: null,
      },
    ];

    findClassroomById.mockResolvedValue(mockClassroom);
    loadUsers.mockResolvedValue(mockUsers);

    await handler(req, res);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      users: [
        {
          id: 'user-4',
          name: 'David',
          points: 300,
          streak: 10,
          lastConfirm: undefined,
          avatar: null,
          lastSeen: expect.any(String),
          onlineStatus: 'online',
          isAnonymous: false,
          anonymousName: null,
        },
        {
          id: 'user-1',
          name: 'Alice',
          points: 150,
          streak: 3,
          lastConfirm: undefined,
          avatar: 'https://example.com/alice.jpg',
          lastSeen: expect.any(String),
          onlineStatus: 'online',
          isAnonymous: false,
          anonymousName: null,
        },
        {
          id: 'user-2',
          name: 'Anonymous User 123',
          points: 200,
          streak: 5,
          lastConfirm: undefined,
          avatar: null,
          lastSeen: expect.any(String),
          onlineStatus: 'away',
          isAnonymous: true,
          anonymousName: 'Anonymous User 123',
        },
        {
          id: 'user-3',
          name: 'Charlie',
          points: 100,
          streak: 2,
          lastConfirm: undefined,
          avatar: null,
          lastSeen: expect.any(String),
          onlineStatus: 'offline',
          isAnonymous: false,
          anonymousName: null,
        },
      ],
      classroom: {
        id: 'test-classroom-id',
        name: 'Test Classroom',
        memberCount: 3,
      },
    });
  });

  test('filters users to only include classroom members', async () => {
    const mockClassroom = {
      id: 'test-classroom-id',
      name: 'Test Classroom',
      members: ['user-1', 'user-3'], // Only user-1 and user-3 are members
    };

    const mockUsers = [
      {
        id: 'user-1',
        name: 'Alice',
        points: 150,
        streak: 3,
        lastSeen: new Date().toISOString(),
        isAnonymous: false,
      },
      {
        id: 'user-2',
        name: 'Bob',
        points: 200,
        streak: 5,
        lastSeen: new Date().toISOString(),
        isAnonymous: false,
      },
      {
        id: 'user-3',
        name: 'Charlie',
        points: 100,
        streak: 2,
        lastSeen: new Date().toISOString(),
        isAnonymous: false,
      },
    ];

    findClassroomById.mockResolvedValue(mockClassroom);
    loadUsers.mockResolvedValue(mockUsers);

    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      users: expect.arrayContaining([
        expect.objectContaining({ id: 'user-1', name: 'Alice' }),
        expect.objectContaining({ id: 'user-3', name: 'Charlie' }),
      ]),
      classroom: expect.any(Object),
    });

    // Should not include user-2 who is not a member
    const response = res.json.mock.calls[0][0];
    expect(response.users).toHaveLength(2);
    expect(response.users.find(u => u.id === 'user-2')).toBeUndefined();
  });

  test('handles anonymous users correctly', async () => {
    const mockClassroom = {
      id: 'test-classroom-id',
      name: 'Test Classroom',
      members: ['user-1'],
    };

    const mockUsers = [
      {
        id: 'user-1',
        name: 'Alice',
        points: 150,
        streak: 3,
        lastSeen: new Date().toISOString(),
        isAnonymous: true,
        anonymousName: 'Mystery Student 456',
        avatar: 'https://example.com/alice.jpg',
      },
    ];

    findClassroomById.mockResolvedValue(mockClassroom);
    loadUsers.mockResolvedValue(mockUsers);

    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      users: [
        expect.objectContaining({
          id: 'user-1',
          name: 'Mystery Student 456', // Should use anonymous name
          avatar: null, // Should hide avatar for anonymous users
          isAnonymous: true,
          anonymousName: 'Mystery Student 456',
        }),
      ],
      classroom: expect.any(Object),
    });
  });

  test('returns 404 for non-existent classroom', async () => {
    findClassroomById.mockResolvedValue(null);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Classroom not found' });
  });

  test('returns 405 for non-GET methods', async () => {
    req.method = 'POST';

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  test('handles database errors gracefully', async () => {
    findClassroomById.mockRejectedValue(new Error('Database connection failed'));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  test('sorts users correctly by status, points, and name', async () => {
    const mockClassroom = {
      id: 'test-classroom-id',
      name: 'Test Classroom',
      members: ['user-1', 'user-2', 'user-3', 'user-4'],
    };

    const mockUsers = [
      {
        id: 'user-1',
        name: 'Charlie',
        points: 100,
        streak: 2,
        lastSeen: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // offline
        isAnonymous: false,
      },
      {
        id: 'user-2',
        name: 'Alice',
        points: 200,
        streak: 5,
        lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // online
        isAnonymous: false,
      },
      {
        id: 'user-3',
        name: 'Bob',
        points: 150,
        streak: 3,
        lastSeen: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // away
        isAnonymous: false,
      },
      {
        id: 'user-4',
        name: 'David',
        points: 250,
        streak: 7,
        lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // online
        isAnonymous: false,
      },
    ];

    findClassroomById.mockResolvedValue(mockClassroom);
    loadUsers.mockResolvedValue(mockUsers);

    await handler(req, res);

    const response = res.json.mock.calls[0][0];
    const userNames = response.users.map(u => u.name);

    // Should be sorted: online users first (David, Alice), then away (Bob), then offline (Charlie)
    // Within same status, sorted by points desc
    expect(userNames).toEqual(['David', 'Alice', 'Bob', 'Charlie']);
  });
});