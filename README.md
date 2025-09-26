# Work Time Tracker

A modern, desktop-optimized web application for tracking work time, managing tasks, and generating productivity reports. Built with Svelte, DaisyUI, and designed for single-user productivity tracking with offline-first capabilities.

## ✨ Features

### ⏱️ Time Tracking
- **Precise Timer**: 1-second precision timer with visual feedback
- **Auto-stop Protection**: Configurable maximum duration (default: 12 hours) to prevent accidental overnight tracking
- **Task Switching**: Seamlessly switch between tasks without losing time
- **Manual Time Correction**: Adjust time entries with audit trail and notes

### 📋 Task Management
- **Dynamic Task Creation**: Create and manage unlimited work tasks
- **Active Task Selection**: Visual indicator of currently tracked task
- **Task Categories**: Color-coded tasks for better organization
- **Quick Task Switching**: Keyboard shortcuts and dropdown menus for rapid task changes

### 🍽️ Break Tracking
- **Meal Break Timer**: Separate timer for lunch and meal breaks
- **Activity Counters**: Track coffee breaks, bathroom breaks, and other activities with simple +1 counters
- **Break Deduction**: Automatic deduction of meal time from total presence calculation

### 📊 Reporting & Analytics
- **Daily Summaries**: Real-time view of daily work progress
- **Weekly Reports**: Monday-Friday summary with exportable data
- **Time Formatting**: Professional hh:mm format for external system compatibility
- **Presence Tracking**: Automatic calculation of arrival, departure, and total presence time
- **Efficiency Metrics**: Track task time vs. presence time ratios

### 🔧 Advanced Features
- **Offline-First**: Works completely offline with localStorage persistence
- **Auto-save**: Configurable auto-save intervals (default: 30 seconds)
- **Data Retention**: Automatic cleanup of data older than 5 weeks (configurable)
- **Keyboard Shortcuts**: Extensive keyboard shortcuts for power users
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Theme Support**: DaisyUI Bumblebee theme with desktop optimization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd task-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview

# Analyze bundle size
npm run analyze
```

## 💻 Usage Guide

### First-Time Setup
1. **Open the application** in your web browser
2. **Configure daily presence** requirement (default: 8 hours)
3. **Create your first task** using the Tasks view or Ctrl+N shortcut
4. **Start timing** by selecting a task and clicking Start Timer

### Daily Workflow
1. **Start your work day** by launching the app and starting a timer
2. **Switch between tasks** as needed using dropdown menus or keyboard shortcuts
3. **Track meal breaks** using the dedicated meal break timer
4. **Log activities** like coffee breaks using the activity counters
5. **Review your day** in the Reports view with daily and weekly summaries

### Advanced Usage
- **Manual time correction**: Access through the Audit view to adjust time entries
- **Data export**: Use the Settings view to export/import your tracking data
- **Keyboard shortcuts**: Press Shift+? to view all available shortcuts
- **Multiple task management**: Create categories of tasks and switch between them seamlessly

## ⌨️ Keyboard Shortcuts

### General
- `Shift + ?` - Show/hide keyboard shortcuts help
- `Escape` - Close modals and help dialogs
- `Ctrl/Cmd + S` - Manual save trigger

### Navigation
- `1` - Timer view
- `2` - Tasks view
- `3` - Reports view
- `4` - Settings view
- `5` - Audit view

### Timer Controls
- `Space` - Start/stop timer
- `Ctrl/Cmd + M` - Toggle meal break timer

### Task Management
- `Ctrl/Cmd + N` - Create new task
- `Ctrl/Cmd + T` - Switch to next task
- `Alt + ↑/↓` - Navigate through tasks

## 🏗️ Architecture

### Technology Stack
- **Framework**: Svelte (vanilla, no SvelteKit)
- **Build Tool**: Vite with optimized production builds
- **Styling**: Tailwind CSS + DaisyUI with Bumblebee theme
- **Storage**: Browser localStorage with JSON serialization
- **Testing**: Vitest + Svelte Testing Library

### Project Structure
```
src/
├── components/           # Svelte components
│   ├── Timer/           # Timer-related components
│   ├── Tasks/           # Task management components
│   ├── Reports/         # Reporting and analytics
│   ├── Settings/        # Application settings
│   ├── Counters/        # Activity counters
│   └── Icons/           # SVG icon components
├── services/            # Business logic services
├── models/              # Data models and validation
├── stores/              # Svelte stores for state management
└── utils/               # Utility functions

tests/
├── contracts/           # Service contract tests
├── integration/         # Integration tests
└── unit/               # Unit tests
```

### Data Model
- **localStorage**: Single root key with versioned schema
- **Data Retention**: Automatic cleanup after 5 weeks
- **Models**: Task, TimeEntry, WorkDay, MealBreak, ActivityCounter, Settings
- **Validation**: Client-side validation with error handling

## 📈 Performance

- **Bundle Size**: Optimized chunks under 500KB for JavaScript
- **Loading**: <3 second initial load on modern browsers
- **Responsiveness**: <100ms UI interaction response
- **Animations**: Smooth 60fps animations with GPU acceleration
- **Memory**: Efficient storage with automatic data cleanup

## 🔒 Privacy & Security

- **No External Calls**: Completely offline after initial load
- **Local Storage**: All data stored locally in your browser
- **No Tracking**: No analytics, cookies, or external services
- **Self-Hosted**: Can be hosted on any static file server

## 🛠️ Development

### Development Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run lint         # Lint code
npm run analyze      # Analyze bundle size
```

### Contributing Guidelines
1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request with clear description

### Testing Strategy
- **Contract Tests**: Service interface validation
- **Integration Tests**: User workflow validation
- **Unit Tests**: Component and utility testing
- **TDD Approach**: Tests written before implementation

## 📱 Browser Compatibility

- **Chrome**: Latest version (recommended)
- **Firefox**: Latest version
- **Safari**: Latest version
- **Edge**: Latest version
- **Mobile**: Desktop-optimized, mobile use not recommended

## 📋 FAQ

**Q: Can I use this on mobile?**
A: The application is desktop-optimized. While it may work on tablets, it's not recommended for phone screens.

**Q: How is my data stored?**
A: All data is stored in your browser's localStorage. No data leaves your device.

**Q: What happens if I close the browser while timing?**
A: The timer state is automatically saved and will resume when you reopen the application.

**Q: Can I export my data?**
A: Yes, use the Settings view to export all your data as JSON for backup or analysis.

**Q: How accurate is the timer?**
A: The timer has 1-second precision and includes drift correction for long-running sessions.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For bug reports and feature requests, please open an issue on the project repository.

---

**Made with ❤️ for productivity enthusiasts**
