document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('go-back');
    
    btn.addEventListener('click', () => {
        // Option 1: Go back to the previous page
        // history.back();

        // Option 2: Close the tab (Better for productivity)
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.remove(tabs[0].id);
            }
        });
    });
});