chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    
    chrome.storage.sync.get(['isFocusMode', 'blockedSites'], (data) => {
      const isFocusMode = data.isFocusMode || false;
      const blockedSites = data.blockedSites || [];

      if (isFocusMode) {
        // Check if the current URL matches any blocked site
        const isBlocked = blockedSites.some(site => tab.url.includes(site));

        if (isBlocked) {
          // Redirect to the custom blocked page
          chrome.tabs.update(tabId, { url: "block-page/blocked.html" });
        }
      }
    });
  }
});