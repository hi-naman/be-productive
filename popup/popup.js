document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggle-focus');
  const statusText = document.getElementById('status');
  const siteInput = document.getElementById('site-input');
  const addBtn = document.getElementById('add-btn');
  const siteList = document.getElementById('site-list');
  const suggestionsList = document.getElementById('suggestions-list');

  // 1. Initialize UI
  chrome.storage.sync.get(['isFocusMode', 'blockedSites'], (data) => {
    toggleBtn.checked = data.isFocusMode || false;
    updateStatusText(toggleBtn.checked);
    const sites = data.blockedSites || [];
    sites.forEach(site => addSiteToUI(site));
  });

  // 2. Toggle Logic
  toggleBtn.addEventListener('change', () => {
    const isEnabled = toggleBtn.checked;
    updateStatusText(isEnabled);
    chrome.storage.sync.set({ isFocusMode: isEnabled });
  });

  function updateStatusText(isEnabled) {
    statusText.textContent = isEnabled ? "Status: Focus Mode Active 🔥" : "Status: Off 😴";
  }

  // --- 3. CUSTOM AUTOCOMPLETE LOGIC --- //
  siteInput.addEventListener('input', () => {
    const query = siteInput.value.toLowerCase().trim();
    suggestionsList.innerHTML = ''; 

    if (query.length < 1) {
      suggestionsList.classList.add('hidden');
      return;
    }

    // Filter local data 
    const matches = TOP_SITES.filter(site => 
      site.domain.includes(query) || site.name.toLowerCase().includes(query)
    );

    if (matches.length > 0) {
      matches.slice(0, 5).forEach(match => { 
        const li = document.createElement('li');
        
        // FIX: Use Google's Public Favicon Service
        // sz=64 gives a high-quality image
        const iconUrl = `https://www.google.com/s2/favicons?domain=${match.domain}&sz=64`;

        li.innerHTML = `
          <img src="${iconUrl}" alt="icon" />
          <span>${match.name} <small>(${match.domain})</small></span>
        `;
        
        li.addEventListener('click', () => {
          addSite(match.domain);
          siteInput.value = '';
          suggestionsList.classList.add('hidden');
        });

        suggestionsList.appendChild(li);
      });
      suggestionsList.classList.remove('hidden');
    } else {
      suggestionsList.classList.add('hidden');
    }
  });

  // Hide dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!siteInput.contains(e.target) && !suggestionsList.contains(e.target)) {
      suggestionsList.classList.add('hidden');
    }
  });

  // --- 4. Add Site Logic --- //
  addBtn.addEventListener('click', () => {
    if (siteInput.value) addSite(siteInput.value);
  });

  function addSite(domain) {
    let cleanDomain = domain.trim().toLowerCase();
    // Remove http/https/www to get raw domain for the API
    cleanDomain = cleanDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');

    if (!cleanDomain) return;

    chrome.storage.sync.get(['blockedSites'], (data) => {
      const sites = data.blockedSites || [];
      if (!sites.includes(cleanDomain)) {
        sites.push(cleanDomain);
        chrome.storage.sync.set({ blockedSites: sites }, () => {
          addSiteToUI(cleanDomain);
          siteInput.value = '';
        });
      }
    });
  }

  function addSiteToUI(site) {
    const li = document.createElement('li');
    
    const iconUrl = `https://www.google.com/s2/favicons?domain=${site}&sz=64`;

    li.innerHTML = `
      <img src="${iconUrl}" alt="icon" />
      <span>${site}</span>
      <button class="remove-btn">✕</button>
    `;
    
    li.querySelector('.remove-btn').addEventListener('click', () => {
      chrome.storage.sync.get(['blockedSites'], (data) => {
        const newSites = data.blockedSites.filter(s => s !== site);
        chrome.storage.sync.set({ blockedSites: newSites }, () => {
          li.remove();
        });
      });
    });

    siteList.appendChild(li);
  }
});