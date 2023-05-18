function updateClock() {
    const clockElement = document.getElementById("digital-clock");
    const currentTime = moment().format("HH:mm:ss");
    clockElement.textContent = currentTime;
}

setInterval(updateClock, 1000);

// Event listener for when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;

    // Perform actions based on the current page
    if (currentPage === "/") {
        // Configurations Page
        const editButtons = document.querySelectorAll('.edit-config');
        editButtons.forEach(button => {
            button.addEventListener('click', handleEditConfig);
        });
        document.getElementById('save-edit').addEventListener('click', () => {
            const row = document.querySelector('.editing');
        saveConfig(row);
        });
        const addNewConfigButton = document.getElementById('add-new-config');
        addNewConfigButton.addEventListener('click', handleAddNewConfig);
        const overlay = document.querySelector('.overlay');
        overlay.addEventListener('click', () => {
        const editForm = document.querySelector('.edit-form');
        editForm.style.display = 'none';
        overlay.style.display = 'none';

        // Find the row with the 'editing' class and remove it
        const editingRow = document.querySelector('.editing');
        if (editingRow) {
            editingRow.classList.remove('editing');
        }

        // If the row was newly added but not saved, remove it
        if (editingRow && editingRow.dataset.newRow === 'true') {
            editingRow.remove();
        }
        });
    } else if (currentPage === "/database") {
        // Database Page
        const contextMenu = createContextMenu();
        document.body.appendChild(contextMenu);
        document.body.onclick = hideContextMenu;
        const fileExplorer = document.getElementById('file-explorer');
        if (fileExplorer) {
            loadFileExplorer('/tests');
        }
    }
});

// ...

// Configurations Page Functions

function handleEditConfig(event) {
    const button = event.target;
    const row = button.closest('tr');
    const isEditing = row.classList.contains('editing');
    // If the row is already in edit mode, don't start editing again
    if (!isEditing) {
        editConfig(row);
        button.textContent = 'Edit';
        row.classList.toggle('editing');
    }
    row.classList.toggle('editing');
}

function editConfig(row) {

    const filename = row.dataset.filename;
    const loaded = row.dataset.loaded;
    const data = Array.from(row.querySelectorAll('td')).map(cell => cell.textContent);
    row.dataset.originalFilename = filename;
    const editForm = document.querySelector('.edit-form');
    editForm.style.display = 'block';
    const overlay = document.querySelector('.overlay');
    overlay.style.display = 'block';
    editForm.style.display = 'block';

    document.getElementById('edit-filename').value = filename;
    document.getElementById('edit-url').value = data[2];
    document.getElementById('edit-blocking-page-regex').value = data[3];
    document.getElementById('edit-threads').value = data[4];
    document.getElementById('edit-user-agent').value = data[5];
    document.getElementById('edit-host').value = data[6];
    document.getElementById('edit-xff-name').value = data[7];
    document.getElementById('edit-xff-value').value = data[8];

    const saveButton = document.getElementById('save-edit');
    saveButton.addEventListener('click', () => {
        saveConfig(row);
    });
}

