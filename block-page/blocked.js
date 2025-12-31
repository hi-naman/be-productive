document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('go-back');
    
    btn.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.remove(tabs[0].id);
            }
        });
    });
});