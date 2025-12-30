document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggle-focus');
  const statusText = document.getElementById('status');
  const siteInput = document.getElementById('site-input');
  const addBtn = document.getElementById('add-btn');
  const siteList = document.getElementById('site-list');

  // 1. Load saved settings on startup
  chrome.storage.sync.get(['isFocusMode', 'blockedSites'], (data) => {
    toggleBtn.checked = data.isFocusMode || false;
    statusText.textContent = toggleBtn.checked ? "On" : "Off";
    
    const sites = data.blockedSites || [];
    sites.forEach(site => addSiteToUI(site));
  });

  // 2. Toggle Focus Mode
  toggleBtn.addEventListener('change', () => {
    const isEnabled = toggleBtn.checked;
    statusText.textContent = isEnabled ? "Status: Focus Mode Active 🔥" : "Status: Off 😴";
    chrome.storage.sync.set({ isFocusMode: isEnabled });
  });

  // 3. Add a new site
  addBtn.addEventListener('click', () => {
    const site = siteInput.value.trim();
    if (site) {
      chrome.storage.sync.get(['blockedSites'], (data) => {
        const sites = data.blockedSites || [];
        if (!sites.includes(site)) {
          sites.push(site);
          chrome.storage.sync.set({ blockedSites: sites }, () => {
            addSiteToUI(site);
            siteInput.value = '';
          });
        }
      });
    }
  });

  // Helper function to render list
  function addSiteToUI(site) {
    const li = document.createElement('li');
    li.textContent = site;
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'X';
    removeBtn.style.marginLeft = '10px';
    removeBtn.onclick = () => {
      chrome.storage.sync.get(['blockedSites'], (data) => {
        const newSites = data.blockedSites.filter(s => s !== site);
        chrome.storage.sync.set({ blockedSites: newSites }, () => {
          li.remove();
        });
      });
    };

    li.appendChild(removeBtn);
    siteList.appendChild(li);
  }
});