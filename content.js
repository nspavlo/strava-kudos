;(function () {
  // Configuration
  const KUDOS_LIMIT = 100 // Maximum kudos per hour
  const RATE_LIMIT_DELAY = 1000 // Delay between kudos in milliseconds

  // Storage keys
  const STORAGE_KEY_KUDOS_COUNT = 'strava_kudos_count'
  const STORAGE_KEY_LAST_RESET = 'strava_kudos_last_reset'
  const STORAGE_KEY_SETTINGS = 'strava_kudos_settings'
  const STORAGE_KEY_STATS = 'strava_kudos_stats'

  // Variable to keep track of the current kudo index
  let currentKudoIndex = 0

  // Function to get all available kudo buttons
  function getAvailableKudoButtons() {
    return Array.from(
      document.querySelectorAll(
        'button[data-testid="kudos_button"]:not(.js-kudo-added)'
      )
    ).filter((button) => {
      return (
        button.title === 'Give kudos' ||
        button.title === 'Be the first to give kudos!'
      )
    })
  }

  // Function to inject the "Kudo All" button
  function injectKudoAllButton() {
    console.log('injectKudoAllButton called')
    // Check if the button already exists
    if (document.getElementById('strava-kudo-all-btn')) {
      console.log('Kudo All button already exists')
      updateKudoAllButtonState()
      return
    }

    // Find the feed container
    const featureFeed = document.querySelector('.feature-feed')
    if (!featureFeed) {
      console.log('Feature feed not found, retrying in 3 seconds')
      setTimeout(injectKudoAllButton, 3000)
      return
    }

    console.log('Feed header found, creating Kudo All button')

    // Create the container div
    const containerDiv = document.createElement('div')
    containerDiv.style.textAlign = 'right'
    containerDiv.style.margin = '10px 0'

    // Create the button
    const kudoAllBtn = document.createElement('button')
    kudoAllBtn.id = 'strava-kudo-all-btn'
    kudoAllBtn.className = 'btn-primary'
    kudoAllBtn.innerText = 'Kudo All'
    kudoAllBtn.style.width = 'max-content'

    // Append button to container
    containerDiv.appendChild(kudoAllBtn)

    // Insert container above feature feed
    featureFeed.parentNode.insertBefore(containerDiv, featureFeed)

    // Add click event listener
    kudoAllBtn.addEventListener('click', handleKudoAll)

    // Initial button state update
    updateKudoAllButtonState()
  }

  // Function to update the Kudo All button based on available kudos
  function updateKudoAllButtonState() {
    const button = document.getElementById('strava-kudo-all-btn')
    if (!button) return

    const kudoButtons = getAvailableKudoButtons()

    if (kudoButtons.length === 0) {
      // No kudos buttons available
      button.innerText = 'Everyone Kudoed!'
      button.classList.add('all-kudoed')
      button.disabled = true
    } else {
      // Kudos buttons available
      button.innerText = `Kudo All (${kudoButtons.length})`
      button.classList.remove('all-kudoed')
      button.disabled = false
    }
  }

  async function trackKudoStatistics(count) {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY_STATS], (result) => {
        const today = new Date().toISOString().split('T')[0]
        const stats = result[STORAGE_KEY_STATS] || {
          daily: {},
          allTime: 0,
          lastActivity: null,
        }

        // Update today's count
        stats.daily[today] = (stats.daily[today] || 0) + count

        // Update all time count
        stats.allTime += count

        // Update last activity time
        stats.lastActivity = Date.now()

        chrome.storage.local.set({ [STORAGE_KEY_STATS]: stats }, resolve)
      })
    })
  }

  // Function to handle "Kudo All" button click
  async function handleKudoAll() {
    const button = document.getElementById('strava-kudo-all-btn')
    if (!button) return

    // Check if we have enough kudos left
    let { kudosCount, lastReset } = await getKudosStats()
    const now = Date.now()

    // Reset counter if it's been more than an hour since last reset
    if (now - lastReset >= 3600000) {
      await resetKudosCount()

      // Get the updated stats after resetting
      const updatedStats = await getKudosStats()
      kudosCount = updatedStats.kudosCount
      lastReset = updatedStats.lastReset

      button.innerText = 'Kudo All'
      button.disabled = false
    }

    // Check if we're approaching the limit
    if (kudosCount >= KUDOS_LIMIT) {
      button.innerText = 'Limit Reached'
      button.disabled = true

      // Show time remaining
      const timeRemaining = Math.ceil((lastReset + 3600000 - now) / 60000)
      alert(
        `You've reached the hourly kudos limit (${KUDOS_LIMIT}). Please try again in about ${timeRemaining} minutes.`
      )
      return
    }

    // Disable button and update text
    button.innerText = 'Processing...'
    button.disabled = true

    // Find all kudos buttons excluding own activities
    const kudoButtons = getAvailableKudoButtons()

    // Calculate how many kudos we can give
    const availableKudos = KUDOS_LIMIT - kudosCount
    const buttonsToClick = kudoButtons.slice(0, availableKudos)

    if (buttonsToClick.length === 0) {
      button.innerText = 'No New Kudos'
      setTimeout(() => {
        button.innerText = 'Kudo All'
        button.disabled = false
      }, 2000)
      return
    }

    // Click buttons with rate limiting
    let clickedCount = 0

    for (const kudoButton of buttonsToClick) {
      kudoButton.click()
      clickedCount++

      // Update button text
      button.innerText = `Kudoing... ${clickedCount}/${buttonsToClick.length}`

      // Increment kudos count in storage
      await incrementKudosCount()

      // Create a more human-like variable delay pattern
      let delay

      // Small chance (5%) for a very long pause (2-4 seconds)
      if (Math.random() < 0.05) {
        delay = 2000 + Math.random() * 2000 // 2-4 seconds
        console.log('Taking a coffee break:', Math.round(delay) + 'ms')
      }
      // Medium chance (15%) for a longer pause (1.5-2.5 seconds)
      else if (Math.random() < 0.15) {
        delay = 1500 + Math.random() * 1000 // 1.5-2.5 seconds
        console.log('Brief pause:', Math.round(delay) + 'ms')
      }
      // Chance for a slightly faster click (70-90% of base rate)
      else if (Math.random() < 0.25) {
        delay = RATE_LIMIT_DELAY * (0.7 + Math.random() * 0.2) // 700-900ms
        console.log('Quick click:', Math.round(delay) + 'ms')
      }
      // Regular variation (80-120% of base rate)
      else {
        delay = RATE_LIMIT_DELAY * (0.8 + Math.random() * 0.4) // 800-1200ms
        console.log('Regular click:', Math.round(delay) + 'ms')
      }

      // Wait with variable delay before next kudo
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    await trackKudoStatistics(clickedCount)

    // Update button text when done
    button.innerText = `Kudoed ${clickedCount} Activities`
    setTimeout(() => {
      updateKudoAllButtonState()
    }, 3000)
  }

  // Function to get current kudos stats
  async function getKudosStats() {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        [STORAGE_KEY_KUDOS_COUNT, STORAGE_KEY_LAST_RESET],
        (result) => {
          // If lastReset doesn't exist, set it to 1 hour ago instead of now
          // This ensures users can immediately use the feature after installation
          const defaultLastReset = Date.now() - 3600000 // 1 hour ago

          resolve({
            kudosCount: result[STORAGE_KEY_KUDOS_COUNT] || 0,
            lastReset: result[STORAGE_KEY_LAST_RESET] || defaultLastReset,
          })
        }
      )
    })
  }

  // Function to increment kudos count
  async function incrementKudosCount() {
    const { kudosCount } = await getKudosStats()
    return new Promise((resolve) => {
      chrome.storage.local.set(
        {
          [STORAGE_KEY_KUDOS_COUNT]: kudosCount + 1,
        },
        resolve
      )
    })
  }

  // Function to reset kudos count
  async function resetKudosCount() {
    return new Promise((resolve) => {
      chrome.storage.local.set(
        {
          [STORAGE_KEY_KUDOS_COUNT]: 0,
          [STORAGE_KEY_LAST_RESET]: Date.now(),
        },
        resolve
      )
    })
  }

  // Add custom styles
  function addCustomStyles() {
    const style = document.createElement('style')
    style.textContent = `
      #strava-kudo-all-btn {
        background-color: #fc5200;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.3s ease, transform 0.2s ease;
      }
      #strava-kudo-all-btn:disabled {
        background-color: #aaa;
        cursor: not-allowed;
      }
      #strava-kudo-all-btn.all-kudoed {
        background-color: #4CAF50;
      }
      #debug-menu {
        position: fixed;
        top: 10px;
        right: 10px;
        background-color: white;
        border: 1px solid #ccc;
        padding: 10px;
        z-index: 1000;
      }
      #debug-menu button {
        display: block;
        margin-bottom: 5px;
      }
      .highlight {
        border: 2px solid red;
      }
    `
    document.head.appendChild(style)
  }

  // Function to create debug menu
  function createDebugMenu() {
    const debugMenu = document.createElement('div')
    debugMenu.id = 'debug-menu'

    const triggerLimitNotificationBtn = document.createElement('button')
    triggerLimitNotificationBtn.innerText = 'Trigger Kudos Limit Notification'
    triggerLimitNotificationBtn.addEventListener(
      'click',
      triggerKudosLimitNotification
    )

    const highlightNextKudoBtn = document.createElement('button')
    highlightNextKudoBtn.innerText = 'Highlight Next Kudos Button'
    highlightNextKudoBtn.addEventListener('click', highlightNextKudosButton)

    const highlightPrevKudoBtn = document.createElement('button')
    highlightPrevKudoBtn.innerText = 'Highlight Previous Kudos Button'
    highlightPrevKudoBtn.addEventListener('click', highlightPrevKudosButton)

    debugMenu.appendChild(triggerLimitNotificationBtn)
    debugMenu.appendChild(highlightNextKudoBtn)
    debugMenu.appendChild(highlightPrevKudoBtn)

    document.body.appendChild(debugMenu)
  }

  // Function to trigger kudos limit notification
  async function triggerKudosLimitNotification() {
    const { kudosCount, lastReset } = await getKudosStats()
    const now = Date.now()
    const timeRemaining = Math.ceil((lastReset + 3600000 - now) / 60000)
    alert(
      `You've reached the hourly kudos limit (${KUDOS_LIMIT}). Please try again in about ${timeRemaining} minutes.`
    )
  }

  // Function to highlight the next kudos button
  function highlightNextKudosButton() {
    const kudoButtons = getAvailableKudoButtons()

    if (kudoButtons.length === 0) {
      console.log('No kudos buttons found')
      return
    }

    console.log('Kudo buttons found:', kudoButtons.length)

    // Remove scale effect from the previous button
    if (currentKudoIndex > 0) {
      kudoButtons[currentKudoIndex - 1].style.transform = 'scale(1)'
      kudoButtons[currentKudoIndex - 1].style.transition = 'transform 0.3s ease'
    }

    // Apply scale effect to the next button
    kudoButtons[currentKudoIndex].style.transform = 'scale(1.1)'
    kudoButtons[currentKudoIndex].style.transition = 'transform 0.3s ease'

    // Update index
    currentKudoIndex = (currentKudoIndex + 1) % kudoButtons.length
  }

  // Function to highlight the previous kudos button
  function highlightPrevKudosButton() {
    const kudoButtons = getAvailableKudoButtons()

    if (kudoButtons.length === 0) {
      console.log('No kudos buttons found')
      return
    }

    console.log('Kudo buttons found:', kudoButtons.length)

    // Remove scale effect from the current button
    kudoButtons[currentKudoIndex].style.transform = 'scale(1)'
    kudoButtons[currentKudoIndex].style.transition = 'transform 0.3s ease'

    // Update index
    currentKudoIndex =
      (currentKudoIndex - 1 + kudoButtons.length) % kudoButtons.length

    // Apply scale effect to the previous button
    kudoButtons[currentKudoIndex].style.transform = 'scale(1.1)'
    kudoButtons[currentKudoIndex].style.transition = 'transform 0.3s ease'
  }

  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY_SETTINGS], (result) => {
        const defaultSettings = {
          minDelay: 1000,
        }

        resolve(result[STORAGE_KEY_SETTINGS] || defaultSettings)
      })
    })
  }

  // Initialize
  async function initialize() {
    addCustomStyles()
    injectKudoAllButton()
    createDebugMenu()

    // Get settings
    const settings = await loadSettings()

    // Update RATE_LIMIT_DELAY from settings
    RATE_LIMIT_DELAY = settings.minDelay

    // Add a listener for storage changes to update settings in real-time
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes[STORAGE_KEY_SETTINGS]) {
        const newSettings = changes[STORAGE_KEY_SETTINGS].newValue

        // Update debug menu visibility if that setting changed
        if (newSettings && newSettings.showDebugMenu !== undefined) {
          updateDebugMenuVisibility(newSettings.showDebugMenu)
        }

        // Update delay if that setting changed
        if (newSettings && newSettings.minDelay !== undefined) {
          RATE_LIMIT_DELAY = newSettings.minDelay
        }
      }
    })

    // Add a mutation observer to handle dynamically loaded content
    const observer = new MutationObserver((mutations) => {
      injectKudoAllButton()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  // Run initialization when the page is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize)
  } else {
    initialize()
  }
})()
