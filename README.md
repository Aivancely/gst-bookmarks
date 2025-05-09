### Key Points
- A Chrome extension can likely streamline navigation on the GoSystem Tax website by providing quick access to predefined forms.
- Clicking the extension's icon should open a side panel listing forms like 1041 and 8949, addressing the issue of dynamic URL tokens.
- Selecting a form updates the current tab's URL fragment (e.g., `!/71/48/0/0,0,0,0,0`) to navigate to the desired screen.
- The solution uses the Chrome Side Panel API, which may require Chrome 114 or later, but a popup alternative is also viable.
- Basic error handling ensures the extension works only on GoSystem Tax pages, enhancing reliability.

### Overview
To address the challenge of navigating to specific forms on the GoSystem Tax website, where URLs include dynamic tokens, a Chrome extension can provide a user-friendly solution. The extension allows users to click an icon to open a side panel listing predefined forms, such as the 1041 - Estates and Trusts Tax Return and Form 8949 pages. Selecting a form updates the current tab's URL by modifying the fragment (e.g., `!/38/156/0/0,0,0,0,0`) while preserving the token, enabling seamless navigation.

### Implementation Approach
The extension uses the Chrome Extensions API, specifically leveraging the Side Panel API to display a persistent panel on the right side of the browser. When the extension's icon is clicked, a background script triggers the side panel, which lists the forms. Clicking a form updates the active tab's URL using the `chrome.tabs` API, ensuring the base URL and token remain unchanged. The solution includes a check to confirm the tab is on a GoSystem Tax page (e.g., `fasttax.com`), preventing misuse.

### Limitations and Considerations
The Side Panel API requires Chrome 114 or later, so users with older versions may need a popup-based alternative. The hardcoded list of forms is simple but may require manual updates to add new forms. While the extension assumes the GoSystem Tax website's single-page application (SPA) handles fragment changes correctly, testing is recommended to confirm navigation behavior.

---

### Installation Instructions

#### Requirements
- Google Chrome version 114 or later (required for Side Panel API support)
- A computer with access to the GoSystem Tax website

#### Installation Steps
1. **Download the Extension Files**
   - Download all four files (`manifest.json`, `background.js`, `sidepanel.html`, and `sidepanel.js`) to a folder on your computer
   - Alternatively, clone or download the repository if available

2. **Load the Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" by toggling the switch in the top-right corner
   - Click the "Load unpacked" button
   - Select the folder containing the extension files
   - The GoSystem Forms Navigator extension should now appear in your extensions list

3. **Using the Extension**
   - Navigate to the GoSystem Tax website and open a tax return
   - Click the extension icon in the Chrome toolbar
   - A side panel will open on the right side of the browser
   - Click on any of the listed forms to navigate directly to that form
   - The extension will preserve your session token while updating only the fragment part of the URL

#### Troubleshooting
- If the extension doesn't work, ensure you're on a GoSystem Tax page (URL containing `fasttax.com`)
- Check that you're using Chrome version 114 or later
- If the side panel doesn't open, try reloading the page before clicking the extension icon

#### Alternative for Older Chrome Versions
If you're using a Chrome version earlier than 114, you'll need to modify the extension to use a popup instead of the side panel. See the "Alternative Approach: Popup-Based Solution" section in this README for details.

---

