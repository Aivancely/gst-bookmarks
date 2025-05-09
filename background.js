// Background script is now minimal as the popup opens automatically
// when the extension icon is clicked
console.log("GoSystem Forms Navigator extension loaded");

// Listen for clicks on the extension icon
chrome.action.onClicked.addListener(async (tab) => {
  // Only execute on fasttax.com domains or if in development mode
  if (tab.url.includes('fasttax.com') || tab.url.startsWith('http://localhost') || tab.url.startsWith('file://')) {
    try {
      // First, inject the CSS
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['panel.css']
      });
      
      // Then, check if content script is already injected by sending a test message
      try {
        await chrome.tabs.sendMessage(tab.id, { action: "ping" });
        // If we get here, content script is already loaded - send toggle command
        chrome.tabs.sendMessage(tab.id, { action: "togglePanel" });
      } catch (e) {
        // Content script not yet loaded, inject it
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        // Wait a moment for the script to initialize
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { action: "togglePanel" });
        }, 100);
      }
    } catch (error) {
      console.error("Error executing script:", error);
    }
  } else {
    // Alert the user if they're not on a GoSystem Tax page
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        alert('This extension only works on GoSystem Tax pages.');
      }
    });
  }
}); 