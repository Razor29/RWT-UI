
// Variable related to Code Mirror file editor
var myCodeMirror = CodeMirror.fromTextArea(document.querySelector('.codemirror-textarea'), {
    lineNumbers: true,
    mode: 'text' // replace 'text' with the mode you want to use
});
// get the overlay
let overlay = document.querySelector(".database-overlay");
overlay.style.display = "none";
// add event listener to the overlay to close the form when clicked
overlay.addEventListener("click", function(event) {
    // only close the form if the overlay itself was clicked
    if (event.target === overlay) {
        let forms = document.querySelectorAll(".popup-form");
        forms.forEach((form) => {
            hideForm(form);
        });
    }
});

// function to show a form
function showForm(form, data) {
    // populate the form fields
    if (data) {
        let input = form.querySelector('input');
        if (input) {
            input.value = data;
        }
    }

    // show the form and overlay
    overlay.style.display = "block";
    form.style.display = "block";

    // hide the context menu when a form is shown
    hideContextMenu();
}


// function to hide a form
function hideForm(form) {
    overlay.style.display = "none";
    form.style.display = "none";

    // reset the form values
    let inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.value = '';
    });


}


document.addEventListener('DOMContentLoaded', () => {
        const contextMenu = createContextMenu();
    document.body.appendChild(contextMenu);
    //document.body.onclick = hideContextMenu;
    myCodeMirror.getWrapperElement().classList.add('disabled');


    overlay = document.querySelector('.database-overlay');
    overlay.style.display = "none";

    const fileExplorer = document.getElementById('file-explorer');
    if (fileExplorer) {
        loadFileExplorer('/payloadDB');

        fileExplorer.oncontextmenu = (event) => {
            const target = event.target.closest('.file, .directory');
            const targetPath = target ? target.dataset.path : '/payloadDB';

            showContextMenu(event, targetPath);
        };
    }
});

// ########################################################
// Context Menu Functions
// ########################################################

function createContextMenu() {
    const menu = document.createElement('ul');
    menu.className = 'context-menu';

    const options = [
        {
            label: 'New File',
            action: 'new-file',
            id: 'context-menu-new-file'
        },
        {
            label: 'New Directory',
            action: 'new-directory',
            id: 'context-menu-new-directory'
        },
        {
            label: 'Rename',
            action: 'rename',
            id: 'context-menu-rename'
        },
        {
            label: 'Delete',
            action: 'delete',
            id: 'context-menu-delete'
        }
    ];

    options.forEach(option => {
        const listItem = document.createElement('li');
        listItem.textContent = option.label;
        listItem.dataset.action = option.action;
        listItem.id = option.id;
        listItem.onclick = (event) => contextMenuAction(event, option.action);
        menu.appendChild(listItem);
    });


    return menu;
}

function contextMenuAction(event, action) {
    const targetPath = event.currentTarget.closest('.context-menu').dataset.targetPath;

    if (!targetPath) return;

    switch (action) {
        case 'rename':
            renameItem(targetPath);
            break;
        case 'delete':
            deleteItem(targetPath);
            break;
        case 'new-directory':
            createNewItem(targetPath, true);
            break;
        case 'new-file':
            createNewItem(targetPath, false);
            break;
        default:
            console.error('Unknown context menu action:', action);
    }
}

