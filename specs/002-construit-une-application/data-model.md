# Data Model: Work Time Tracking Web Application

## Core Entities

### Task
Represents a work activity that can be timed and tracked.

**Fields**:
- `id`: string (UUID) - Unique identifier
- `name`: string - User-defined task name
- `isActive`: boolean - Whether this task is currently selected for timing
- `totalTime`: number - Accumulated time in milliseconds
- `createdAt`: Date - When task was created
- `color`: string - UI color for visual distinction (DaisyUI color class)

**Validation Rules**:
- `name` must be 1-100 characters
- Only one task can have `isActive: true` at any time
- `totalTime` cannot be negative
- `color` must be valid DaisyUI color class

**State Transitions**:
- Created → Inactive → Active (when selected)
- Active → Inactive (when another task selected or timer stopped)
- Any state → Deleted (soft delete with archive flag)

### TimeEntry
Records time spent on a specific task during a specific period.

**Fields**:
- `id`: string (UUID) - Unique identifier
- `taskId`: string - Reference to Task.id
- `startTime`: Date - When timing started
- `endTime`: Date - When timing ended (null if currently running)
- `duration`: number - Calculated duration in milliseconds
- `date`: string - ISO date string (YYYY-MM-DD) for daily grouping
- `isManual`: boolean - Whether this was manually entered/adjusted
- `note`: string - Optional user note for manual entries

**Validation Rules**:
- `endTime` must be after `startTime` (if not null)
- `duration` must match calculated `endTime - startTime`
- `date` must be valid ISO date format
- Only one TimeEntry can have `endTime: null` (active timer)
- Maximum duration: 12 hours (auto-stop protection)

**State Transitions**:
- Created with `endTime: null` (timer running)
- Timer stopped → `endTime` set, `duration` calculated
- Manual adjustment → `isManual: true`, note added

### WorkDay
Daily summary containing all activities and presence calculations.

**Fields**:
- `date`: string (YYYY-MM-DD) - ISO date string, primary key
- `arrivalTime`: Date - When user started work (first timer)
- `departureTime`: Date - When user finished work (last timer stop)
- `totalPresenceTime`: number - Total time at work in milliseconds
- `totalTaskTime`: number - Sum of all task durations for this day
- `mealBreakTime`: number - Total meal break time in milliseconds
- `workingTime`: number - totalPresenceTime - mealBreakTime
- `activityCounters`: object - Daily counters for coffee, breaks, etc.

**Validation Rules**:
- `date` must be unique across all WorkDay records
- `departureTime` must be after `arrivalTime` (if both set)
- `totalTaskTime` ≤ `workingTime`
- `mealBreakTime` ≥ 0
- `activityCounters` values must be non-negative integers

**Calculated Fields**:
- `workingTime` = `totalPresenceTime - mealBreakTime`
- `efficiency` = `totalTaskTime / workingTime` (percentage)

### MealBreak
Records meal break periods that are deducted from presence time.

**Fields**:
- `id`: string (UUID) - Unique identifier
- `date`: string (YYYY-MM-DD) - ISO date string
- `startTime`: Date - When meal break started
- `endTime`: Date - When meal break ended (null if active)
- `duration`: number - Calculated duration in milliseconds

**Validation Rules**:
- `endTime` must be after `startTime` (if not null)
- Only one MealBreak can have `endTime: null` per day
- Maximum duration: 3 hours (reasonable meal break limit)

### ActivityCounter
Tracks non-task activities like coffee breaks, bathroom breaks, etc.

**Fields**:
- `date`: string (YYYY-MM-DD) - ISO date string
- `activityType`: string - Type of activity (coffee, break, etc.)
- `count`: number - Number of times this activity occurred
- `lastUpdated`: Date - When counter was last incremented

**Validation Rules**:
- `count` must be non-negative integer
- `activityType` must be from predefined list or user-defined
- Unique constraint on `date + activityType`

