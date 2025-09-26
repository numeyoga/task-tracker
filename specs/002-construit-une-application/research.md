# Research: Work Time Tracking Web Application

## Technology Stack Decisions

### Frontend Framework: Svelte
**Decision**: Svelte (latest version) only, SvelteKit prohibited
**Rationale**:
- Minimal runtime overhead perfect for single-page desktop app
- Excellent developer experience with reactive declarations
- Strong component system for modular timer/task components
- Built-in store system for state management without routing
- Single-page application architecture keeps complexity minimal
**Alternatives considered**: SvelteKit (prohibited), React (too heavy), Vue (unnecessary complexity)

### CSS Framework: DaisyUI + Tailwind CSS
**Decision**: DaisyUI components with Tailwind CSS base using Bumblebee theme
**Rationale**:
- Pre-built components for rapid UI development
- Consistent design system with Bumblebee theme styling
- Single-user application requires no accessibility constraints
- Bumblebee theme provides modern, attractive yellow/black color scheme
**Alternatives considered**: Custom CSS (too much work), Bootstrap (not modern enough), other DaisyUI themes (Bumblebee specified)

### Build Tool: Vite
**Decision**: Vite with Svelte plugin for development and production builds
**Rationale**:
- Fast HMR during development for timer functionality testing
- Optimized production builds for GitHub Pages
- Built-in TypeScript support if needed later
- Excellent SVG handling for icon requirements
**Alternatives considered**: Webpack (too complex), Rollup (Vite wraps this anyway)

### Data Storage: localStorage
**Decision**: Browser localStorage with single root key strategy
**Rationale**:
- Meets requirement for offline-first operation
- Perfect for single-user desktop application
- 5-10MB limit sufficient for 5 weeks of time tracking data
- Synchronous API suitable for timer precision requirements
**Alternatives considered**: IndexedDB (too complex), sessionStorage (data loss on close)

### Testing Strategy: Vitest + Svelte Testing Library
**Decision**: Vitest as test runner with Svelte Testing Library for component tests
**Rationale**:
- Native Vite integration for consistent build pipeline
- Fast test execution for TDD workflow
- Component testing capabilities for timer logic
- Good assertion library for time calculations
**Alternatives considered**: Jest (slower with Svelte), Cypress (overkill for single-user app)

## Architecture Patterns

### State Management: Svelte Stores + Service Layer
**Decision**: Svelte readable/writable stores with service classes, no routing
**Rationale**:
- Reactive timer updates across components
- Single-page architecture with view state management
- Clean separation of concerns (UI vs business logic)
- Easy to test timer calculations independently
- Supports undo/redo for manual time corrections
**Alternatives considered**: SvelteKit routing (prohibited), Context API (too complex), Props drilling (unmaintainable)

### Timer Implementation: Web Workers + Store Updates
**Decision**: Main thread timers with localStorage persistence every 30 seconds
**Rationale**:
- 1-second precision requirement achievable with setInterval
- Auto-stop after 12 hours prevents overnight accumulation
- localStorage backup prevents data loss on browser crash
- No Web Workers needed for single timer complexity
**Alternatives considered**: Web Workers (overkill), requestAnimationFrame (unnecessary precision)

### Component Structure: Feature-based Organization
**Decision**: Components organized by feature (Timer/, Tasks/, Reports/, Settings/) with view switching
**Rationale**:
- Single-page architecture with component-based views
- Parallel development of different features
- Clear boundaries for testing
- Easy to understand for maintenance
- No routing needed - state-driven view management
**Alternatives considered**: Routing (prohibited), Technical layers (too scattered), Single file components (too monolithic)

## GitHub Pages Deployment Strategy

### Build Pipeline: GitHub Actions
**Decision**: GitHub Actions workflow with Vite build and security scanning
**Rationale**:
- Free for public repositories
- Integrated dependency security scanning
- Automated deployment on push to main
- Vite static build perfect for GitHub Pages
**Alternatives considered**: Netlify (unnecessary for simple static site), Manual deployment (error-prone)

### Security Considerations
**Decision**: No external CDNs, all resources bundled in build
**Rationale**:
- Meets security requirement for no external calls
- Faster loading with bundled DaisyUI/icons
- No CSP issues with external resources
- Offline-capable after first load
**Alternatives considered**: CDN loading (violates security requirements)

## Performance Optimization

### Bundle Size Strategy
**Decision**: Tree-shaking with Vite, minimal external dependencies
**Rationale**:
- Only DaisyUI and Svelte as dependencies
- SVG icons inlined to avoid HTTP requests
- Code splitting for different app sections
- Target <1MB initial bundle size
**Alternatives considered**: Lazy loading (unnecessary complexity)

### Timer Precision Strategy
**Decision**: JavaScript setInterval with drift correction
**Rationale**:
- 1-second updates sufficient for hh:mm:ss display
- Drift correction for long-running timers
- Local timezone handling as specified
- Pause detection for computer sleep scenarios
**Alternatives considered**: High-precision timers (unnecessary), Server-side timing (violates offline requirement)

## Data Model Strategy

### localStorage Schema Design
**Decision**: Single root key with nested object structure
**Rationale**:
- Easy backup/restore of all data
- Atomic updates for consistency
- Simple versioning for schema evolution
- Efficient JSON serialization
**Alternatives considered**: Multiple keys (harder to manage), Compressed storage (premature optimization)

## Development Workflow

### Clean Code Principles
**Decision**: SOLID principles with functional components and pure functions
**Rationale**:
- Timer calculations as pure functions (easier testing)
- Single responsibility components
- Dependency injection for services
- Interface-based design for localStorage abstraction
**Alternatives considered**: Object-oriented approach (too heavy for simple app)

### YAGNI Implementation
**Decision**: Build only specified features, no speculative additions
**Rationale**:
- Week-based reporting only (no monthly/yearly)
- Desktop-only (no responsive design)
- Single user (no multi-user features)
- 5-week retention (no longer-term storage)
**Alternatives considered**: Future-proofing (violates YAGNI principle)