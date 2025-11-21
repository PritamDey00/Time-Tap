import '@testing-library/jest-dom'

// Mock window.AudioContext for timer tests
global.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: jest.fn().mockReturnValue({
    type: '',
    frequency: { value: 0 },
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  }),
  createGain: jest.fn().mockReturnValue({
    gain: { value: 0 },
    connect: jest.fn(),
  }),
  destination: {},
  close: jest.fn(),
}))

// Mock Notification API
global.Notification = {
  permission: 'granted',
  requestPermission: jest.fn().mockResolvedValue('granted'),
}

// Mock fetch for API tests
global.fetch = jest.fn()