```plain

**manifest.json**
{
  "manifest_version": 3,
  "name": "GoSystem Forms Navigator",
  "version": "1.0",
  "description": "Quick navigation to predefined forms in GoSystem Tax.",
  "permissions": ["tabs"],
  "background": {
    "service_worker": "background.js"
  },
  "sidePanel": {
    "default_path": "sidepanel.html"
  },
  "action": {}
}

**background.js**
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

**sidepanel.html**
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GoSystem Forms</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      width: 300px;
      padding: 10px;
    }
    h3 {
      margin-top: 0;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    li {
      margin: 5px 0;
    }
    a {
      text-decoration: none;
      color: #1a73e8;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h3>Select a form to navigate:</h3>
  <ul>
    <li><a href="#" data-fragment="/71/48/0/0,0,0,0,0">1041 - Estates and Trusts Tax Return</a></li>
    <li><a href="#" data-fragment="/38/156/0/0,0,0,0,0">8949 Page 1, Box A</a></li>
    <li><a href="#" data-fragment="/38/159/0/0,0,0,0,0">8949 Page 2, Box D</a></li>
  </ul>
  <script src="sidepanel.js"></script>
</body>
</html>

**sidepanel.js**
document.addEventListener('DOMContentLoaded', function() {
  const links = document.querySelectorAll('a[data-fragment]');
  links.forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      const fragment = this.dataset.fragment;
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length === 0) {
          console.error('No active tab found.');
          return;
        }
        const tab = tabs[0];
        const currentUrl = tab.url;
        try {
          const url = new URL(currentUrl);
          if (!url.hostname.endsWith('fasttax.com')) {
            alert('This extension only works on GoSystem Tax pages.');
            return;
          }
          url.hash = '!' + fragment;
          chrome.tabs.update(tab.id, {url: url.toString()});
        } catch (e) {
          console.error('Invalid URL:', currentUrl);
          alert('Unable to parse the current tab\'s URL.');
        }
      });
    });
  });
});

```

### Introduction
Navigating the GoSystem Tax website can be cumbersome due to dynamic URL tokens that change each time a tax return is opened, making traditional bookmarks ineffective. To address this, a Chrome extension can serve as a navigation aid, allowing users to quickly access predefined forms like the 1041 - Estates and Trusts Tax Return and Form 8949 pages. This extension opens a side panel listing these forms when the extension's icon is clicked, and selecting a form updates the current tab's URL to navigate to the corresponding screen. This report details the implementation, functionality, and considerations for creating such an extension.

### Problem Context
The GoSystem Tax website uses URLs with a dynamic token, such as `https://dc-organizertoweb.fasttax.com/Home/Locator/3b700d65-28cd-48fb-a63b-cadacb41TEST/KL8R/KL8R/2024#!/38/156/0/0,0,0,0,0`. The token (e.g., `3b700d65-28cd-48fb-a63b-cadacb41TEST/KL8R/KL8R/2024`) changes per session, complicating direct navigation to specific forms. The fragment after `2024#!` (e.g., `/38/156/0/0,0,0,0,0`) determines the form displayed. The extension must preserve the token while updating the fragment to navigate to forms like:

| Form Name                          | Screen Number            |
|------------------------------------|--------------------------|
| 1041 - Estates and Trusts Tax Return | /71/48/0/0,0,0,0,0      |
| 8949 Page 1, Box A                | /38/156/0/0,0,0,0,0     |
| 8949 Page 2, Box D                | /38/159/0/0,0,0,0,0     |

### Solution Design
The Chrome extension leverages the Side Panel API to provide a persistent interface on the right side of the browser, aligning with the user's request for a "drawer to the right." The extension includes:

1. **Manifest Configuration**: Defines the extension's metadata, permissions (`tabs`), and side panel settings.
2. **Background Script**: Opens the side panel when the extension's icon is clicked.
3. **Side Panel Interface**: Displays a list of hardcoded forms with clickable links.
4. **Navigation Logic**: Updates the active tab's URL by modifying the fragment when a form is selected.

### Implementation Details
The extension consists of four files, as outlined below:

#### Manifest File (manifest.json)
The `manifest.json` file uses Manifest V3, specifying the extension's name, version, and permissions. The `tabs` permission allows access to the active tab's URL and updates. The `sidePanel` key sets the default side panel HTML, and the `background` service worker handles the icon click event.

#### Background Script (background.js)
The background script listens for the `chrome.action.onClicked` event and calls `chrome.sidePanel.open` to display the side panel for the current tab. This ensures the panel opens only when the user interacts with the extension's icon.

#### Side Panel HTML (sidepanel.html)
The side panel HTML includes a styled list of forms, each with a `data-fragment` attribute containing the screen number (e.g., `/71/48/0/0,0,0,0,0`). Basic CSS ensures a clean, readable interface with a fixed width suitable for a side panel.