### WeekSummary
Aggregated view of Monday-Friday work data (calculated, not stored).

**Fields** (all calculated):
- `weekStart`: string (YYYY-MM-DD) - Monday of the week
- `weekEnd`: string (YYYY-MM-DD) - Friday of the week
- `totalWorkingTime`: number - Sum of daily working times
- `totalPresenceTime`: number - Sum of daily presence times
- `taskSummaries`: array - Time per task for the week
- `dailyAverages`: object - Average times per day
- `activityTotals`: object - Weekly totals for activities

### Settings
User configuration and preferences.

**Fields**:
- `requiredDailyPresence`: number - Required daily presence in milliseconds (default: 8 hours)
- `timerMaxDuration`: number - Maximum timer duration before auto-stop (default: 12 hours)
- `theme`: string - DaisyUI theme name
- `timeFormat24h`: boolean - Whether to use 24h format (default: true)
- `autoSaveInterval`: number - How often to save to localStorage (default: 30 seconds)
- `dataRetentionWeeks`: number - How many weeks to keep data (default: 5)

**Validation Rules**:
- `requiredDailyPresence` between 1-16 hours
- `timerMaxDuration` between 1-24 hours
- `dataRetentionWeeks` between 1-52 weeks
- `autoSaveInterval` between 1-300 seconds

## Data Relationships

### Task → TimeEntry (1:Many)
- One task can have multiple time entries
- Cascade delete: deleting task archives associated time entries

### WorkDay → TimeEntry (1:Many via date)
- Daily rollup includes all time entries for that date
- Time entries grouped by date to calculate daily totals

### WorkDay → MealBreak (1:Many via date)
- Multiple meal breaks per day are summed
- Meal breaks deducted from total presence time

### WorkDay → ActivityCounter (1:Many via date)
- Activity counters grouped by date for daily totals
- Weekly summaries aggregate daily counters

## Storage Schema (localStorage)

### Root Key: 'work-tracker-app-data'

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-09-24T10:30:00.000Z",
  "tasks": [
    {
      "id": "uuid-1",
      "name": "Development",
      "isActive": true,
      "totalTime": 14400000,
      "createdAt": "2025-09-24T08:00:00.000Z",
      "color": "primary"
    }
  ],
  "timeEntries": [
    {
      "id": "uuid-2",
      "taskId": "uuid-1",
      "startTime": "2025-09-24T09:00:00.000Z",
      "endTime": "2025-09-24T13:00:00.000Z",
      "duration": 14400000,
      "date": "2025-09-24",
      "isManual": false,
      "note": ""
    }
  ],
  "workDays": [
    {
      "date": "2025-09-24",
      "arrivalTime": "2025-09-24T08:30:00.000Z",
      "departureTime": "2025-09-24T17:30:00.000Z",
      "totalPresenceTime": 32400000,
      "totalTaskTime": 28800000,
      "mealBreakTime": 3600000,
      "workingTime": 28800000,
      "activityCounters": {
        "coffee": 3,
        "break": 2
      }
    }
  ],
  "mealBreaks": [
    {
      "id": "uuid-3",
      "date": "2025-09-24",
      "startTime": "2025-09-24T12:00:00.000Z",
      "endTime": "2025-09-24T13:00:00.000Z",
      "duration": 3600000
    }
  ],
  "settings": {
    "requiredDailyPresence": 28800000,
    "timerMaxDuration": 43200000,
    "theme": "corporate",
    "timeFormat24h": true,
    "autoSaveInterval": 30000,
    "dataRetentionWeeks": 5
  }
}
```

## Data Migration Strategy

### Version Updates
- Schema version field for future migrations
- Backward compatibility for at least 2 versions
- Migration functions for each version increment

### Data Cleanup
- Automatic purging of data older than retention period
- Cleanup of orphaned time entries when tasks deleted
- Compression of old data before deletion (export feature)