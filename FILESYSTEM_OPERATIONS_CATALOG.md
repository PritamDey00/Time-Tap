# Filesystem Operations Catalog

## Overview

This document catalogs all filesystem operations found in the API routes and supporting library files. These operations need to be replaced with storage adapter calls for Vercel production compatibility.

## Summary

- **Total API Routes Analyzed**: 25+ routes
- **Library Files with Filesystem Operations**: 0 files (all migrated)
- **Direct Filesystem Operations in API Routes**: 0 (all operations are abstracted through library functions)
- **Total Filesystem Operations Found**: 0 (all migrated to storage adapters)
- **Migration Status**: ✅ **COMPLETED** - All filesystem operations have been successfully migrated to storage adapters

## Filesystem Operations by Library File

### 1. lib/classrooms.js ✅ MIGRATED

**File Path**: `project-root/lib/classrooms.js`
**Storage File**: `data/classrooms.json`
**Logical Storage Key**: `classrooms`

**Status**: ✅ **COMPLETED** - All filesystem operations have been migrated to storage adapters

**Previous Filesystem Operations** (now migrated):
- `fs.mkdir(DATA_DIR, { recursive: true })` - Line 55 (ensureStore function) → `storage.exists('classrooms')`
- `fs.access(CLASSROOMS_FILE)` - Line 57 (ensureStore function) → `storage.exists('classrooms')`
- `fs.writeFile(CLASSROOMS_FILE, JSON.stringify([universalClassroom], null, 2))` - Line 74 (ensureStore function) → `storage.set('classrooms', [universalClassroom])`
- `fs.readFile(CLASSROOMS_FILE, 'utf8')` - Line 80 (loadClassrooms function) → `storage.get('classrooms')`
- `fs.writeFile(CLASSROOMS_FILE, JSON.stringify(classrooms, null, 2))` - Line 86 (saveClassrooms function) → `storage.set('classrooms', classrooms)`

**API Routes Using This Library**:
- `/api/classrooms/index` - createClassroom, loadClassrooms
- `/api/classrooms/[id]` - findClassroomById, updateClassroom
- `/api/classrooms/[id]/join` - findClassroomById, addMemberToClassroom, verifyClassroomPassword
- `/api/classrooms/[id]/leave` - findClassroomById, removeMemberFromClassroom
- `/api/classrooms/[id]/users` - findClassroomById
- `/api/me` - addMemberToClassroom

### Removed Files (Unused)

The following files contained filesystem operations but were unused and have been removed:

- **lib/users.js** - ✅ Migrated to storage adapters
- **lib/todos.js** - ✅ Migrated to storage adapters  
- **lib/messages.js** - ❌ Removed (unused - no API endpoints)
- **lib/storage.js** - ❌ Removed (unused unified storage interface)
- **lib/migrations.js** - ❌ Removed (unused migration utilities)
- **scripts/backfill-timezone.js** - ❌ Removed (unused one-time script)

## Storage Key Mapping

| Current File Path | Logical Storage Key | Description | Data Structure |
|------------------|-------------------|-------------|----------------|
| `data/classrooms.json` | `classrooms` | Classroom definitions and membership | Array of classroom objects |

**Note**: The following files have been migrated to storage adapters or removed:
- `data/users.json` → `users` (migrated to storage adapters)
- `data/todos.json` → `todos` (migrated to storage adapters)
- `data/messages.json` → `messages` (removed - unused)

## Migration Strategy

### Phase 1: Replace Library Functions ✅ COMPLETED
1. ✅ Updated `lib/users.js` to use storage adapter instead of filesystem operations
2. ✅ Updated `lib/todos.js` to use storage adapter instead of filesystem operations  
3. ❌ Removed `lib/messages.js` (unused - no API endpoints)
4. ✅ Updated `lib/classrooms.js` to use storage adapter instead of filesystem operations

### Phase 2: Verify API Routes ✅ COMPLETED
Since all API routes use the library functions rather than direct filesystem operations, no changes were needed to the API routes themselves once the library functions were updated.

### Phase 3: Testing ✅ COMPLETED
- ✅ Test all 25+ API routes to ensure they continue working with storage adapters
- ✅ Verify data persistence and consistency
- ✅ Test error handling scenarios

## Risk Assessment

**Low Risk**: 
- All filesystem operations are well-abstracted through library functions
- No direct filesystem operations in API routes
- Clear separation of concerns

**Medium Risk**:
- Complex atomic write operations in todos.js (temporary files, renames)
- Backup file creation logic in todos.js
- Migration logic in users.js that modifies data during load

**High Risk**:
- Concurrent access handling in todos.js (save queue)
- Error recovery and file corruption handling
- Initialization of default data (universal classroom, empty arrays)

## Notes

- The `lib/storage/` directory already contains storage adapter implementations
- All filesystem operations use `fs/promises` (async/await pattern)
- Data is stored as JSON with pretty-printing (2-space indentation)
- Atomic writes are implemented using temporary files and rename operations
- Error handling includes backup creation for corrupted files
- Directory creation is handled with `{ recursive: true }` option