function saveConfig(row) {
    const editForm = document.querySelector('.edit-form');
    const overlay = document.querySelector('.overlay');
    overlay.style.display = 'none';
    editForm.style.display = 'none';
    const filenameInput = document.getElementById('edit-filename');
    const urlInput = document.getElementById('edit-url');
    const blockingPageRegexInput = document.getElementById('edit-blocking-page-regex');
    const threadsInput = document.getElementById('edit-threads');
    const userAgentInput = document.getElementById('edit-user-agent');
    const hostInput = document.getElementById('edit-host');
    const xffNameInput = document.getElementById('edit-xff-name');
    const xffValueInput = document.getElementById('edit-xff-value');

    const filename = filenameInput.value;
    const url = urlInput.value;
    const blockingPageRegex = blockingPageRegexInput.value;
    const threads = threadsInput.value;
    const userAgent = userAgentInput.value;
    const host = hostInput.value;
    const xffName = xffNameInput.value;
    const xffValue = xffValueInput.value;

    row.dataset.filename = filename;
    const originalFilename = row.dataset.originalFilename;

    // Check if the filename already exists in the table
    const allFilenames = Array.from(document.querySelectorAll('tbody tr')).map(tr => tr.dataset.filename);
    if (allFilenames.includes(filename) && filename !== originalFilename) {
        alert('Filename already exists!');
        return;
    }
    Array.from(row.querySelectorAll('td')).forEach((cell, index) => {
        switch (index) {
            case 1:
                cell.textContent = filename;
                break;
            case 2:
                cell.textContent = url;
                break;
            case 3:
                cell.textContent = blockingPageRegex;
                break;
            case 4:
                cell.textContent = threads;
                break;
            case 5:
                cell.textContent = userAgent;
                break;
            case 6:
                cell.textContent = host;
                break;
            case 7:
                cell.textContent = xffName;
                break;
            case 8:
                cell.textContent = xffValue;
                break;
            default:
                break;
        }
    });
    if (row.dataset.newRow === 'true') {
        delete row.dataset.newRow;

        // Add the row to the table body
        const tbody = document.querySelector('tbody');
        tbody.appendChild(row);
    }
    editForm.style.display = 'none';

    // Save the updated configuration to the server
    const configData = {
        original_file_name: originalFilename,
        filename: filename,
        data: {
            url,
            blocking_page_regex: blockingPageRegex,
            threads,
            user_agent: userAgent,
            host,
            xff: {
                [xffName]: xffValue
            }
        }
    };
    fetch('/api/save-config', {
        method: 'POST',
        body: JSON.stringify(configData),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Configuration saved successfully');
        } else {
            console.error('Error saving configuration:', data.error);
        }
    });
}

