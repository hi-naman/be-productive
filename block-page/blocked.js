document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('go-back');
    
    // Concept: chrome.tabs API
    // We query the browser for the currently active tab in the current window.
    // Once found, we use its unique ID to close it, removing the distraction entirely.
    btn.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.remove(tabs[0].id);
            }
        });
    });
});