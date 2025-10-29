<script>
  import { auditData, reportActions } from '../../stores/reports.js';
</script>

<div class="max-w-6xl mx-auto space-y-6">
  <!-- Page Header -->
  <div>
    <h1 class="text-4xl font-bold text-base-content mb-2">Audit Trail</h1>
    <p class="text-base-content/70">Complete history of all work time entries</p>
  </div>

  <!-- Filters -->
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <div class="flex flex-wrap gap-4 items-center">
        <div class="form-control">
          <label class="label" for="from-date-input">
            <span class="label-text">From Date</span>
          </label>
          <input id="from-date-input" type="date" class="input input-bordered input-sm" />
        </div>
        <div class="form-control">
          <label class="label" for="to-date-input">
            <span class="label-text">To Date</span>
          </label>
          <input id="to-date-input" type="date" class="input input-bordered input-sm" />
        </div>
        <div class="form-control">
          <label class="label" for="task-select">
            <span class="label-text">Task</span>
          </label>
          <select id="task-select" class="select select-bordered select-sm">
            <option>All Tasks</option>
          </select>
        </div>
        <button class="btn btn-primary btn-sm mt-8">Apply Filters</button>
      </div>
    </div>
  </div>

  <!-- Audit Data Table -->
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      {#if $auditData && $auditData.timeEntries && $auditData.timeEntries.length > 0}
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Date</th>
                <th>Task</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Duration</th>
                <th>Type</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {#each $auditData.timeEntries as entry (entry.id)}
                <tr>
                  <td>{entry.date || new Date(entry.startTime).toISOString().split('T')[0]}</td>
                  <td>
                    <div class="flex items-center space-x-2">
                      <div
                        class="w-3 h-3 rounded-full"
                        style="background-color: {entry.taskColor || 'hsl(var(--p))'}"
                      ></div>
                      <span>{entry.taskName}</span>
                    </div>
                  </td>
                  <td>{new Date(entry.startTime).toLocaleTimeString('en-US', { hour12: false })}</td
                  >
                  <td>
                    {entry.endTime
                      ? new Date(entry.endTime).toLocaleTimeString('en-US', { hour12: false })
                      : 'Running'}
                  </td>
                  <td class="font-mono">
                    {Math.round((entry.duration || 0) / (1000 * 60))}m
                  </td>
                  <td>
                    <span class="badge {entry.isManual ? 'badge-warning' : 'badge-info'}">
                      {entry.isManual ? 'Manual' : 'Auto'}
                    </span>
                  </td>
                  <td class="text-sm text-base-content/70 max-w-xs truncate">
                    {entry.note || '—'}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Summary Stats -->
        <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">Total Entries</div>
            <div class="stat-value text-primary">{$auditData.totalEntries}</div>
          </div>
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">Work Days</div>
            <div class="stat-value text-success">{$auditData.totalWorkDays}</div>
          </div>
          <div class="stat bg-base-200 rounded-lg">
            <div class="stat-title">Meal Breaks</div>
            <div class="stat-value text-accent">{$auditData.totalMealBreaks}</div>
          </div>
        </div>
      {:else}
        <div class="text-center py-12">
          <svg
            class="w-16 h-16 mx-auto text-base-content/30 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
          <h3 class="text-lg font-semibold text-base-content mb-2">No Audit Data</h3>
          <p class="text-base-content/70 mb-4">Start tracking time to see your work history here</p>
          <button class="btn btn-primary" on:click={() => reportActions.loadAuditData()}>
            Load Data
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
