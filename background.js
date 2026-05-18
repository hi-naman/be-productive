// Helper: Get today's date string (YYYY-MM-DD)
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// 1. Initialize Alarm on Installation/Startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("timeTracker", { periodInMinutes: 1 });
  checkDailyReset();
});

// 2. Handle Daily Reset Logic
async function checkDailyReset() {
  const data = await chrome.storage.local.get(['trackedSites']);
  const sites = data.trackedSites || [];
  const today = getTodayString();
  let updated = false;

  sites.forEach(site => {
    if (site.lastReset !== today) {
      site.usedMinutes = 0;
      site.lastReset = today;
      updated = true;
    }
  });

  if (updated) {
    await chrome.storage.local.set({ trackedSites: sites });
  }
}

// 3. Listen for Break Start & Stop Messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startBreak") {
    const timeLeftMs = message.breakEndTime - Date.now();
    const delayInMinutes = timeLeftMs / (1000 * 60);
    
    // Create an alarm to trigger exactly when the break ends
    chrome.alarms.create("breakTimer", { delayInMinutes: delayInMinutes });
    sendResponse({status: "started"});
  } 
  // NEW: Handle early break termination
  else if (message.action === "stopBreak") {
    chrome.alarms.clear("breakTimer");
    chrome.storage.local.remove('breakEndTime');
    chrome.storage.local.set({ isFocusMode: true }); // Re-enable Focus Mode
    sendResponse({status: "stopped"});
  }
  return true; // Keep message channel open for async responses
});

// 4. The Tracking & Break Alarms Loop
chrome.alarms.onAlarm.addListener(async (alarm) => {
  
  // Break Timer Finished Logic
  if (alarm.name === "breakTimer") {
    await chrome.storage.local.remove('breakEndTime'); 
    await chrome.storage.local.set({ isFocusMode: true }); 
    
    chrome.notifications.create({
      type: "basic",
      iconUrl: "images/icon128.png", 
      title: "☕ Break is Over!",
      message: "Time to get back to work. Focus mode has been automatically re-enabled.",
      priority: 2
    });
    return;
  }

  // Normal Time Tracking Logic
  if (alarm.name === "timeTracker") {
    await checkDailyReset(); 

    const data = await chrome.storage.local.get(['isFocusMode', 'trackedSites', 'breakEndTime']);
    
    // Do nothing if focus mode is off OR if a break is currently active
    if (!data.isFocusMode) return; 
    if (data.breakEndTime && Date.now() < data.breakEndTime) return; 

    const sites = data.trackedSites || [];
    const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    
    if (activeTab && activeTab.url && !activeTab.url.startsWith('chrome://')) {
      try {
        const url = new URL(activeTab.url);
        const domain = url.hostname.replace('www.', '').toLowerCase();

        const siteIndex = sites.findIndex(s => domain.includes(s.domain));
        
        if (siteIndex !== -1) {
          let site = sites[siteIndex];
          
          if (site.usedMinutes < site.limitMinutes) {
            site.usedMinutes += 1;
            await chrome.storage.local.set({ trackedSites: sites });
          }

          if (site.usedMinutes >= site.limitMinutes) {
            blockTab(activeTab.id);
          }
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    }
  }
});

// 5. Immediate Block Check on Navigation
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    const data = await chrome.storage.local.get(['isFocusMode', 'trackedSites', 'breakEndTime']);
    
    // Skip immediate block check if Focus Mode is off OR if on a break
    if (!data.isFocusMode) return;
    if (data.breakEndTime && Date.now() < data.breakEndTime) return;

    const sites = data.trackedSites || [];
    try {
      const url = new URL(tab.url);
      const domain = url.hostname.replace('www.', '').toLowerCase();

      const site = sites.find(s => domain.includes(s.domain));

      if (site && site.usedMinutes >= site.limitMinutes) {
        blockTab(tabId);
      }
    } catch(e) {}
  }
});

function blockTab(tabId) {
  const blockPageUrl = chrome.runtime.getURL("block-page/blocked.html");
  chrome.tabs.update(tabId, { url: blockPageUrl });
}