#### Side Panel Script (sidepanel.js)
The JavaScript attaches click event listeners to each form link. When clicked, it:
- Retrieves the active tab's URL using `chrome.tabs.query`.
- Validates the URL's hostname (must end with `fasttax.com`).
- Constructs a new URL by setting the hash to `!` plus the form's fragment (e.g., `!/71/48/0/0,0,0,0,0`).
- Updates the tab's URL using `chrome.tabs.update`.
- Includes error handling for invalid URLs or missing tabs.

### Functionality
When the user clicks the extension's icon, the side panel opens, displaying forms like 1041 and 8949. Clicking a form updates the current tab's URL, preserving the dynamic token and changing only the fragment. For example, if the current URL is `https://dc-organizertoweb.fasttax.com/Home/Locator/[token]/2024#!/38/156/0/0,0,0,0,0`, selecting the 1041 form changes it to `https://dc-organizertoweb.fasttax.com/Home/Locator/[token]/2024#!/71/48/0/0,0,0,0,0`. The GoSystem Tax website, assumed to be a single-page application, should handle the fragment change to load the corresponding form.

### Alternative Approach: Popup-Based Solution
If the Side Panel API is unavailable (e.g., Chrome versions before 114), a popup-based solution can be used. The manifest would specify a `default_popup` instead of a side panel, and the popup HTML and JavaScript would mirror the side panel's functionality. However, popups close when focus is lost, which may be less convenient than a persistent side panel.

#### Popup Manifest Example
```json
{
  "manifest_version": 3,
  "name": "GoSystem Forms Navigator",
  "version": "1.0",
  "description": "Quick navigation to predefined forms in GoSystem Tax.",
  "permissions": ["tabs"],
  "action": {
    "default_popup": "popup.html"
  }
}
```

#### Popup HTML and JavaScript
The `popup.html` and `popup.js` would be nearly identical to `sidepanel.html` and `sidepanel.js`, with adjusted styling for a smaller popup window.

### Technical Considerations
- **Compatibility**: The Side Panel API requires Chrome 114 or later. Users with older versions should use the popup alternative.
- **URL Handling**: The extension assumes the GoSystem Tax website's SPA correctly processes fragment changes. If navigation fails, injecting scripting to manipulate `location.hash` directly may be needed.
- **Scalability**: The hardcoded form list is simple but requires manual updates. Future enhancements could include a configuration interface using `chrome.storage`.
- **Error Handling**: The extension checks the URL's hostname and handles invalid URLs, but additional validation (e.g., ensuring the URL path includes `/2024`) could enhance robustness.
- **Styling**: The side panel's fixed width (300px) is a starting point; users can adjust CSS for better usability.

### Testing Recommendations
Since access to the GoSystem Tax website is unavailable, testing should be conducted on the actual site to verify:
- The SPA's response to fragment changes.
- The stability of the Side Panel API in the target Chrome version.
- The extension's behavior across different tax return sessions with varying tokens.

A mock SPA with similar URL routing could simulate the environment for initial testing.

### Future Enhancements
- **Dynamic Form List**: Allow users to add or edit forms via an options page.
- **Form Categorization**: Group forms (e.g., by tax type) for better organization.
- **Keyboard Shortcuts**: Enable quick access to the side panel or specific forms.
- **Visual Feedback**: Highlight the current form in the side panel based on the tab's URL.

### Conclusion
This Chrome extension provides a practical solution for navigating the GoSystem Tax website, addressing the challenge of dynamic URL tokens. By using the Side Panel API, it offers a persistent, user-friendly interface for accessing predefined forms, with robust URL manipulation and error handling. For users with older Chrome versions, a popup-based alternative is viable. The implementation is straightforward, requiring minimal setup, and can be extended for additional functionality as needed.

### Key Citations
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Chrome Side Panel API Reference](https://developer.chrome.com/docs/extensions/reference/sidePanel/)