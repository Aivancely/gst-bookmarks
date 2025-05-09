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