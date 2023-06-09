// get references to the buttons/icons that will trigger the forms
let addNewBtn = document.getElementById("add-new-test");
let editFileBtns = document.querySelectorAll(".edit-file");
let newCategoryBtns = document.querySelectorAll(".add-category");
let editCategoryBtns = document.querySelectorAll(".edit-category");
let newTestBtns = document.querySelectorAll(".add-test");
let editTestBtns = document.querySelectorAll(".edit-test");
let editRequestHeadersBtns = document.querySelectorAll(".edit-request-headers-icon"); // changed from editRequestPropertiesBtns
let editPayloadFilesBtns = document.querySelectorAll(".edit-payload-files-icon");
let editPayloadLocationBtns = document.querySelectorAll(".edit-payload-location-icon");

// get references to the forms
let newTestFileForm = document.querySelector(".new-test-file-form");
let editTestFileForm = document.querySelector(".edit-test-file-form");
let newTestCategoryForm = document.querySelector(".new-test-category-form");
let editTestCategoryForm = document.querySelector(".edit-test-category-form");
let newTestTestForm = document.querySelector(".new-test-test-form");
let editTestTestForm = document.querySelector(".edit-test-test-form");
let editRequestHeadersForm = document.querySelector(".edit-request-headers-form"); // changed from editRequestPropertiesForm
let editPayloadFilesForm = document.querySelector(".edit-payload-files-form");

// get the overlay
let overlay = document.querySelector(".test-overlay");

// Payload location pop-up
let editPayloadLocationForm = document.querySelector(".edit-payload-location-form");
let urlCheckbox = document.querySelector("#url-checkbox");
let bodyTypeDropdown = document.querySelector("#body-type"); // new
let bodyMethodDropdown = document.querySelector("#body-method");
let bodyParameterInput = document.querySelector("#body-parameter");
let cookiesInput = document.querySelector("#cookies");
let headersInput = document.querySelector("#headers");
let parametersInput = document.querySelector("#parameters");
let savePayloadLocationBtn = document.querySelector("#save-payload-location-btn");

// get references to the form and its elements
let headerRows = editRequestHeadersForm.querySelectorAll(".form-row"); // changed from editRequestPropertiesForm
let saveRequestHeadersBtn = document.getElementById("save-request-headers-btn"); // changed from saveRequestPropertiesBtn

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
}

// function to hide a form
function hideForm(form) {
    overlay.style.display = "none";
    form.style.display = "none";
}

// ########################################################
// Add File Functions
// ########################################################

// add event listeners to the buttons/icons
addNewBtn.addEventListener("click", function() {
    showForm(newTestFileForm);
});

// get references to the form elements
let newTestFilenameInput = document.getElementById("new-test-filename");
let saveTestFilenameBtn = document.getElementById("save-test-filename-btn");

// add event listener to the save button
saveTestFilenameBtn.addEventListener("click", function() {
    // get the filename from the input field
    let filename = newTestFilenameInput.value;

    // make sure the filename is not empty
    if (filename.trim() === '') {
        alert('Please enter a filename.');
        return;
    }

    // send a POST request to the backend
    fetch('/api/test-file', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename: filename })
    })
    .then(response => response.json())
    .then(data => {
        // check the response from the backend
        if (data.error) {
            // if there was an error, show an alert with the error message
            alert(data.error);
        } else {
            // if the file was created successfully, hide the form and refresh the page
            hideForm(newTestFileForm);
            location.reload();
        }
    })
    .catch(error => console.error('Error:', error));
});

// ########################################################
// Edit File Functions
// ########################################################
let saveEditTestFilenameBtn = document.getElementById("edit-test-filename-btn");

editFileBtns.forEach((btn) => {
    btn.addEventListener("click", function() {
        let filename = this.dataset.filename;
        // Remove the .json extension from the filename
        let filenameWithoutExtension = filename.replace('.json', '');
        // Pass the filename without extension to the form's dataset
        editTestFileForm.dataset.filenameWithoutExtension = filenameWithoutExtension;
        // Show the form
        showForm(editTestFileForm, filenameWithoutExtension);
    });
});

