;(function () {
  // Configuration
  const KUDOS_LIMIT = 100 // Maximum kudos per hour
  const RATE_LIMIT_DELAY = 1000 // Delay between kudos in milliseconds

  // Storage keys
  const STORAGE_KEY_KUDOS_COUNT = 'strava_kudos_count'
  const STORAGE_KEY_LAST_RESET = 'strava_kudos_last_reset'

  // Function to inject the "Kudo All" button
  function injectKudoAllButton() {
    // Check if the button already exists
    if (document.getElementById('strava-kudo-all-btn')) {
      return
    }

    // Find the feed container
    const feedHeader = document.querySelector('.feed-header')
    if (!feedHeader) {
      // If feed header isn't found, try again later
      setTimeout(injectKudoAllButton, 1000)
      return
    }

    // Create the button
    const kudoAllBtn = document.createElement('button')
    kudoAllBtn.id = 'strava-kudo-all-btn'
    kudoAllBtn.className = 'btn-primary'
    kudoAllBtn.innerText = 'Kudo All'
    kudoAllBtn.style.marginLeft = '10px'

    // Append button to feed header
    feedHeader.appendChild(kudoAllBtn)

    // Add click event listener
    kudoAllBtn.addEventListener('click', handleKudoAll)
  }

  // Function to handle "Kudo All" button click
  async function handleKudoAll() {
    const button = document.getElementById('strava-kudo-all-btn')
    if (!button) return

    // Check if we have enough kudos left
    const { kudosCount, lastReset } = await getKudosStats()
    const now = Date.now()

    // Reset counter if it's been more than an hour since last reset
    if (now - lastReset > 3600000) {
      await resetKudosCount()
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

    // Find all kudos buttons
    const kudoButtons = Array.from(
      document.querySelectorAll('.js-add-kudo:not(.js-kudo-added)')
    )

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

      // Wait before next kudo
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY))
    }

    // Update button text when done
    button.innerText = `Kudoed ${clickedCount} Activities`
    setTimeout(() => {
      button.innerText = 'Kudo All'
      button.disabled = false
    }, 3000)
  }

  // Function to get current kudos stats
  async function getKudosStats() {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        [STORAGE_KEY_KUDOS_COUNT, STORAGE_KEY_LAST_RESET],
        (result) => {
          resolve({
            kudosCount: result[STORAGE_KEY_KUDOS_COUNT] || 0,
            lastReset: result[STORAGE_KEY_LAST_RESET] || Date.now(),
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
      }
      #strava-kudo-all-btn:disabled {
        background-color: #aaa;
        cursor: not-allowed;
      }
    `
    document.head.appendChild(style)
  }

  // Initialize
  function initialize() {
    addCustomStyles()
    injectKudoAllButton()

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
