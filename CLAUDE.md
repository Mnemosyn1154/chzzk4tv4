# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WebOS TV application for watching CHZZK (치지직) streams on LG Smart TVs. The app is built with pure JavaScript (ES5) for compatibility with older WebOS TV models.

## Critical Requirements

### 🚨 ES5 ONLY - MANDATORY RULE 🚨
**THIS IS THE MOST IMPORTANT RULE**: This codebase MUST use ONLY ES5 JavaScript syntax for WebOS TV compatibility.

#### ❌ NEVER USE (Will break on older TVs):
- Arrow functions (`=>`) → Use `function() {}`
- Template literals (`` ` ``) → Use string concatenation with `+`
- `const` or `let` → Use `var` ONLY
- Array methods: `.find()`, `.includes()`, `.findIndex()` → Use for loops
- String methods: `.padStart()`, `.padEnd()`, `.repeat()` → Use custom ES5 implementations
- Object methods: `Object.assign()`, `Object.entries()` → Use ES5 alternatives
- Classes (`class MyClass {}`) → Use function constructors
- Destructuring (`{a, b} = obj` or `[x, y] = arr`) → Use direct property access
- Default parameters (`function(a = 1)`) → Use `a = a || 1` pattern
- Spread operator (`...args`) → Use `Array.prototype.slice.call(arguments)`
- `for...of` loops → Use traditional `for` loops
- Promise methods like `.finally()` → Use `.then()` and `.catch()` only
- Async/await → Use promises with `.then()`

#### ✅ ALWAYS USE (ES5 compatible):
- `var` for all variable declarations
- `function` keyword for all functions
- Traditional `for` loops and `for...in` loops
- String concatenation with `+`
- `Array.prototype.slice.call()` for array-like objects
- Polyfills or custom implementations for modern methods

#### Example:
```javascript
// ❌ WRONG - ES6+
const getName = (user) => user?.name || 'Anonymous';
const items = [...array1, ...array2];
array.find(item => item.id === targetId);

// ✅ CORRECT - ES5
var getName = function(user) {
    return (user && user.name) || 'Anonymous';
};
var items = array1.concat(array2);
var found;
for (var i = 0; i < array.length; i++) {
    if (array[i].id === targetId) {
        found = array[i];
        break;
    }
}
```

**Before writing ANY code, ask yourself: "Is this ES5?" If unsure, use the ES5 alternative.**

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
   - **ES5 ONLY** - Check EVERY line of code for ES5 compliance
   - Use existing utility functions in `/src/js/utils/`
   - Follow modular architecture patterns
   - Keep managers focused on single responsibilities
   - When in doubt, use the most conservative ES5 approach

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