function showContextMenu(event, target) {
    // Check if target is null or undefined
    if (!target) return;
    event.preventDefault();
    const contextMenu = document.querySelector('.context-menu');
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${event.clientX}px`;
    contextMenu.style.top = `${event.clientY}px`;

    // Convert backslashes to forward slashes in the target path
    let correctedTargetPath = target.replace(/\\/g, '/');
    contextMenu.dataset.targetPath = correctedTargetPath;
}

function hideContextMenu() {
    const contextMenu = document.querySelector('.context-menu');
    if (contextMenu.style.display !== 'none') {
        contextMenu.style.display = 'none';
    }
}

document.body.onclick = (event) => {
    // If user clicks outside of the context menu, hide the context menu
    if (!event.target.closest('.context-menu')) {
        hideContextMenu();
    }
};
// ########################################################
// Load and Manage File Explorer Functions
// ########################################################

async function loadFileExplorer(path, listItem, forceExpand = false) {
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
        if (listItem.lastChild.tagName === 'UL' && !forceExpand) {
            listItem.removeChild(listItem.lastChild);
            const arrow = listItem.querySelector('.arrow');
            arrow.textContent = '🗀';
            return;
        } else {
            listItem.appendChild(itemsContainer);
        }
    }

    data.forEach(entry => {
        const newListItem = document.createElement('li');

        // if the entry is a file, prepend the file icon
        if (!entry.is_directory) {
            newListItem.textContent = '🗎 ' + entry.name;
        } else {
            newListItem.textContent = entry.name;
        }

        const fixedPath = entry.path.replace(/\\/g, '/');

        newListItem.dataset.path = fixedPath;
        newListItem.id = fixedPath;

        newListItem.className = entry.is_directory ? 'directory' : 'file';
        newListItem.oncontextmenu = (event) => {
            event.stopPropagation();
            showContextMenu(event, fixedPath);
        };

        if (entry.is_directory) {
            newListItem.insertAdjacentHTML('afterbegin', '<span class="arrow">🗀</span>');
        }

        newListItem.onclick = async (event) => {
            event.stopPropagation();

            if (entry.is_directory) {
                const arrow = newListItem.querySelector('.arrow');
                const isExpanded = arrow.textContent === '🗁';

                if (isExpanded) {
                    if (newListItem.lastChild.tagName === 'UL') {
                        newListItem.removeChild(newListItem.lastChild);
                    }
                    arrow.textContent = '🗀';
                } else {
                    await loadFileExplorer(fixedPath, newListItem);
                    arrow.textContent = '🗁';
                }
            } else {
                loadFileContent(fixedPath);
            }
        };

        itemsContainer.appendChild(newListItem);
    });
}


async function loadFileContent(path) {
    const fixedPath = path.replace(/\\/g, '/');
    const response = await fetch(`/api/file-content?path=${encodeURIComponent(fixedPath)}`);
    const data = await response.json();

    if (data.error) {
        console.error(data.error);
        return;
    } else {
        myCodeMirror.setValue(data.content);
        myCodeMirror.getWrapperElement().classList.remove('disabled');
    }

    // If there's a file that was previously selected, remove the 'selected' class from it
    const currentlySelected = document.querySelector('#file-explorer .selected');
    if (currentlySelected) {
        currentlySelected.classList.remove('selected');
    }

    // Apply the 'selected' class to the newly selected file
    const newSelected = document.querySelector(`#file-explorer [data-path="${fixedPath}"]`);
    if (newSelected) {
        newSelected.classList.add('selected');
    }
}

async function saveFileContent() {
    // Find the currently selected file
    const selectedFile = document.querySelector('.selected');

    // If no file is selected, don't attempt to save
    if (!selectedFile) {
        alert('No file selected');
        return;
    }

    // Get the file's path from its data-path attribute
    const path = selectedFile.dataset.path;
    const content = myCodeMirror.getValue();

    const fileData = JSON.stringify({
        path: path,
        content: content
    });

    const response = await fetch('/api/save-file', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: fileData
    });

    const result = await response.json();
    if (result.success) {
        alert('File saved successfully');
    } else {
        alert(`Error: ${result.error}`);
    }
}



// ########################################################
// Edit File Or Directory Action Menu Functions
// ########################################################

async function renameItem(targetPath) {
    // API call to check if the targetPath is a directory
    const response = await fetch(`/api/is-directory?path=${encodeURIComponent(targetPath)}`);
    const data = await response.json();

    let editForm;
    let inputElement;
    if (data.isDirectory) {
        // For directories
        editForm = document.querySelector(".edit-db-directory");
        inputElement = document.querySelector("#edit-db-directory");
    } else {
        // For files
        editForm = document.querySelector(".edit-db-file");
        inputElement = document.querySelector("#edit-db-file");
    }

    // store target path in the form for later use
    editForm.dataset.targetPath = targetPath;

    // Extract the name of the file or directory from the targetPath
    let name = targetPath.split("/").pop();

    // Populate the input field with the name and focus on it
    inputElement.value = name;
    inputElement.focus();

    // show the form
    showForm(editForm);
}


