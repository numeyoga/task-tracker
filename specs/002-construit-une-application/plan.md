
# Implementation Plan: Work Time Tracking Web Application

**Branch**: `002-construit-une-application` | **Date**: 2025-09-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-construit-une-application/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Work time tracking web application for single users to track daily work hours, tasks, breaks, and generate weekly summaries. Built as a frontend-only Svelte application with localStorage persistence, DaisyUI Bumblebee theme styling, and deployed to GitHub Pages. Features timer functionality with auto-stop protection, manual time corrections, meal break tracking, and activity counters for comprehensive work time management.

## Technical Context
**Language/Version**: JavaScript only (TypeScript prohibited), HTML5, CSS3
**Primary Dependencies**: Svelte only (SvelteKit prohibited), DaisyUI CSS framework, Vite for build
**Storage**: Browser localStorage with single root key for all application data
**Testing**: Svelte Testing Library, Vitest for unit/integration tests
**Target Platform**: Desktop browsers (Chrome latest), GitHub Pages deployment
**Project Type**: single-page application - frontend-only, no routing, no backend
**Performance Goals**: <100ms UI response time, smooth timer updates (1s precision), 60fps animations
**Constraints**: No routing, no external API calls, all resources bundled, localStorage-only persistence, desktop-only design
**Scale/Scope**: Single user, 5-week data retention, single page with component views, SVG icons only

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Specification-First Development**: ✅ PASS - Complete spec with resolved clarifications session 2025-09-24
**Contract-Driven Design**: ✅ PASS - Service contracts defined, single-page architecture with clear interfaces
**Test-First Development**: ✅ PASS - Vitest testing strategy defined, TDD approach planned for JavaScript
**Structured Workflow**: ✅ PASS - Following /specify → /clarify → /plan sequence correctly
**Parallel-First Design**: ✅ PASS - Component-based SPA architecture enables parallel development

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Single-page Svelte application structure
src/
├── components/
│   ├── Timer/
│   ├── Tasks/
│   ├── Reports/
│   ├── Settings/
│   └── Counters/
├── services/
├── models/
├── stores/
└── utils/

tests/
├── contracts/
├── integration/
└── unit/

public/
├── index.html
└── assets/
```

**Structure Decision**: Single-page Svelte application - No routing, component-based views managed by state

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from contracts (DataService, TimerService, TaskService, ReportService)
- Each service contract → contract test task [P] + implementation task
- Data model entities → JavaScript models and validation [P]
- Svelte components per feature (Timer/, Tasks/, Reports/, Settings/) [P]
- Single-page view management with Svelte stores
- GitHub Actions deployment pipeline and security scanning
- DaisyUI styling implementation (desktop-only)

**Ordering Strategy**:
- TDD order: Contract tests → Service tests → Implementation → UI tests
- Dependency order: Data layer → Services → Components → View Management
- Parallel opportunities: Services [P], Component files [P], Test files [P]
- Sequential requirements: localStorage → Services → Components → View State → Deployment

**Estimated Output**: 25-30 numbered, ordered tasks focusing on:
- Setup & Configuration (4 tasks): Vite, Svelte, DaisyUI, GitHub Actions (no TypeScript)
- Data Layer (4 tasks): localStorage service, JavaScript data models, validation
- Core Services (8 tasks): Timer, Task, Report, Settings services with tests
- UI Components (10 tasks): Timer controls, task management, reports, settings, main app
- View Management (3 tasks): Svelte stores, view switching, state management
- Integration & Deployment (5 tasks): E2E tests, GitHub Pages setup, security scanning
- Polish (3 tasks): Error handling, accessibility, performance optimization

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - Updated for JavaScript-only, no routing
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - Updated for SPA
- [ ] Phase 3: Tasks generated (/tasks command) - NEEDS REGENERATION
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented - No violations requiring justification

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*
