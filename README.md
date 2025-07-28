# 🧠 Yjs + Monaco Collaborative Code Editor

A real-time collaborative code editor built with React, Monaco Editor, and Yjs. Multiple users can edit code simultaneously with live cursor tracking, selection highlighting, and mouse pointer visualization.

## ✨ Features

- **Real-time Collaboration**: Multiple users can edit code simultaneously
- **Live Cursor Tracking**: See where other users are typing with colored cursor indicators
- **Selection Highlighting**: View other users' text selections with color-coded highlights
- **Mouse Pointer Tracking**: Follow other users' mouse movements in real-time
- **User Management**: See active users with unique colors and names
- **Clean Architecture**: Modular, maintainable code structure

## 🏗️ Architecture

### File Structure
```
src/
├── components/
│   ├── Editor.js                 # Main collaborative editor component
│   ├── Users.js                  # User list display component
│   └── hooks/                    # Custom hooks for functionality
│       ├── useCollaborativeSetup.js    # Initial setup and user management
│       ├── useLocalTracking.js         # Local cursor/selection/mouse tracking
│       ├── useRemoteCursors.js         # Remote cursor rendering
│       ├── useRemoteMousePointers.js   # Remote mouse pointer rendering
│       └── useRemoteSelections.js      # Remote selection highlighting
├── App.js                        # Main app component
├── App.css                       # Global styles
└── index.js                      # App entry point
```

### Component Responsibilities

#### `Editor.js` (Main Component)
- Orchestrates all collaborative features
- Manages Monaco Editor instance
- Coordinates between different hooks
- Handles cleanup and lifecycle

#### `Users.js` (User Display)
- Shows active users with colors
- Filters duplicate users
- Updates in real-time

#### Custom Hooks

**`useCollaborativeSetup`**
- Initializes user identity
- Sets up awareness system
- Handles tab close cleanup

**`useLocalTracking`**
- Tracks local cursor position
- Tracks local text selection
- Tracks local mouse movement
- Broadcasts changes to other users

**`useRemoteCursors`**
- Renders remote user cursors
- Creates cursor decorations
- Manages cursor styles

**`useRemoteMousePointers`**
- Renders remote mouse pointers
- Creates DOM elements for pointers
- Updates pointer positions

**`useRemoteSelections`**
- Renders remote text selections
- Creates selection decorations
- Manages selection styles

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd yjs-monaco-editor-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the Yjs WebSocket server**
   ```bash
   npm run start-server
   ```

4. **Start the React development server**
   ```bash
   npm start
   ```

5. **Open multiple browser tabs** to test collaboration

## 🛠️ Development

### Key Technologies
- **React**: UI framework
- **Monaco Editor**: Code editor component
- **Yjs**: CRDT for conflict-free collaboration
- **y-monaco**: Monaco Editor integration with Yjs
- **y-websocket**: WebSocket provider for real-time sync

### Code Quality
- **Modular Architecture**: Each feature is isolated in its own hook
- **Clean Separation**: UI components separate from business logic
- **Proper Cleanup**: All event listeners and decorations are cleaned up
- **Error Handling**: Guards against invalid ranges and states
- **Performance**: Debounced updates to prevent excessive re-renders

### Adding New Features
1. Create a new hook in `src/components/hooks/`
2. Import and use it in `Editor.js`
3. Follow the existing patterns for cleanup and error handling

## 📝 Usage

1. **Open the application** in multiple browser tabs
2. **Start typing** - you'll see your cursor and selections
3. **Watch other users** - their cursors, selections, and mouse movements appear
4. **Collaborate** - all changes sync in real-time

## 🔧 Configuration

### WebSocket Server
- Default port: `1234`
- Room name: `room-code-sync`
- Can be customized in `Editor.js`

### User Settings
- Random user names and colors
- Can be customized in `useCollaborativeSetup.js`

## 🐛 Troubleshooting

### Common Issues
1. **No collaboration**: Ensure WebSocket server is running
2. **Cursors not showing**: Check browser console for errors
3. **Performance issues**: Reduce number of simultaneous users

### Debug Mode
The application exposes debug objects in the browser console:
- `window.provider`: Yjs WebSocket provider
- `window.ydoc`: Yjs document instance

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions, please open an issue on GitHub.