function handleAddNewConfig() {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="radio" name="loaded"></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td><button class="edit-config">Save</button></td>
    `;

    const editButton = newRow.querySelector('.edit-config');
    editButton.addEventListener('click', handleEditConfig);
    newRow.dataset.originalFilename = '';

    editConfig(newRow);
    newRow.classList.add('editing');

    // Mark the row as newly added
    newRow.dataset.newRow = 'true';
}


// Database Page Functions
function createContextMenu() {
  const menu = document.createElement('ul');
  menu.className = 'context-menu';

  const options = [
    { label: 'Rename', action: 'rename' },
    { label: 'Delete', action: 'delete' },
    { label: 'New Directory', action: 'new-directory' },
    { label: 'New File', action: 'new-file' },
  ];

  options.forEach(option => {
    const listItem = document.createElement('li');
    listItem.textContent = option.label;
    listItem.dataset.action = option.action;
    listItem.onclick = (event) => contextMenuAction(event, option.action);
    menu.appendChild(listItem);
  });

  return menu;
}

function showContextMenu(event, target) {
  if (!target) return; // Add this line
  event.preventDefault();
  const contextMenu = document.querySelector('.context-menu');
  contextMenu.style.display = 'block';
  contextMenu.style.left = `${event.clientX}px`;
  contextMenu.style.top = `${event.clientY}px`;
  contextMenu.dataset.targetPath = target; // Change this line
}

function hideContextMenu() {
  const contextMenu = document.querySelector('.context-menu');
  contextMenu.style.display = 'none';
}

function contextMenuAction(event, action) {
  const targetPath = event.currentTarget.closest('.context-menu').dataset.targetPath; // Change this line
  const target = document.querySelector(`[data-path="${targetPath}"]`);

  if (!target) return;

  // Get the parent directory item
  const parentDirItem = target.closest('.directory');
  const parentPath = parentDirItem ? parentDirItem.dataset.path : '';

  switch (action) {
    case 'rename':
      // Rename item
      const newName = prompt('Enter new name:');
      if (newName) {
        const newPath = parentPath + '/' + newName;
        if (renameItem(target.dataset.path, newPath)) {
          target.textContent = newName;
          target.dataset.path = newPath;
        }
      }
      break;
    case 'delete':
      // Delete item
      if (confirm('Are you sure you want to delete this item?')) {
        if (deleteItem(target.dataset.path)) {
          target.remove();
        }
      }
      break;
    case 'new-directory':
      // Create new directory
      const newDirName = prompt('Enter new directory name:');
      if (newDirName) {
        if (createNewDirectory(parentPath, newDirName)) {
          loadFileExplorer(parentPath, parentDirItem);
        }
      }
      break;
    case 'new-file':
      // Create new file
      const newFileName = prompt('Enter new file name:');
      if (newFileName) {
		if (createNewFile(parentPath, newFileName)) {
			loadFileExplorer(parentPath, parentDirItem);
			}
		}
		break;
		default:
	console.error('Unknown context menu action:', action);
	}
}

async function loadFileExplorer(path, listItem) {
    const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
    const data = await response.json();
    const itemsContainer = document.createElement('ul');
    itemsContainer.style.listStyleType = 'none';
    itemsContainer.style.paddingLeft = '1rem';

    if (!listItem) {
        const fileExplorer = document.getElementById('file-explorer');
        fileExplorer.innerHTML = '';
        fileExplorer.appendChild(itemsContainer);
    } else {
        if (listItem.lastChild.tagName === 'UL') {
            listItem.removeChild(listItem.lastChild);
            const arrow = listItem.querySelector('.arrow');
            arrow.textContent = '>';
            return;
        } else {
            listItem.appendChild(itemsContainer);
        }
    }

    data.forEach(entry => {
        const newListItem = document.createElement('li');
        newListItem.textContent = entry.name;
        newListItem.dataset.path = entry.path;
        newListItem.className = entry.is_directory ? 'directory' : 'file';
        newListItem.oncontextmenu = (event) => {
            event.stopPropagation();
            showContextMenu(event, entry.path); // Replace 'targetPath' with 'entry.path'
        };

        if (entry.is_directory) {
            newListItem.insertAdjacentHTML('afterbegin', '<span class="arrow">&gt;</span>');
        }

        newListItem.onclick = async (event) => {
            event.stopPropagation();

            if (entry.is_directory) {
                const arrow = newListItem.querySelector('.arrow');
                const isExpanded = arrow.textContent === '▼';

                if (isExpanded) {
                    if (newListItem.lastChild.tagName === 'UL') {
                        newListItem.removeChild(newListItem.lastChild);
                    }
                    arrow.textContent = '>';
                } else {
                    await loadFileExplorer(entry.path, newListItem);
                    arrow.textContent = '▼';
                }
            } else {
                loadFileContent(entry.path);
            }
        };

        itemsContainer.appendChild(newListItem);
    });


}

async function loadFileContent(path) {
    const fixedPath = path.replace(/\\/g, '/'); // Add this line to replace backslashes with forward slashes
    const response = await fetch(`/api/file-content?path=${encodeURIComponent(fixedPath)}`);
    const data = await response.json();

    if (data.error) {
        console.error(data.error);
        return;
    } else {
        const editor = document.getElementById('text-editor');
        editor.value = data.content;
    }
}

async function saveFileContent() {
    const editor = document.getElementById('text-editor');
    const path = editor.dataset.path;
    const content = editor.value;

    const formData = new FormData();
    formData.append('path', path);
    formData.append('content', content);

    const response = await fetch('/api/files', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    if (result.success) {
        alert('File saved successfully');
    } else {
        alert(`Error: ${result.error}`);
    }
}

async function renameItem(srcPath, destPath) {
  try {
    const response = await fetch('/api/rename', {
      method: 'POST',
      body: new FormData(Object.entries({ src_path: srcPath, dest_path: destPath })),
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.success;
  } catch (error) {
    console.error('Error renaming item:', error);
    return false;
  }
}

async function deleteItem(targetPath) {
  try {
    const response = await fetch('/api/delete', {
      method: 'POST',
      body: new FormData(Object.entries({ target_path: targetPath })),
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.success;
  } catch (error) {
    console.error('Error deleting item:', error);
    return false;
  }
}

async function createNewDirectory(parentPath, dirName) {
  try {
    const response = await fetch('/api/new-directory', {
      method: 'POST',
      body: new FormData(Object.entries({ parent_path: parentPath, dir_name: dirName })),
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.success;
  } catch (error) {
    console.error('Error creating new directory:', error);
    return false;
  }
}

async function createNewFile(parentPath, fileName) {
  try {
    const response = await fetch('/api/new-file', {
      method: 'POST',
      body: new FormData(Object.entries({ parent_path: parentPath, file_name: fileName })),
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.success;
  } catch (error) {
    console.error('Error creating new file:', error);
    return false;
  }
}
