// Default forms that will be used if no custom forms exist
const DEFAULT_FORMS = [
  { name: "1041 - Estates and Trusts Tax Return", fragment: "/71/22/0/0,0,0,0,0" },
  { name: "8949 Page 1, Box A", fragment: "/38/156/0/0,0,0,0,0" },
  { name: "8949 Page 2, Box D", fragment: "/38/159/0/0,0,0,0,0" }
];

// Store for our forms
let forms = [];

// Load forms from storage
async function loadForms() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('gstForms', (result) => {
      forms = result.gstForms || DEFAULT_FORMS;
      resolve(forms);
    });
  });
}

// Save forms to storage
function saveForms() {
  return chrome.storage.sync.set({ 'gstForms': forms });
}

// Add a new form
async function addForm(name, fragment) {
  forms.push({ name, fragment });
  await saveForms();
  refreshFormsList();
}

// Delete a form
async function deleteForm(index) {
  forms.splice(index, 1);
  await saveForms();
  refreshFormsList();
}

// Edit a form
async function editForm(index, name, fragment) {
  forms[index] = { name, fragment };
  await saveForms();
  refreshFormsList();
}

// Extract fragment from current URL
function getCurrentFragment() {
  try {
    const url = new URL(window.location.href);
    if (url.hash && url.hash.startsWith('#!')) {
      return url.hash.substring(2); // Remove the '#!' prefix
    }
    return '';
  } catch (e) {
    console.error('Error parsing URL:', e);
    return '';
  }
}

