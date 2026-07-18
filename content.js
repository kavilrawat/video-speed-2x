/**
 * Video Speed Booster (Advanced) - Content Script
 * Handles video speed control when Shift key is held/released
 */

let shiftHeld = false;
let boostSpeed = 2.0; // configurable via popup/storage

// Track all videos including dynamically added ones
let knownVideos = new Set();

// Remember original playback rates so we can restore after Shift is released
const originalPlaybackRateByVideo = new Map();

/**
 * Set video to accelerated speed while preserving original rate once
 * @param {HTMLVideoElement} video - The video element to update
 */
function accelerateVideo(video) {
  try {
    if (!video) return;
    if (!originalPlaybackRateByVideo.has(video)) {
      originalPlaybackRateByVideo.set(video, video.playbackRate);
    }
    if (video.playbackRate !== boostSpeed) {
      video.playbackRate = boostSpeed;
    }
  } catch (error) {
    console.warn('Video Speed Booster: Error accelerating video:', error);
  }
}

/**
 * Restore video to its original playback rate (if stored)
 * @param {HTMLVideoElement} video - The video element to restore
 */
function restoreVideo(video) {
  try {
    if (!video) return;
    if (originalPlaybackRateByVideo.has(video)) {
      const originalRate = originalPlaybackRateByVideo.get(video);
      if (typeof originalRate === 'number' && video.playbackRate !== originalRate) {
        video.playbackRate = originalRate;
      }
      originalPlaybackRateByVideo.delete(video);
    }
  } catch (error) {
    console.warn('Video Speed Booster: Error restoring video speed:', error);
  }
}

/**
 * Process all videos on the page
 */
function processAllVideos() {
  const videos = document.querySelectorAll('video');
  videos.forEach(video => {
    knownVideos.add(video);
    if (shiftHeld) {
      accelerateVideo(video);
    }
  });
}

/**
 * Initialize the video speed controller
 */
function initializeVideoSpeedController() {
  // Process any existing videos immediately
  processAllVideos();
}

/**
 * Handle keydown events
 */
function handleKeyDown(event) {
  if (event.key === 'Shift' && !shiftHeld) {
    shiftHeld = true;
    // Accelerate all known and current videos
    processAllVideos();
    knownVideos.forEach(video => accelerateVideo(video));
    console.log('Video Speed Booster: Shift held - videos set to', boostSpeed, 'x');
  }
  // Adjust boost speed with Shift + ArrowUp/ArrowDown by 0.25x
  if (event.shiftKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
    try { event.preventDefault(); } catch (e) {}
    const delta = event.key === 'ArrowUp' ? 0.25 : -0.25;
    const next = Math.min(5, Math.max(0.25, Number((boostSpeed + delta).toFixed(2))));
    if (next !== boostSpeed) {
      boostSpeed = next;
      try {
        chrome.storage.sync.set({ boostSpeed: next });
        chrome.runtime?.sendMessage?.({ type: 'BOOST_SPEED_UPDATED', value: next });
      } catch (e) {}
      if (shiftHeld) {
        knownVideos.forEach(video => accelerateVideo(video));
      }
      console.log('Video Speed Booster: Boost speed set to', boostSpeed, 'x');
    }
  }
}

/**
 * Handle keyup events
 */
function handleKeyUp(event) {
  if (event.key === 'Shift' && shiftHeld) {
    shiftHeld = false;
    // Restore original rate for all tracked videos
    knownVideos.forEach(video => restoreVideo(video));
    console.log('Video Speed Booster: Shift released - restored original speed');
  }
}

/**
 * Handle window focus/blur to reset shift state
 */
function handleWindowFocus() {
  if (shiftHeld) {
    shiftHeld = false;
    knownVideos.forEach(video => restoreVideo(video));
    console.log('Video Speed Booster: Window focus - reset shift state');
  }
}

// Event listeners
document.addEventListener('keydown', handleKeyDown, true);
document.addEventListener('keyup', handleKeyUp, true);
window.addEventListener('focus', handleWindowFocus);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeVideoSpeedController);
} else {
  initializeVideoSpeedController();
}

// Load stored boost speed and listen for updates
try {
  chrome.storage.sync.get({ boostSpeed: 2.0 }, (items) => {
    const v = typeof items.boostSpeed === 'number' ? items.boostSpeed : 2.0;
    boostSpeed = Math.min(5, Math.max(0.25, Number(v.toFixed(2))));
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.boostSpeed) {
      const v = changes.boostSpeed.newValue;
      if (typeof v === 'number') {
        boostSpeed = Math.min(5, Math.max(0.25, Number(v.toFixed(2))));
        if (shiftHeld) {
          knownVideos.forEach(video => accelerateVideo(video));
        }
      }
    }
  });
} catch (e) {}

// Handle dynamic content changes
const observer = new MutationObserver((mutations) => {
  let hasNewVideos = false;
  
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Check if the added node is a video
        if (node.tagName === 'VIDEO') {
          hasNewVideos = true;
        }
        // Check for videos within the added node
        const videos = node.querySelectorAll ? node.querySelectorAll('video') : [];
        if (videos.length > 0) {
          hasNewVideos = true;
        }
      }
    });
  });
  
  if (hasNewVideos) {
    // Process videos after a short delay to ensure they're fully loaded
    setTimeout(() => {
      processAllVideos();
      if (shiftHeld) {
        knownVideos.forEach(video => accelerateVideo(video));
      }
    }, 100);
  }
});

// Start observing for dynamic content
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Cleanup function for when content script is unloaded
window.addEventListener('beforeunload', () => {
  observer.disconnect();
  originalPlaybackRateByVideo.clear();
});

console.log('Video Speed Booster (Advanced): Content script loaded successfully');