saveEditTestFilenameBtn.addEventListener("click", function() {
    let oldFilename = editTestFileForm.dataset.filenameWithoutExtension; // get the original filename from the form's data-filename attribute
    let newFilename = document.getElementById("edit-test-filename").value; // get the new filename from the input field

    // send a PUT request to the backend
    fetch('/api/test-file-name', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'old-filename': oldFilename,
            'new-filename': newFilename
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            // if there was an error, alert the error message and keep the form open
            alert(data.error);
        } else {
            // if the request was successful, hide the form and refresh the page
            hideForm(editTestFileForm);
            location.reload();
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});
// ########################################################
// Add Category Functions
// ########################################################

let addCategoryBtns = document.querySelectorAll(".add-category");

addCategoryBtns.forEach(btn => {
    btn.addEventListener("click", function() {

        // get the category from the button's data-category attribute
        let category = this.dataset.category;
        newTestCategoryForm.dataset.category = category;

        // get the filename from the nearest preceding row that contains a td with a filename
        let currentRow = this.closest('tr');
        while (!currentRow.querySelector('.edit-file')) {
            currentRow = currentRow.previousElementSibling;
        }
        let filename = currentRow.querySelector('.edit-file').dataset.filename;
        newTestCategoryForm.dataset.filename = filename;

        // clear the input field and set the placeholder to a static text
        let newTestCategoryInput = document.getElementById("new-test-category");
        newTestCategoryInput.value = "";
        newTestCategoryInput.placeholder = "Enter new category name"; // replace this with your desired placeholder text

        showForm(newTestCategoryForm);
    });
});

let saveTestCategoryBtn = document.getElementById("save-test-category-btn");

saveTestCategoryBtn.addEventListener("click", function() {
    let filename = newTestCategoryForm.dataset.filename; // get the filename from the form's data-filename attribute
    let filenameWithoutExtension = filename.replace('.json', ''); // remove the .json extension from the filename
    let newCategory = document.getElementById("new-test-category").value; // get the new category name from the input field

    // send a POST request to the backend
    fetch('/api/test-file-category', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'filename': filenameWithoutExtension,
            'category': newCategory
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            // if there was an error, alert the error message and keep the form open
            alert(data.error);
        } else {
            // if the request was successful, hide the form and refresh the page
            hideForm(newTestCategoryForm);
            location.reload();
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

// ########################################################
// Edit Category Functions
// ########################################################

let editTestCategoryInput = document.getElementById("edit-test-category");
let editTestCategoryBtn = document.getElementById("edit-test-category-btn");

editCategoryBtns.forEach(btn => {
    btn.addEventListener("click", function() {
        // get the category from the button's data-category attribute
        let category = this.dataset.category;
        editTestCategoryForm.dataset.category = category;

        // get the filename from the nearest preceding row that contains a td with a filename
        let currentRow = this.closest('tr');
        while (!currentRow.querySelector('.edit-file')) {
            currentRow = currentRow.previousElementSibling;
        }
        let filename = currentRow.querySelector('.edit-file').dataset.filename;
        filename = filename.replace('.json', '');
        editTestCategoryForm.dataset.filename = filename;

        // set the input field to the category name
        editTestCategoryInput.value = category;

        showForm(editTestCategoryForm);
    });
});

editTestCategoryBtn.addEventListener("click", function(e) {
    e.preventDefault();

    let filename = editTestCategoryForm.dataset.filename;
    let originalCategory = editTestCategoryForm.dataset.category;
    let newCategory = editTestCategoryInput.value;

    fetch('/api/test-file-category', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filename: filename,
            'original-category': originalCategory,
            'new-category': newCategory,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            location.reload();
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

// ########################################################
// Skip Toggle Functions
// ########################################################

document.querySelectorAll('input[name="skip"]').forEach((checkbox) => {
    checkbox.addEventListener('change', function() {
        // get the test name from the closest row
        let currentRow = this.closest('tr');
        console.log(currentRow)
        let test = currentRow.querySelector('.edit-test').dataset.test;

        // traverse up the DOM tree to find the closest preceding row that contains a category
        while (!currentRow.querySelector('.edit-category')) {
            currentRow = currentRow.previousElementSibling;
        }
        let category = currentRow.querySelector('.edit-category').dataset.category;

        // traverse up the DOM tree again to find the closest preceding row that contains a filename
        while (!currentRow.querySelector('.edit-file')) {
            currentRow = currentRow.previousElementSibling;
        }
        let filename = currentRow.querySelector('.edit-file').dataset.filename.replace('.json', '');

        // send a PUT request to the Flask endpoint
        fetch('/api/test-file-skip', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: filename,
                category: category,
                test: test,
                skip: this.checked
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
            } else {
                console.log(data.message);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });
});


// ########################################################
// New Test Functions
// ########################################################


let currentFilename = null;
let currentCategory = null;

newTestBtns.forEach((btn) => {
    btn.addEventListener("click", function() {
        let test = this.dataset.test;
        showForm(newTestTestForm, test);

        // get the filename from the nearest preceding row that contains a td with a filename
        let currentRow = this.closest('tr');
        while (!currentRow.querySelector('.edit-file')) {
            currentRow = currentRow.previousElementSibling;
        }
        currentFilename = currentRow.querySelector('.edit-file').dataset.filename.replace('.json', '');

        // get the category from the same row or a parent element
        let categoryElement = this.closest('tr').querySelector('.edit-category') || this.closest('.edit-category');
        if (categoryElement) {
            currentCategory = categoryElement.dataset.category;
        }

        // set the placeholder of the form test field
        newTestTestInput.placeholder = "Enter test name";
    });
});

let saveTestTestBtn = document.getElementById("save-test-test-btn");
let newTestTestInput = document.getElementById("new-test-test");

saveTestTestBtn.addEventListener("click", function() {
    let test = newTestTestInput.value;

    // check if a filename and category were stored
    if (!currentFilename || !currentCategory) {
        console.error('No filename or category was stored');
        return;
    }

    // create the data to send in the request
    let data = {
        filename: currentFilename,
        category: currentCategory,
        test: test
    };

    // send a POST request to the server
    fetch('/api/test-file-test', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error(data.error);
        } else {
            console.log(data.message);
            // refresh the page or update the UI
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});




// ########################################################
// Edit Test Functions
// ########################################################

let editTestTestBtn = document.getElementById("edit-test-test-btn");
let editTestTestInput = document.getElementById("edit-test-test");

editTestBtns.forEach((btn) => {
    btn.addEventListener("click", function() {
        let test = this.dataset.test;
        showForm(editTestTestForm, test);
    });
});
editTestTestBtn.addEventListener("click", function() {
    let newTest = editTestTestInput.value;

    // get the original test from the form's data-test attribute
    let originalTest = editTestTestForm.dataset.test;

    // get the filename from the nearest preceding row that contains a td with a filename
    let currentRow = this.closest('tr');
    while (!currentRow.querySelector('.edit-file')) {
        currentRow = currentRow.previousElementSibling;
    }
    let filename = currentRow.querySelector('.edit-file').dataset.filename.replace('.json', '');

    // create the data to send in the request
    let data = {
        filename: filename,
        originalTest: originalTest,
        newTest: newTest
    };

    // send a PUT request to the server
    fetch('/api/test-file-test', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error(data.error);
        } else {
            console.log(data.message);
            // refresh the page or update the UI
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

// ########################################################
// Request Headers Functions
// ########################################################


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




// get references to the pencil icons in the request properties cells

editRequestHeadersBtns.forEach((btn) => {
    btn.addEventListener("click", function() {
        // get the request headers data from the cell
        let requestHeadersCell = this.parentElement.parentElement; // use parentElement twice to get to the td element
        let rows = requestHeadersCell.querySelectorAll(".cell-row");

        // populate the form with the existing request headers data
        for (let i = 0; i < rows.length; i++) {
            let cells = rows[i].querySelectorAll("span");
            let name = cells[0].textContent;
            let value = cells[1].textContent;

            // populate the header name and value inputs
            document.querySelector("#header-name-" + (i + 1)).value = name;
            document.querySelector("#header-value-" + (i + 1)).value = value;
        }

        // clear any remaining header rows
        for (let i = rows.length + 1; i <= 5; i++) {
            document.querySelector("#header-name-" + i).value = '';
            document.querySelector("#header-value-" + i).value = '';
        }

        // show the form
        showForm(editRequestHeadersForm);
    });
});

editPayloadFilesBtns.forEach((btn) => {
    btn.addEventListener("click", function() {
        // get the payload files data from the cell
        let payloadFilesCell = this.parentElement.parentElement; // change this line
        let rows = payloadFilesCell.querySelectorAll(".cell-row");

        // Fetch the data from the API
        fetch('/api/get-test-payload-files')
            .then(response => response.json())
            .then(data => {
                // populate the form with the existing payload files data
                for (let i = 0; i < rows.length; i++) {
                    let cells = rows[i].querySelectorAll("span");
                    let file = cells[0].textContent.trim();  // trim() is used to remove any leading or trailing whitespace
                    let expectedBehavior = cells[1].textContent;
                    expectedBehavior = expectedBehavior.charAt(0).toUpperCase() + expectedBehavior.slice(1);

                    // populate the payload file dropdown
                    let payloadFileDropdown = document.querySelector("#payload-file-" + (i + 1));

                    // Clear any existing options
                    payloadFileDropdown.innerHTML = '';

                    // Add each item from the data as a new option in the dropdown
                    data.forEach(item => {
                        let option = document.createElement('option');
                        option.text = item; // Assuming the item is a string
                        option.value = item;
                        payloadFileDropdown.add(option);
                    });

                    // Set the selected option to the current file
                    payloadFileDropdown.value = file;

                    // populate the expected behavior dropdown
                    let expectedBehaviorDropdown = document.querySelector("#expected-behavior-" + (i + 1));
                    expectedBehaviorDropdown.value = expectedBehavior;
                }

                // show the form
                showForm(editPayloadFilesForm);
            })
            .catch(error => console.error('Error:', error));
    });
});



// add event listener to the save button
saveRequestHeadersBtn.addEventListener("click", function() {
    // save the changes
    // TODO: add code to save the changes
});


editPayloadLocationBtns.forEach((btn) => {
    btn.addEventListener("click", function() {
        // get the payload location data from the cell
        let payloadLocationCell = this.parentElement.parentElement; // use parentElement instead of previousElementSibling
        let rows = payloadLocationCell.querySelectorAll(".cell-row");

        // populate the form with the existing payload location data
        urlCheckbox.checked = rows[0].querySelector(".cell-value").textContent === 'True';
        bodyTypeDropdown.value = rows[1].querySelector(".cell-value").textContent; // new
        bodyMethodDropdown.value = rows[2].querySelector(".cell-value").textContent;
        bodyParameterInput.value = rows[3].querySelector(".cell-value").textContent;
        cookiesInput.value = rows[4].querySelector(".cell-value").textContent;
        headersInput.value = rows[5].querySelector(".cell-value").textContent;
        parametersInput.value = rows[6].querySelector(".cell-value").textContent; // new

        // show the form
        showForm(editPayloadLocationForm);
    });
});


savePayloadLocationBtn.addEventListener("click", function() {
    // save the changes
    // TODO: add code to save the changes
});