// Get a reasonable page name from the DOM
function getCurrentPageName() {
  // Try to get a title from the page
  const title = document.title || '';
  
  // Remove any common prefix/suffix
  let cleanTitle = title.replace(' - GoSystem Tax', '').trim();
  
  // If we have a reasonable title, use it
  if (cleanTitle && cleanTitle.length > 3 && cleanTitle.length < 50) {
    return cleanTitle;
  }
  
  // Try to find a header element that might contain the form name
  const headers = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
  for (const header of headers) {
    const text = header.textContent.trim();
    if (text && text.length > 3 && text.length < 50) {
      return text;
    }
  }
  
  // Fallback to a generic name with timestamp
  const now = new Date();
  return `Page captured on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
}

// Refresh the forms list in the panel
function refreshFormsList() {
  const formsList = document.getElementById('forms-list');
  if (!formsList) return;
  
  // Clear existing list
  formsList.innerHTML = '';
  
  // Add each form
  forms.forEach((form, index) => {
    const li = document.createElement('li');
    li.className = 'form-item';

    // Create form navigation link
    const link = document.createElement('a');
    link.href = '#';
    link.className = 'form-link';
    link.dataset.fragment = form.fragment;
    link.textContent = form.name;
    link.addEventListener('click', function(event) {
      event.preventDefault();
      navigateToFragment(this.dataset.fragment);
    });

    // Create edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'form-edit-btn';
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Edit';
    editBtn.addEventListener('click', function() {
      showEditFormModal(index);
    });

    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'form-delete-btn';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Delete';
    deleteBtn.addEventListener('click', function() {
      if (confirm(`Delete "${form.name}"?`)) {
        deleteForm(index);
      }
    });

    // Add elements to list item
    li.appendChild(link);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    formsList.appendChild(li);
  });
  
  // Add action buttons at the bottom
  const actionsLi = document.createElement('li');
  actionsLi.className = 'form-actions-item';
  
  // Add "Add Current Page" button
  const addCurrentBtn = document.createElement('button');
  addCurrentBtn.id = 'add-current-btn';
  addCurrentBtn.textContent = '+ Add Current Page';
  addCurrentBtn.addEventListener('click', function() {
    const fragment = getCurrentFragment();
    if (!fragment) {
      alert('Could not extract a valid fragment from the current URL. Make sure you are on a GoSystem Tax page with a proper URL format.');
      return;
    }
    
    const pageName = getCurrentPageName();
    showAddFormModal(pageName, fragment);
  });
  
  // Add "Add Custom Form" button
  const addCustomBtn = document.createElement('button');
  addCustomBtn.id = 'add-form-btn';
  addCustomBtn.textContent = '+ Add Custom Form';
  addCustomBtn.addEventListener('click', function() {
    showAddFormModal();
  });
  
  actionsLi.appendChild(addCurrentBtn);
  actionsLi.appendChild(addCustomBtn);
  formsList.appendChild(actionsLi);
}

// Navigate to a fragment
function navigateToFragment(fragment) {
  try {
    const url = new URL(window.location.href);
    url.hash = '!' + fragment;
    window.location.href = url.toString();
  } catch (e) {
    console.error('Invalid URL:', window.location.href);
    alert('Unable to parse the current page URL.');
  }
}

// Show the modal for adding a new form
function showAddFormModal(name = '', fragment = '') {
  const modal = document.getElementById('form-modal');
  const heading = document.getElementById('modal-heading');
  const nameInput = document.getElementById('form-name');
  const fragmentInput = document.getElementById('form-fragment');
  const saveBtn = document.getElementById('save-form-btn');
  
  heading.textContent = 'Add New Form';
  nameInput.value = name;
  fragmentInput.value = fragment;
  
  // Focus on the appropriate field
  setTimeout(() => {
    if (!name) {
      nameInput.focus();
    } else if (!fragment) {
      fragmentInput.focus();
    } else {
      nameInput.focus();
      nameInput.select();
    }
  }, 100);
  
  // Update save button handler
  saveBtn.onclick = async function() {
    const newName = nameInput.value.trim();
    const newFragment = fragmentInput.value.trim();
    
    if (newName && newFragment) {
      await addForm(newName, newFragment);
      modal.classList.remove('modal-visible');
    } else {
      alert('Please fill in all fields');
    }
  };
  
  modal.classList.add('modal-visible');
}

// Show the modal for editing an existing form
function showEditFormModal(index) {
  const form = forms[index];
  const modal = document.getElementById('form-modal');
  const heading = document.getElementById('modal-heading');
  const nameInput = document.getElementById('form-name');
  const fragmentInput = document.getElementById('form-fragment');
  const saveBtn = document.getElementById('save-form-btn');
  
  heading.textContent = 'Edit Form';
  nameInput.value = form.name;
  fragmentInput.value = form.fragment;
  
  // Focus on name field
  setTimeout(() => {
    nameInput.focus();
    nameInput.select();
  }, 100);
  
  // Update save button handler
  saveBtn.onclick = async function() {
    const name = nameInput.value.trim();
    const fragment = fragmentInput.value.trim();
    
    if (name && fragment) {
      await editForm(index, name, fragment);
      modal.classList.remove('modal-visible');
    } else {
      alert('Please fill in all fields');
    }
  };
  
  modal.classList.add('modal-visible');
}

// Create the side panel
async function createPanel() {
  // Load forms before creating panel
  await loadForms();
  
  const panel = document.createElement('div');
  panel.id = 'gst-nav-panel';
  panel.innerHTML = `
    <div class="panel-header">
      <h3>GoSystem Forms Navigator</h3>
      <button id="close-panel">×</button>
    </div>
    <div class="panel-body">
      <ul id="forms-list" class="forms-list">
        <!-- Forms will be populated here -->
      </ul>
    </div>
    
    <!-- Modal for adding/editing forms -->
    <div id="form-modal" class="modal">
      <div class="modal-content">
        <h4 id="modal-heading">Add New Form</h4>
        <div class="form-group">
          <label for="form-name">Form Name:</label>
          <input type="text" id="form-name" placeholder="e.g., 1041 - Estates and Trusts">
        </div>
        <div class="form-group">
          <label for="form-fragment">Fragment:</label>
          <input type="text" id="form-fragment" placeholder="e.g., /71/22/0/0,0,0,0,0">
        </div>
        <div class="form-actions">
          <button id="cancel-form-btn">Cancel</button>
          <button id="save-form-btn">Save</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Add event listeners
  document.getElementById('close-panel').addEventListener('click', togglePanel);
  document.getElementById('cancel-form-btn').addEventListener('click', function() {
    document.getElementById('form-modal').classList.remove('modal-visible');
  });
  
  // Initialize the forms list
  refreshFormsList();
}

// Toggle the panel's visibility
function togglePanel() {
  const panel = document.getElementById('gst-nav-panel');
  if (panel) {
    panel.classList.toggle('panel-visible');
  } else {
    createPanel();
    setTimeout(() => {
      document.getElementById('gst-nav-panel').classList.add('panel-visible');
    }, 50);
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle ping message to check if content script is loaded
  if (message.action === "ping") {
    sendResponse({status: "ok"});
    return true;
  }
  
  if (message.action === "togglePanel") {
    togglePanel();
  }
  
  return true; // Required for async sendResponse
});

// Initialize when the content script is loaded
console.log("GoSystem Forms Navigator content script loaded"); 