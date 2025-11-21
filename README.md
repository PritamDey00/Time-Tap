```markdown
# Classroom Learning Platform (Next.js)

A comprehensive classroom learning platform with enhanced features:
- **Universal Classroom**: Main learning environment with timer, leaderboard, and chat
- **Custom Classrooms**: Create and join specific classroom instances
- **Real-time Chat**: WebSocket-powered messaging system
- **Anonymous Mode**: Privacy option for leaderboard participation
- **Mobile Optimized**: Responsive design with mobile-specific improvements
- **Progress Tracking**: Points, streaks, and achievement system

## Core Features

### Authentication & Navigation
- Register / Login (name + password)
- Streamlined navigation flow redirecting to classroom selection
- Universal Classroom as the central learning hub

### Learning System
- 30-minute countdown timer with confirmation system
- Points system: 1 point normally, 2 points for maintaining streaks
- Real-time leaderboard with anonymous mode option
- Offline user retention in classroom leaderboards

### Communication
- Real-time chat system with WebSocket connectivity
- Enhanced message delivery and chronological ordering
- Cross-tab notification system

### Classroom Management
- Universal Classroom for all users
- Custom classroom creation and management
- Leave classroom functionality with proper cleanup
- Membership-filtered leaderboards

This platform stores user data in `data/users.json` for development. For production deployments, replace with a persistent database.

## Quick Start (Local Development)

1. **Setup Files**: Copy the repo files to a folder
2. **Environment**: Create a `.env.local` file based on `.env.example`
3. **Install Dependencies**: 
   ```bash
   npm install
   ```
4. **Start Development Server**:
   ```bash
   npm run dev
   ```
5. **Access Application**: Open http://localhost:3000
6. **First Use**: Register an account and you'll be redirected to the classroom selection page

Notes
- Persistence: data/users.json is used. On serverless platforms that don't write to the filesystem, use a DB or external store.
- Security: This is a prototype. For production:
  - Use a proper DB
  - Use HTTPS
  - Use strong JWT secret in environment variables
  - Consider salt rounds & rate limiting

How the confirmation / streak logic works
- Each user has lastConfirm timestamp.
- When a user confirms:
  - If at least 30 minutes elapsed since lastConfirm, they are eligible.
  - If their previous confirmation was within 35 minutes of the one before it (i.e., consistent confirmations), they get 2 points and streak increments.
  - Otherwise they get 1 point and streak resets to 1.
  - lastConfirm is updated to now.
- The client enforces the 30-minute countdown; the server enforces eligibility too.

## API Endpoints

### Authentication
- `POST /api/register` - Register new user {name, password}
- `POST /api/login` - User login {name, password}
- `GET /api/me` - Get current user info

### User Management
- `GET /api/users` - Get all users for leaderboard
- `POST /api/confirm` - Confirm study session and earn points

### Classroom Management
- `GET /api/classrooms` - Get available classrooms
- `POST /api/classrooms` - Create new classroom
- `GET /api/classrooms/[id]` - Get specific classroom info
- `POST /api/classrooms/[id]/join` - Join a classroom
- `DELETE /api/classrooms/[id]/leave` - Leave a classroom
- `GET /api/classrooms/[id]/users` - Get classroom members

### Real-time Features
- `GET /api/classrooms/[id]/events` - WebSocket endpoint for real-time chat and updates

Environment
- Copy `.env.example` to `.env.local` and set JWT_SECRET.

## Project Structure

### Core Files
- `pages/` - Next.js pages and API routes
- `components/` - React components (AnalogClock, Timer, Leaderboard, ChatBox, etc.)
- `lib/` - Utility libraries and custom hooks
- `styles/` - CSS styling and responsive design
- `data/` - JSON-based data storage (development only)

### Key Components
- **Timer.jsx** - 30-minute countdown with confirmation system
- **Leaderboard.jsx** - Real-time rankings with anonymous mode
- **ChatBox.jsx** - Real-time messaging interface
- **ClassroomSettings.jsx** - Classroom management interface
- **AccountButton.jsx** - Mobile-optimized user account access

### Documentation
- `docs/ANONYMOUS_MODE_GUIDE.md` - Anonymous mode usage guide
- `docs/LEAVE_CLASSROOM_GUIDE.md` - Leave classroom feature guide
- `docs/UNIVERSAL_CLASSROOM_NAVIGATION.md` - Navigation flow documentation
- `docs/MOBILE_UI_IMPROVEMENTS.md` - Mobile optimization guide

## Recent Improvements

### Navigation & User Experience
- **Universal Classroom**: Renamed dashboard to Universal Classroom for clearer purpose
- **Streamlined Flow**: Login now redirects to classroom selection instead of dashboard
- **Mobile Optimization**: Fixed account panel icon display and improved touch targets
- **Consistent Terminology**: Updated all references from "dashboard" to "Universal Classroom"

### Real-time Features
- **Enhanced Chat**: Improved WebSocket stability and message delivery
- **Leaderboard Persistence**: Fixed disappearing leaderboards during window switches
- **Anonymous Mode**: Working privacy mode for leaderboard participation
- **Offline User Retention**: Maintain offline users in leaderboards until they manually leave

### Classroom Management
- **Leave Functionality**: Added ability to leave custom classrooms
- **Membership Filtering**: Show only joined users in custom classroom leaderboards
- **Settings Integration**: Classroom settings panel with leave classroom option

## Testing & Administration

- **Admin Panel**: Access `/admin` for testing timer states and notifications
- **Test Files**: Various test HTML files for feature verification
- **Comprehensive Tests**: Jest test suites for all major features

## Future Enhancements

Potential improvements for production deployment:
- Swap file persistence for SQLite (Prisma) or Firebase
- Add email/password reset functionality
- Implement push notifications for mobile apps
- Add classroom analytics and reporting
- Enhance visual design and animations
```