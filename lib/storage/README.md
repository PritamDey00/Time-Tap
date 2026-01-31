# Storage Infrastructure

This directory contains the storage abstraction layer that enables the application to work in both development (filesystem) and production (Redis) environments.

## Architecture

The storage system uses an adapter pattern to provide a consistent interface across different storage backends:

```
API Routes → Storage Adapter → Backend (Filesystem | Redis)
```

## Components

### `adapter.js`
- **Factory function**: `createStorageAdapter()` - Creates appropriate adapter based on environment
- **Singleton function**: `getStorageAdapter()` - Returns cached adapter instance

### `filesystem-adapter.js`
- **Development storage**: Uses JSON files in `data/` directory
- **Maintains compatibility**: Preserves existing local development behavior
- **Atomic writes**: Uses temporary files for safe concurrent access

### `redis-adapter.js`
- **Production storage**: Uses Upstash Redis for serverless compatibility
- **Auto-serialization**: Handles JSON conversion automatically
- **Error handling**: Graceful degradation on connection issues

## Usage

```javascript
import { getStorageAdapter } from './lib/storage/adapter';

const storage = getStorageAdapter();

// Store data
await storage.set('users', userData);

// Retrieve data
const users = await storage.get('users');

// Check existence
const exists = await storage.exists('users');

// Delete data
await storage.delete('users');
```

## Environment Configuration

### Development
No configuration needed - uses filesystem automatically.

### Production
Set these environment variables:

```bash
NODE_ENV=production
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

## Storage Key Mapping

| Original File | Storage Key | Description |
|---------------|-------------|-------------|
| `data/users.json` | `users` | User accounts and profiles |
| `data/todos.json` | `todos` | Todo items and tasks |
| `data/classrooms.json` | `classrooms` | Classroom data |

## Error Handling

- **Graceful degradation**: Returns `null` for missing data instead of throwing
- **Logging**: Errors are logged but don't crash the application
- **Atomic operations**: Filesystem writes use temporary files to prevent corruption
- **Connection resilience**: Redis adapter handles network issues gracefully

## Testing

Run storage tests:
```bash
npx jest lib/storage
```

Tests cover:
- Environment-based adapter selection
- Data persistence and retrieval
- Error handling scenarios
- Concurrent access patterns