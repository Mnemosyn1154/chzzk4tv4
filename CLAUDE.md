# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WebOS TV application for watching CHZZK (치지직) streams on LG Smart TVs. The app is built with pure JavaScript (ES5) for compatibility with older WebOS TV models.

## Critical Requirements

### ES5 Compatibility
**IMPORTANT**: This codebase MUST maintain ES5 compatibility. Do NOT use:
- Arrow functions (`=>`)
- Template literals (`` ` ``)
- `const` or `let` (use `var` only)
- Array methods like `.find()`, `.includes()` (use ES5 alternatives)
- String methods like `.padStart()` (use custom implementations)
- Classes or modern JavaScript features

### WebOS TV Constraints
- CORS restrictions apply - API calls must go through proper endpoints
- Limited modern browser API support
- Remote control is the primary input method
- Performance targets: 3-second stream entry, 60fps scrolling

## Common Development Commands

### WebOS Development
```bash
# Package the app into IPK file
ares-package .

# Install to TV or emulator
ares-install com.example.chzzk4lgtv4_*.ipk

# Launch the app
ares-launch com.example.chzzk4lgtv4

# Debug the app
ares-inspect com.example.chzzk4lgtv4

# Run local development server
ares-server .
```

### Dependency Management
```bash
# Install dependencies
npm install
```

Note: There are no build/lint/test scripts defined. The app runs directly without transpilation.

## Architecture Overview

### Directory Structure
- `/src/js/` - Main application code
  - `/api/` - CHZZK API integration (chzzk.js)
  - `/favorites/` - Favorite channel management
  - `/ui/` - UI components (cards, chat, navigation, search)
  - `/utils/` - Helper functions
- `/managers/` - Screen managers (refactored from watchScreen.js)
  - `InfoPopupManager.js` - Stream info popup
  - `PlayerStatusManager.js` - Player state management
  - `StreamManager.js` - Stream handling
  - `WatchFavoriteManager.js` - Favorite management in watch screen
  - `WatchUIManager.js` - Watch screen UI management
- `/ui/watchScreen.js` - Main watch screen controller
- `/assets/` - CSS and images
- `/libs/webOSTV.js` - WebOS TV SDK

### Key Components

1. **API Integration** (`src/js/api/chzzk.js`)
   - Handles all CHZZK API calls
   - Live stream lists, channel details, chat tokens
   - WebSocket chat connections

2. **Screen Management**
   - Recently refactored into 5 separate managers
   - Each manager handles specific functionality
   - Maintains clean separation of concerns

3. **Favorites System**
   - Uses localStorage for persistence
   - Auto-updates live status
   - Integrated throughout the app

4. **Chat System**
   - Real-time WebSocket integration
   - Toggle with remote control
   - ES5-compatible implementation

### Development Guidelines

1. **UI/UX Standards**
   - Green theme color: #61FF7E
   - No emojis unless explicitly requested
   - TV-optimized navigation with remote control
   - Support both 720p and 1080p resolutions

2. **Code Style**
   - Maintain ES5 syntax throughout
   - Use existing utility functions in `/src/js/utils/`
   - Follow modular architecture patterns
   - Keep managers focused on single responsibilities

3. **API Usage**
   - Refer to `chzzk_api_guide.md` for endpoint documentation
   - Handle CORS limitations properly
   - Use axios for HTTP requests

4. **Testing**
   - Test on WebOS TV simulator
   - Verify remote control navigation
   - Check ES5 compatibility
   - Test on actual TV devices when possible

## Current Development Status

- Version: 0.9.0 (near release)
- Recent: Chat feature completed, watchScreen.js refactored
- In Progress: Touch interface for StandbyMe device (T-026)
- Focus: Maintaining stability and ES5 compatibility