/**
 * Video Speed Booster (Advanced) - Background Service Worker
 * Handles extension lifecycle and provides foundation for future features
 */

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Video Speed Booster (Advanced): Extension installed/updated', details.reason);
  
  // Set default settings if needed
  if (details.reason === 'install') {
    console.log('Video Speed Booster (Advanced): First time installation');
  }
});

// Extension startup handler
chrome.runtime.onStartup.addListener(() => {
  console.log('Video Speed Booster (Advanced): Extension started');
});

// Handle messages from content scripts (for future expansion)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Video Speed Booster (Advanced): Received message:', message);
  
  // Handle different message types
  switch (message.type) {
    case 'VIDEO_SPEED_CHANGED':
      // Future: Log video speed changes for analytics
      console.log('Video speed changed:', message.data);
      break;
      
    case 'ERROR_OCCURRED':
      // Future: Handle and log errors
      console.warn('Content script error:', message.data);
      break;
      
    default:
      console.log('Unknown message type:', message.type);
  }
  
  // Always send a response
  sendResponse({ success: true });
});

// Handle tab updates (for future features)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Video Speed Booster (Advanced): Tab updated:', tab.url);
  }
});

console.log('Video Speed Booster (Advanced): Background service worker loaded'); 