// ########################################################
// Edit Directory Functions
// ########################################################

// For directories
let saveEditDirBtn = document.getElementById("edit-db-directory-btn");
let editDirForm = document.querySelector(".edit-db-directory");
let editDirNameInput = document.querySelector("#edit-db-directory");

saveEditDirBtn.addEventListener("click", async function() {
    let dirName = editDirNameInput.value;

    // make sure the directory name is not empty
    if (dirName.trim() === '') {
        alert('Please enter a directory name.');
        return;
    }

    let targetPath = editDirForm.dataset.targetPath;

    const response = await renameItemOnServer(targetPath, dirName);

    if (response.success) {
        // call loadFileExplorer again with the parent directory of the renamed directory
        const parentPath = targetPath.substring(0, targetPath.lastIndexOf("/"));

        // Check if parentPath is empty or '/', if yes then load base directory
        if (parentPath === "" || parentPath === "/") {
            loadFileExplorer("/payloadDB/");
        } else {
            const parentListItem = document.querySelector(`[data-path="${parentPath}"]`);

            if (parentListItem) {
                if (parentListItem.lastChild.tagName === 'UL') {
                    parentListItem.removeChild(parentListItem.lastChild);
                }

                const isExpanded = parentListItem.querySelector('.arrow').textContent === '🗁';
                loadFileExplorer(parentPath, parentListItem, isExpanded);
            } else {
                loadFileExplorer("/payloadDB/");
            }
        }
    } else {
        console.error(response.error);
    }

    // hide the form after directory rename
    hideForm(editDirForm);
});


// ########################################################
// Edit File Functions
// ########################################################

// For files
let saveEditFileBtn = document.getElementById("edit-db-file-btn");
let editFileForm = document.querySelector(".edit-db-file");
let editFileNameInput = document.querySelector("#edit-db-file");

saveEditFileBtn.addEventListener("click", async function() {
    let fileName = editFileNameInput.value;

    // make sure the file name is not empty
    if (fileName.trim() === '') {
        alert('Please enter a file name.');
        return;
    }

    let targetPath = editFileForm.dataset.targetPath;

    const response = await renameItemOnServer(targetPath, fileName);

    if (response.success) {
        // call loadFileExplorer again with the parent directory of the renamed file
        const parentPath = targetPath.substring(0, targetPath.lastIndexOf("/"));

        // Check if parentPath is empty or '/', if yes then load base directory
        if (parentPath === "" || parentPath === "/") {
            loadFileExplorer("/payloadDB/");
        } else {
            const parentListItem = document.querySelector(`[data-path="${parentPath}"]`);

            if (parentListItem) {
                if (parentListItem.lastChild.tagName === 'UL') {
                    parentListItem.removeChild(parentListItem.lastChild);
                }

                const isExpanded = parentListItem.querySelector('.arrow').textContent === '🗁';
                loadFileExplorer(parentPath, parentListItem, isExpanded);
            } else {
                loadFileExplorer("/payloadDB/");
            }
        }
    } else {
        console.error(response.error);
    }

    // hide the form after file rename
    hideForm(editFileForm);
});

async function renameItemOnServer(targetPath, newName) {
    // Replace backslashes with forward slashes in the target path
    let correctedTargetPath = targetPath.replace(/\\/g, '/');

    // Send a POST request to the rename endpoint on the server
    const response = await fetch('/api/rename', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            path: correctedTargetPath,
            newName: newName
        })
    });

    // Check the server response
    if (response.ok) {
        // If the server responded with a status in the range 200-299,
        // convert the response body to JSON and return it
        return await response.json();
    } else {
        // If the server responded with a different status code,
        // throw an error
        throw new Error(`Server responded with status: ${response.status}`);
    }
}

// ########################################################
// Delete File Or Directory Functions
// ########################################################

