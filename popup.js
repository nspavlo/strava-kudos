// Storage keys
const STORAGE_KEY_KUDOS_COUNT = 'strava_kudos_count'
const STORAGE_KEY_LAST_RESET = 'strava_kudos_last_reset'
const STORAGE_KEY_SETTINGS = 'strava_kudos_settings'
const STORAGE_KEY_STATS = 'strava_kudos_stats'

// Default settings
const DEFAULT_SETTINGS = {
  minDelay: 1000,
}

// Initialize tabs
document.querySelectorAll('.tab-button').forEach((button) => {
  button.addEventListener('click', function () {
    // Remove active class from all buttons and content
    document
      .querySelectorAll('.tab-button')
      .forEach((btn) => btn.classList.remove('active'))
    document
      .querySelectorAll('.tab-content')
      .forEach((tab) => tab.classList.remove('active'))

    // Add active class to clicked button and corresponding content
    this.classList.add('active')
    document.getElementById(`${this.dataset.tab}-tab`).classList.add('active')
  })
})

// Load and display settings
function loadSettings() {
  chrome.storage.local.get([STORAGE_KEY_SETTINGS], function (result) {
    const settings = result[STORAGE_KEY_SETTINGS] || DEFAULT_SETTINGS

    document.getElementById('setting-min-delay').value = settings.minDelay
    document.getElementById(
      'min-delay-value'
    ).textContent = `${settings.minDelay} ms`
  })
}

// Save settings
function saveSettings() {
  const settings = {
    minDelay: parseInt(document.getElementById('setting-min-delay').value),
  }

  chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: settings }, function () {
    // Notify user that settings were saved
    const saveButton = document.getElementById('save-settings')
    const originalText = saveButton.textContent
    saveButton.textContent = 'Saved!'
    saveButton.disabled = true

    setTimeout(() => {
      saveButton.textContent = originalText
      saveButton.disabled = false
    }, 1500)
  })
}

// Load and display statistics
function loadStatistics() {
  chrome.storage.local.get([STORAGE_KEY_STATS], function (result) {
    const stats = result[STORAGE_KEY_STATS] || {
      daily: {},
      allTime: 0,
      lastActivity: null,
    }

    // Calculate today's stats
    const today = new Date().toISOString().split('T')[0]
    const todayStats = stats.daily[today] || 0
    document.getElementById('stat-today').textContent = todayStats

    // Calculate this week's stats
    const thisWeekStats = calculateWeekStats(stats.daily)
    document.getElementById('stat-week').textContent = thisWeekStats

    // All time stats
    document.getElementById('stat-all-time').textContent = stats.allTime

    // Last activity
    if (stats.lastActivity) {
      const lastActivity = new Date(stats.lastActivity)
      document.getElementById('stat-last-activity').textContent =
        lastActivity.toLocaleString()
    }
  })
}

// Calculate this week's stats
function calculateWeekStats(dailyStats) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - dayOfWeek)
  weekStart.setHours(0, 0, 0, 0)

  let weeklyTotal = 0
  for (const date in dailyStats) {
    const dateObj = new Date(date)
    if (dateObj >= weekStart) {
      weeklyTotal += dailyStats[date]
    }
  }

  return weeklyTotal
}

// Reset statistics
function resetStatistics() {
  if (confirm('Are you sure you want to reset all statistics?')) {
    chrome.storage.local.set(
      {
        [STORAGE_KEY_STATS]: {
          daily: {},
          allTime: 0,
          lastActivity: null,
        },
      },
      function () {
        loadStatistics()

        // Notify user
        const resetButton = document.getElementById('reset-stats')
        const originalText = resetButton.textContent
        resetButton.textContent = 'Stats Reset!'
        resetButton.disabled = true

        setTimeout(() => {
          resetButton.textContent = originalText
          resetButton.disabled = false
        }, 1500)
      }
    )
  }
}

// Attach event listeners
document.addEventListener('DOMContentLoaded', function () {
  loadSettings()
  loadStatistics()

  // Range slider
  document
    .getElementById('setting-min-delay')
    .addEventListener('input', function () {
      document.getElementById(
        'min-delay-value'
      ).textContent = `${this.value} ms`
    })

  // Save button
  document
    .getElementById('save-settings')
    .addEventListener('click', saveSettings)

  // Reset stats button
  document
    .getElementById('reset-stats')
    .addEventListener('click', resetStatistics)
})
