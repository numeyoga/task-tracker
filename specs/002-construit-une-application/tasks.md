# Tasks: Work Time Tracking Web Application

**Input**: Design documents from `/specs/002-construit-une-application/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Phase 3.1: Setup & Configuration

- [x] T001 Initialize Vite project with vanilla Svelte template (no SvelteKit) in project root
- [x] T002 [P] Configure package.json with Svelte, DaisyUI, Tailwind CSS, and Vitest dependencies (JavaScript only)
- [x] T003 [P] Setup Vite config with build optimization and GitHub Pages base path for SPA
- [x] T004 [P] Configure ESLint and Prettier for JavaScript code quality with Svelte support
- [x] T005 [P] Setup Tailwind config with DaisyUI plugin and Bumblebee theme selection
- [x] T006 [P] Create basic project structure: src/components/, src/services/, src/models/, src/stores/, src/utils/

## Phase 3.2: Contract Tests (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T007 [P] Contract test for DataService in tests/contracts/DataService.test.js
- [x] T008 [P] Contract test for TimerService in tests/contracts/TimerService.test.js
- [x] T009 [P] Contract test for TaskService in tests/contracts/TaskService.test.js
- [x] T010 [P] Contract test for ReportService in tests/contracts/ReportService.test.js
- [x] T011 [P] Integration test: First-time user setup in tests/integration/setup.test.js
- [x] T012 [P] Integration test: Basic timer operations in tests/integration/timer.test.js
- [x] T013 [P] Integration test: Task switching in tests/integration/task-switching.test.js
- [x] T014 [P] Integration test: Meal break tracking in tests/integration/meal-break.test.js
- [x] T015 [P] Integration test: Manual time corrections in tests/integration/time-correction.test.js
- [x] T016 [P] Integration test: Weekly reporting in tests/integration/reporting.test.js
- [x] T017 [P] Integration test: Data persistence in tests/integration/persistence.test.js

## Phase 3.3: Data Models (ONLY after tests are failing)

- [x] T018 [P] Create Task entity model in src/models/Task.js with validation (JavaScript)
- [x] T019 [P] Create TimeEntry entity model in src/models/TimeEntry.js with validation (JavaScript)
- [x] T020 [P] Create WorkDay entity model in src/models/WorkDay.js with validation (JavaScript)
- [x] T021 [P] Create MealBreak entity model in src/models/MealBreak.js with validation (JavaScript)
- [x] T022 [P] Create ActivityCounter entity model in src/models/ActivityCounter.js with validation (JavaScript)
- [x] T023 [P] Create Settings entity model in src/models/Settings.js with validation (JavaScript)

## Phase 3.4: Core Services Implementation

- [x] T024 DataService implementation in src/services/DataService.js (localStorage operations)
- [x] T025 TimerService implementation in src/services/TimerService.js (timer logic and auto-stop)
- [x] T026 TaskService implementation in src/services/TaskService.js (task management)
- [x] T027 ReportService implementation in src/services/ReportService.js (weekly summaries)
- [x] T028 SettingsService implementation in src/services/SettingsService.js (user preferences)
- [x] T029 Create service registry in src/services/index.js for dependency injection

## Phase 3.5: Svelte Stores & State Management

- [x] T030 [P] Create timer store in src/stores/timer.js (current timer state, elapsed time)
- [x] T031 [P] Create tasks store in src/stores/tasks.js (task list, active task)
- [x] T032 [P] Create settings store in src/stores/settings.js (user configuration)
- [x] T033 [P] Create view store in src/stores/view.js (current view state, no routing)
- [x] T034 [P] Create reports store in src/stores/reports.js (daily/weekly data)
- [x] T035 Create stores index in src/stores/index.js with store subscriptions

## Phase 3.6: UI Components (Single-Page App)

- [x] T036 [P] Main App component in src/App.svelte (single page layout, view switching)
- [x] T037 [P] Navigation component in src/components/Navigation.svelte (view switcher buttons)
- [x] T038 [P] Timer display component in src/components/Timer/TimerView.svelte (hh:mm:ss format)
- [x] T039 [P] Timer controls component in src/components/Timer/TimerControls.svelte (start/stop buttons)
- [x] T040 [P] Task list component in src/components/Tasks/TaskList.svelte (with DaisyUI Bumblebee theme)
- [x] T041 [P] Task form component in src/components/Tasks/TaskForm.svelte (create/edit tasks)
- [x] T042 [P] Active task selector in src/components/Tasks/ActiveTaskSelector.svelte (quick switching)
- [x] T043 [P] Meal break timer in src/components/Timer/MealBreakTimer.svelte (separate meal timer)
- [x] T044 [P] Activity counters in src/components/Counters/ActivityCounters.svelte (coffee, breaks +1)
- [x] T045 [P] Daily summary view in src/components/Reports/ReportsView.svelte (daily totals)
- [x] T046 [P] Weekly report view in src/components/Reports/WeeklyReport.svelte (Monday-Friday)
- [x] T047 [P] Settings panel in src/components/Settings/SettingsView.svelte (preferences)
- [x] T048 [P] Time correction modal in src/components/Timer/TimeCorrectionModal.svelte (manual adjustments)
- [x] T049 [P] Audit view in src/components/Reports/AuditView.svelte (complete history)

## Phase 3.7: View Management (No Routing)

- [x] T050 Implement view switching logic in src/App.svelte using view store
- [x] T051 Create smooth transitions between views using CSS/Svelte animations
- [x] T052 Implement localStorage auto-save with 30-second interval
- [x] T053 Add keyboard shortcuts for common actions (start/stop timer, switch tasks)

## Phase 3.8: GitHub Actions & Deployment

- [x] T054 [P] Create GitHub Actions workflow in .github/workflows/deploy.yml
- [x] T055 [P] Configure npm security audit and dependency scanning in workflow
- [x] T056 [P] Setup GitHub Pages deployment with SPA configuration
- [x] T057 [P] Add Vite build optimization for production bundle
- [x] T058 Create 404.html redirect for GitHub Pages SPA support

## Phase 3.9: Integration & Polish

- [x] T059 Add error boundary and comprehensive error handling
- [x] T060 Implement auto-stop timer protection (configurable 12-hour maximum)
- [x] T061 Add 5-week data retention cleanup with automated purging
- [x] T062 [P] Create SVG icon components in src/components/Icons/ (no external resources)
- [x] T063 [P] Polish UI with DaisyUI Bumblebee theme styling and desktop optimization
- [x] T064 [P] Add loading states and smooth animations (60fps target)
- [x] T065 [P] Performance optimization: component lazy loading and bundle analysis
- [x] T066 Create user documentation in README.md with application screenshots

## Dependencies

**Critical Dependencies**:
- Setup (T001-T006) before all other phases
- Contract tests (T007-T017) before implementation (T018+)
- Data models (T018-T023) before services (T024-T029)
- Services and stores (T024-T035) before UI components (T036-T049)
- Core components before view management (T050-T053)
- Implementation complete before deployment (T054-T058)

**Parallel Opportunities**:
- All [P] tasks within same phase can run concurrently
- Different service tests can run simultaneously
- Different component files developed in parallel
- Different store files can be created independently
- Documentation and polish tasks can run together

## Parallel Execution Examples

### Contract Tests Phase (after setup complete)
```
Task: "Contract test for DataService in tests/contracts/DataService.test.js"
Task: "Contract test for TimerService in tests/contracts/TimerService.test.js"
Task: "Contract test for TaskService in tests/contracts/TaskService.test.js"
Task: "Contract test for ReportService in tests/contracts/ReportService.test.js"
```

### Data Models Phase
```
Task: "Create Task entity model in src/models/Task.js with validation (JavaScript)"
Task: "Create TimeEntry entity model in src/models/TimeEntry.js with validation (JavaScript)"
Task: "Create WorkDay entity model in src/models/WorkDay.js with validation (JavaScript)"
Task: "Create Settings entity model in src/models/Settings.js with validation (JavaScript)"
```

### Svelte Stores Phase
```
Task: "Create timer store in src/stores/timer.js (current timer state, elapsed time)"
Task: "Create tasks store in src/stores/tasks.js (task list, active task)"
Task: "Create settings store in src/stores/settings.js (user configuration)"
Task: "Create view store in src/stores/view.js (current view state, no routing)"
```

### UI Components Phase
```
Task: "Timer display component in src/components/Timer/TimerDisplay.svelte (hh:mm:ss format)"
Task: "Task list component in src/components/Tasks/TaskList.svelte (with DaisyUI Bumblebee theme)"
Task: "Daily summary view in src/components/Reports/DailySummary.svelte (daily totals)"
Task: "Settings panel in src/components/Settings/SettingsPanel.svelte (preferences)"
```

## Technical Specifications

### JavaScript-Only Requirements
- All files use .js extension (no TypeScript .ts files)
- No TypeScript configuration or dependencies
- Pure JavaScript ES6+ with modern browser support
- Svelte components use JavaScript in `<script>` blocks

### Single-Page Architecture
- No routing library dependencies
- View switching managed by Svelte stores
- All components loaded in single main App.svelte
- Navigation through view state changes only

### DaisyUI Bumblebee Theme
- Tailwind config must specify "bumblebee" theme
- All components use DaisyUI classes with Bumblebee colors
- No custom CSS beyond DaisyUI/Tailwind utilities
- Consistent yellow/black color scheme throughout

### Performance Targets
- Timer updates: 1-second precision with smooth display
- UI responsiveness: <100ms interaction response
- Animations: 60fps for transitions and loading states
- Bundle size: Optimized for single-page loading

## Validation Checklist

- [x] All 4 service contracts have corresponding test tasks
- [x] All 6 data model entities have JavaScript model creation tasks
- [x] All critical user journeys from quickstart have integration tests
- [x] TDD order maintained: tests before implementation
- [x] JavaScript-only constraint applied (no TypeScript tasks)
- [x] Single-page architecture (no routing tasks)
- [x] DaisyUI Bumblebee theme specified in setup and styling tasks
- [x] Parallel tasks target different files with clear [P] marking
- [x] GitHub Actions includes security scanning and SPA deployment
- [x] 5-week data retention and auto-purge implemented