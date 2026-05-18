document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggle-focus');
  const statusText = document.getElementById('status');
  const siteInput = document.getElementById('site-input');
  const addBtn = document.getElementById('add-btn');
  const siteList = document.getElementById('site-list');
  const suggestionsList = document.getElementById('suggestions-list');

  // Break Feature Elements
  const takeBreakBtn = document.getElementById('take-break-btn');
  const breakOptions = document.getElementById('break-options');
  const cancelSelectionBtn = document.getElementById('cancel-selection-btn');
  const breakActiveUI = document.getElementById('break-active-ui');
  const breakTimerDisplay = document.getElementById('break-timer');
  const durationBtns = document.querySelectorAll('.duration-btn:not(#custom-break-btn)');
  
  // NEW: Custom & Stop Elements
  const customBreakBtn = document.getElementById('custom-break-btn');
  const customBreakInput = document.getElementById('custom-break-input');
  const stopBreakBtn = document.getElementById('stop-break-btn');

  let countdownInterval = null;

  function getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  // 1. Initialize UI
  chrome.storage.local.get(['isFocusMode', 'trackedSites', 'breakEndTime'], (data) => {
    toggleBtn.checked = data.isFocusMode || false;
    updateStatusText(toggleBtn.checked);
    const sites = data.trackedSites || [];
    sites.forEach(siteObj => addSiteToUI(siteObj));

    if (data.breakEndTime && Date.now() < data.breakEndTime) {
        startUICountdown(data.breakEndTime);
    }
  });

  // 2. Toggle Logic
  toggleBtn.addEventListener('change', () => {
    const isEnabled = toggleBtn.checked;
    updateStatusText(isEnabled);
    chrome.storage.local.set({ isFocusMode: isEnabled });
  });

  function updateStatusText(isEnabled) {
    statusText.textContent = isEnabled ? "Status: Focus Mode Active 🔥" : "Status: Off 😴";
  }

  // --- Break Feature Logic --- //
  takeBreakBtn.addEventListener('click', () => {
      takeBreakBtn.classList.add('hidden');
      breakOptions.classList.remove('hidden');
  });

  cancelSelectionBtn.addEventListener('click', () => {
      breakOptions.classList.add('hidden');
      takeBreakBtn.classList.remove('hidden');
      // Reset custom input state if open
      customBreakInput.classList.add('hidden');
      customBreakBtn.classList.remove('hidden');
  });

  // Standard duration buttons
  durationBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
          const minutes = parseInt(e.target.getAttribute('data-time'));
          startBreakProcess(minutes);
      });
  });

  // NEW: Custom Break Logic
  customBreakBtn.addEventListener('click', () => {
      customBreakBtn.classList.add('hidden');
      customBreakInput.classList.remove('hidden');
      customBreakInput.focus();
  });

  const handleCustomBreakSubmit = () => {
      const minutes = parseInt(customBreakInput.value);
      if (!isNaN(minutes) && minutes > 0) {
          startBreakProcess(minutes);
      } else {
          customBreakInput.classList.add('hidden');
          customBreakBtn.classList.remove('hidden');
      }
      customBreakInput.value = ''; // Reset input
  };

  customBreakInput.addEventListener('blur', handleCustomBreakSubmit);
  customBreakInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleCustomBreakSubmit();
  });

  function startBreakProcess(minutes) {
      const breakEndTime = Date.now() + (minutes * 60 * 1000);
      chrome.storage.local.set({ breakEndTime: breakEndTime }, () => {
          chrome.runtime.sendMessage({ action: "startBreak", breakEndTime: breakEndTime });
          breakOptions.classList.add('hidden');
          
          // Reset custom button for next time
          customBreakInput.classList.add('hidden');
          customBreakBtn.classList.remove('hidden');
          
          startUICountdown(breakEndTime);
      });
  }

  // NEW: Stop Break Logic
  stopBreakBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: "stopBreak" }, () => {
          if (countdownInterval) clearInterval(countdownInterval);
          breakActiveUI.classList.add('hidden');
          takeBreakBtn.classList.remove('hidden');
          breakTimerDisplay.textContent = "00:00";
      });
  });

  function startUICountdown(endTime) {
      takeBreakBtn.classList.add('hidden');
      breakOptions.classList.add('hidden');
      breakActiveUI.classList.remove('hidden');

      if (countdownInterval) clearInterval(countdownInterval);

      const updateTimer = () => {
          const now = Date.now();
          const timeLeft = endTime - now;

          if (timeLeft <= 0) {
              clearInterval(countdownInterval);
              breakActiveUI.classList.add('hidden');
              takeBreakBtn.classList.remove('hidden');
              breakTimerDisplay.textContent = "00:00";
          } else {
              const minutes = Math.floor(timeLeft / 1000 / 60);
              const seconds = Math.floor((timeLeft / 1000) % 60);
              breakTimerDisplay.textContent = 
                  `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }
      };

      updateTimer(); 
      countdownInterval = setInterval(updateTimer, 1000);
  }

  // --- CUSTOM AUTOCOMPLETE LOGIC --- //
  siteInput.addEventListener('input', () => {
    const query = siteInput.value.toLowerCase().trim();
    suggestionsList.innerHTML = ''; 

    if (query.length < 1) {
      suggestionsList.classList.add('hidden');
      return;
    }

    if (typeof TOP_SITES !== 'undefined') {
      const matches = TOP_SITES.filter(site => 
        site.domain.includes(query) || site.name.toLowerCase().includes(query)
      );

      if (matches.length > 0) {
        matches.slice(0, 5).forEach(match => { 
          const li = document.createElement('li');
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
    }
  });

  document.addEventListener('click', (e) => {
    if (!siteInput.contains(e.target) && !suggestionsList.contains(e.target)) {
      suggestionsList.classList.add('hidden');
    }
  });

  // --- Add Site Logic --- //
  addBtn.addEventListener('click', () => {
    if (siteInput.value) addSite(siteInput.value);
  });

  function addSite(domain) {
    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');

    if (!cleanDomain) return;

    chrome.storage.local.get(['trackedSites'], (data) => {
      const sites = data.trackedSites || [];
      const exists = sites.find(s => s.domain === cleanDomain);
      
      if (!exists) {
        const newSiteObj = {
          domain: cleanDomain,
          limitMinutes: 15, 
          usedMinutes: 0,
          lastReset: getTodayString()
        };
        
        sites.push(newSiteObj);
        chrome.storage.local.set({ trackedSites: sites }, () => {
          addSiteToUI(newSiteObj);
          siteInput.value = '';
        });
      }
    });
  }

  function updateTimeLimit(domain, newLimit) {
    chrome.storage.local.get(['trackedSites'], (data) => {
      const sites = data.trackedSites || [];
      const index = sites.findIndex(s => s.domain === domain);
      
      if (index !== -1) {
        sites[index].limitMinutes = newLimit;
        chrome.storage.local.set({ trackedSites: sites }, () => {
          siteList.innerHTML = '';
          sites.forEach(s => addSiteToUI(s));
        });
      }
    });
  }

  // --- Dynamic UI Rendering --- //
  function addSiteToUI(siteObj) {
    const li = document.createElement('li');
    const iconUrl = `https://www.google.com/s2/favicons?domain=${siteObj.domain}&sz=64`;

    const timeRemaining = Math.max(0, siteObj.limitMinutes - siteObj.usedMinutes);
    let progressPercent = 0;
    if (siteObj.limitMinutes > 0) {
        progressPercent = Math.min(100, (siteObj.usedMinutes / siteObj.limitMinutes) * 100);
    } else if (siteObj.limitMinutes === 0) {
        progressPercent = 100;
    }
    
    const isReached = siteObj.usedMinutes >= siteObj.limitMinutes;
    const barClass = isReached ? 'fill-red' : 'fill-green';
    const labelText = isReached ? '⏳ Limit reached' : `⏳ ${timeRemaining}min left`;

    const standardLimits = [0, 5, 15, 30, 45, 60, 120];
    const isCustomLimit = !standardLimits.includes(siteObj.limitMinutes);

    let selectHTML = `
      <select class="limit-select">
        <option value="0" ${siteObj.limitMinutes == 0 ? 'selected' : ''}>Block Now</option>
        <option value="5" ${siteObj.limitMinutes == 5 ? 'selected' : ''}>5m</option>
        <option value="15" ${siteObj.limitMinutes == 15 ? 'selected' : ''}>15m</option>
        <option value="30" ${siteObj.limitMinutes == 30 ? 'selected' : ''}>30m</option>
        <option value="45" ${siteObj.limitMinutes == 45 ? 'selected' : ''}>45m</option>
        <option value="60" ${siteObj.limitMinutes == 60 ? 'selected' : ''}>1h</option>
        <option value="120" ${siteObj.limitMinutes == 120 ? 'selected' : ''}>2h</option>
    `;

    if (isCustomLimit) {
      selectHTML += `<option value="${siteObj.limitMinutes}" selected>${siteObj.limitMinutes}m</option>`;
    }
    selectHTML += `<option value="custom">Custom...</option></select>`;

    li.innerHTML = `
      <div class="site-info">
        <img src="${iconUrl}" alt="icon" />
        <span>${siteObj.domain}</span>
      </div>
      <div class="limit-control">
        ${selectHTML}
        <input type="number" class="custom-limit-input" placeholder="Min" style="display:none; width: 55px; padding: 4px; border-radius: 4px; border: 1px solid #ddd; font-size: 11px;">
      </div>
      <div class="progress-wrapper">
        <div class="progress-bg">
          <div class="progress-fill ${barClass}" style="width: ${progressPercent}%;"></div>
        </div>
        <span class="time-label">${labelText}</span>
      </div>
      <button class="remove-btn">✕</button>
    `;
    
    const selectEl = li.querySelector('.limit-select');
    const inputEl = li.querySelector('.custom-limit-input');

    selectEl.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        selectEl.style.display = 'none';
        inputEl.style.display = 'block';
        inputEl.focus();
      } else {
        updateTimeLimit(siteObj.domain, parseInt(e.target.value));
      }
    });

    const handleCustomSubmit = () => {
      const newLimit = parseInt(inputEl.value);
      if (!isNaN(newLimit) && newLimit >= 0) {
        updateTimeLimit(siteObj.domain, newLimit);
      } else {
        chrome.storage.local.get(['trackedSites'], (data) => {
          siteList.innerHTML = '';
          (data.trackedSites || []).forEach(s => addSiteToUI(s));
        });
      }
    };

    inputEl.addEventListener('blur', handleCustomSubmit);
    inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleCustomSubmit();
    });

    li.querySelector('.remove-btn').addEventListener('click', () => {
      chrome.storage.local.get(['trackedSites'], (data) => {
        const newSites = data.trackedSites.filter(s => s.domain !== siteObj.domain);
        chrome.storage.local.set({ trackedSites: newSites }, () => {
          li.remove();
        });
      });
    });

    siteList.appendChild(li);
  }
});