async function deleteItem(targetPath) {
    // First, check if it's a directory
    hideContextMenu();
    const response = await fetch(`/api/is-directory?path=${encodeURIComponent(targetPath)}`);
    const result = await response.json();

    let itemType = result.isDirectory ? "directory" : "file";
    let itemName = targetPath.split("/").pop();  // Extract the name from the path

    if (confirm(`Are you sure you want to delete the ${itemType} '${itemName}'?`)) {
        // If user agrees to delete, then send the request
        const deleteResponse = await deleteFileOrDirectory(targetPath);

        if (deleteResponse.success) {
            // get the parent path
            const parentPath = targetPath.split("/").slice(0, -1).join("/");
            console.log(parentPath)
            // Check if parentPath is empty or '/', if yes then load base directory
            if (parentPath === "" || parentPath === "/" || parentPath === "/payloadDB") {
                loadFileExplorer("/payloadDB/");
            } else {
                // get the parent list item
                const parentListItem = document.querySelector(`[data-path="${parentPath}"]`);
                console.log(parentListItem)
                // refresh parent
                if (parentListItem.lastChild.tagName === 'UL') {
                    parentListItem.removeChild(parentListItem.lastChild);
                }

                const isExpanded = parentListItem.querySelector('.arrow').textContent === '🗁';
                loadFileExplorer(parentPath, parentListItem, isExpanded);
            }
        } else {
            console.error(deleteResponse.error);
        }
    }
}



async function deleteFileOrDirectory(path) {
    // Delete file/directory
    const response = await fetch('/api/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path })
    });

    return await response.json();
}

// ########################################################
// Create Directory or File Functions
// ########################################################

function createNewItem(targetPath, isDirectory) {
    // Fetch API to check whether the targetPath is a file or directory.
    fetch(`/api/is-directory?path=${encodeURIComponent(targetPath)}`)
    .then(response => response.json())
    .then(result => {
        if (!result.isDirectory) {
            // If it's a file, remove the filename from the targetPath.
            targetPath = targetPath.split("/").slice(0, -1).join("/");
        }

        const parentItem = document.querySelector(`[data-target-path="${targetPath}"]`);
        const newItemForm = document.querySelector(isDirectory ? ".new-db-directory" : ".new-db-file");
        const newItemNameInput = document.querySelector(isDirectory ? "#new-db-directory" : "#new-db-file");

        // Store target path in the form for later use.
        newItemForm.dataset.targetPath = targetPath;

        // Show the form.
        showForm(newItemForm);
    })
    .catch(error => console.error(error));
}

let saveNewItemBtns = [
    document.getElementById("new-db-directory-btn"),
    document.getElementById("new-db-file-btn")
];


for (let saveNewItemBtn of saveNewItemBtns) {
    let isDirectory = saveNewItemBtn.id.includes("directory");

    saveNewItemBtn.addEventListener("click", async function() {
        let newItemForm = document.querySelector(isDirectory ? ".new-db-directory" : ".new-db-file");
        let newItemNameInput = document.querySelector(isDirectory ? "#new-db-directory" : "#new-db-file");
        let name = newItemNameInput.value;

        // make sure the name is not empty
        if (name.trim() === '') {
            alert(`Please enter a ${isDirectory ? "directory" : "file"} name.`);
            return;
        }

        let targetPath = newItemForm.dataset.targetPath;
        const response = await createNewItemOnServer(targetPath, name, isDirectory);

        if (response.success) {
            // Check if targetPath is empty or '/', if yes then load base directory
            if (targetPath === "" || targetPath === "/" || targetPath === "/payloadDB") {
                loadFileExplorer("/payloadDB/");
            } else {
                // call loadFileExplorer again with the parent directory of the newly created file/directory
                const parentListItem = document.querySelector(`[data-path="${targetPath}"]`);

                if (parentListItem.lastChild.tagName === 'UL') {
                    parentListItem.removeChild(parentListItem.lastChild);
                }

                const isExpanded = parentListItem.querySelector('.arrow').textContent === '🗁';
                if (!isExpanded && !isDirectory) {
                    parentListItem.querySelector('.arrow').textContent = '🗁'; // Set the arrow to expanded
                }
                loadFileExplorer(targetPath, parentListItem, isExpanded);
            }

            // If a new file is created, load its content in the text editor
            if (!isDirectory) {
                loadFileContent(`${targetPath}/${name}`);
            }
        } else {
            console.error(response.error);
        }

        // hide the form after item creation
        hideForm(newItemForm);
    });
}



async function createNewItemOnServer(path, name, isDirectory) {
    const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path, name, is_directory: isDirectory })
    });

    return await response.json();
}


