# Be Productive 🎯

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Chrome](https://img.shields.io/badge/Chrome-Extension-green.svg)
![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)

**Be Productive** is a lightweight, privacy-focused Chrome Extension designed to help you regain control of your attention. It allows users to block distracting websites during study or work sessions with a simple toggle switch.

Built using **Manifest V3**, this extension leverages native Chrome APIs to ensure low memory usage and high performance.

## 📸 Screenshots

| Extension Popup | Blocked Screen |
|:---:|:---:|
| <img src="images/popup-ui.png" alt="Popup UI" width="300"> | <img src="images/block-page.png" alt="Blocked Page" width="400"> |
## ✨ Features

* **⚡ Instant Focus Mode:** Toggle blocking on/off instantly with a clean UI.
* **🚫 Custom Blocklist:** Add or remove any website (e.g., `youtube.com`, `twitter.com`) to your personal blocklist.
* **💪 Motivational Redirect:** Instead of a generic error, blocked pages redirect to a custom "Access Denied" page with motivational quotes.
* **💾 Persistent Settings:** Uses `chrome.storage.sync` to save your preferences and blocklist across browser sessions.
* **🔒 Privacy First:** No tracking. All data is stored locally on your device.

## 🛠️ Tech Stack

* **HTML5 & CSS3** (Flexbox/Grid for layout)
* **JavaScript (ES6+)**
* **Chrome Extension APIs** (Manifest V3)
    * `chrome.tabs` (URL detection)
    * `chrome.storage` (Data persistence)
    * `chrome.scripting`

## 🚀 Installation & Setup

Since this extension is in **Developer Mode**, you need to load it manually into Chrome.

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/your-username/zone-in.git](https://github.com/your-username/zone-in.git)
    ```
    *(Or simply download the ZIP and extract it)*

2.  **Open Chrome Extensions**
    * Open Google Chrome.
    * Navigate to `chrome://extensions/` in the address bar.

3.  **Enable Developer Mode**
    * Toggle the **"Developer mode"** switch in the top-right corner.

4.  **Load the Extension**
    * Click the **"Load unpacked"** button (top-left).
    * Select the root folder of this project (`zone-in` or whatever you named the folder).

5.  **Pin & Use**
    * Click the 🧩 (Puzzle) icon in your Chrome toolbar.
    * Pin **Zone In** for easy access.

## 📂 Project Structure

```text
/zone-in
  ├──manifest.json        # Extension configuration (Manifest V3)
  ├──background.js        # Service worker for URL checking
  ├──/popup               # UI for the extension popup
  │   ├──popup.html
  │   ├──popup.css
  │   └──popup.js
  ├──/block-page          # The redirect page for blocked sites
  │   ├──blocked.html
  │   ├──blocked.css
  │   └──blocked.js
  └──/icon-images         # App icons (16, 32, 48, 128px)