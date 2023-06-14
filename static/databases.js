
var myCodeMirror = CodeMirror.fromTextArea(document.querySelector('.codemirror-textarea'), {
    lineNumbers: true,
    mode: 'text' // replace 'text' with the mode you want to use
});


document.addEventListener('DOMContentLoaded', () => {
    const contextMenu = createContextMenu();
    document.body.appendChild(contextMenu);
    document.body.onclick = hideContextMenu;
    myCodeMirror.getWrapperElement().classList.add('disabled');

    const fileExplorer = document.getElementById('file-explorer');
    if (fileExplorer) {
        loadFileExplorer('/payloadDB');

        // Add the event listener here
        fileExplorer.oncontextmenu = (event) => {
            // If the user right-clicks on a file or directory, use its path
            const target = event.target.closest('.file, .directory');
            const targetPath = target ? target.dataset.path : '/payloadDB'; // Use the root path if the user right-clicks on the file explorer itself

            showContextMenu(event, targetPath);
        };
    }
});



function createContextMenu() {
    const menu = document.createElement('ul');
    menu.className = 'context-menu';

    const options = [{
            label: 'Rename',
            action: 'rename'
        },
        {
            label: 'Delete',
            action: 'delete'
        },
        {
            label: 'New Directory',
            action: 'new-directory'
        },
        {
            label: 'New File',
            action: 'new-file'
        },
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
        myCodeMirror.setValue(data.content);
        myCodeMirror.getWrapperElement().classList.remove('disabled'); // Add this line
    }
}



async function saveFileContent() {
    const path = myCodeMirror.getDoc().getMeta('filePath');
    const content = myCodeMirror.getValue();

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
            body: new FormData(Object.entries({
                src_path: srcPath,
                dest_path: destPath
            })),
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
            body: new FormData(Object.entries({
                target_path: targetPath
            })),
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
            body: new FormData(Object.entries({
                parent_path: parentPath,
                dir_name: dirName
            })),
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
            body: new FormData(Object.entries({
                parent_path: parentPath,
                file_name: fileName
            })),
        });
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        if (data.success) {
            myCodeMirror.getWrapperElement().classList.remove('disabled'); // Add this line
        }
        return data.success;
    } catch (error) {
        console.error('Error creating new file:', error);
        return false;
    }
}
