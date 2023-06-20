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
let saveEditTestFilenameBtn = document.getElementById("edit-test-filename-btn");
let addCategoryBtns = document.querySelectorAll(".add-category");
let saveTestCategoryBtn = document.getElementById("save-test-category-btn");
let editTestCategoryInput = document.getElementById("edit-test-category");
let editTestCategoryBtn = document.getElementById("edit-test-category-btn");
let saveTestTestBtn = document.getElementById("save-test-test-btn");
let newTestTestInput = document.getElementById("new-test-test");

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
let currentFilename = null;
let currentCategory = null;
let editTestTestInput = document.getElementById("edit-test-test");
let saveEditTestBtn = document.getElementById("edit-test-test-btn");
// get references to the form and its elements
let headerRows = editRequestHeadersForm.querySelectorAll(".form-row"); // changed from editRequestPropertiesForm
let saveRequestHeadersBtn = document.getElementById("save-request-headers-btn"); // changed from saveRequestPropertiesBtn
let newTestFilenameInput = document.getElementById("new-test-filename");
let saveTestFilenameBtn = document.getElementById("save-test-filename-btn");

// ########################################################
// General Functions
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
// function to hide a form
function hideForm(form) {
    overlay.style.display = "none";
    form.style.display = "none";

    // reset the form values
    let inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.value = '';
    });

    // reset the select values
    let selects = form.querySelectorAll('select');
    selects.forEach(select => {
        select.selectedIndex = 0;
        // clear the options of the payload file dropdowns
        if (select.id.startsWith("payload-file-")) {
            while (select.firstChild) {
                select.removeChild(select.firstChild);
            }
        }
    });
}


// ########################################################
// Add File Functions
// ########################################################

// add event listeners to the buttons/icons
addNewBtn.addEventListener("click", function() {
    showForm(newTestFileForm);
});

// get references to the form elements


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
// Delete File Functions
// ########################################################

let deleteFileBtns = document.querySelectorAll(".delete-file");

deleteFileBtns.forEach((btn) => {
    btn.addEventListener("click", function() {
        // Get the filename from the button's data attribute
        let filename = this.dataset.filename;

        // Remove the .json extension from the filename
        filename = filename.replace('.json', '');

        // Confirm the deletion
        let confirmDelete = confirm("Are you sure you want to delete " + filename + "?");
        if (!confirmDelete) {
            return; // If the user clicked "Cancel", don't proceed with the deletion
        }

        // Create the data to send in the request
        let data = {
            filename: filename
        };

        // Send a DELETE request to the server
        fetch('/api/test-file', {
            method: 'DELETE',
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
                location.reload(); // Refresh the page
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });
});

// ########################################################
// Add Category Functions
// ########################################################


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
// Delete Category Functions
// ########################################################
let deleteCategoryBtns = document.querySelectorAll(".delete-category");
deleteCategoryBtns.forEach((btn) => {
    btn.addEventListener("click", function() {
        // Get the category from the button's data attribute
        let category = this.dataset.category;

        let currentRow = this.closest('tr');
        while (!currentRow.querySelector('.edit-file')) {
            currentRow = currentRow.previousElementSibling;
        }
        let filename = currentRow.querySelector('.edit-file').dataset.filename;
        filename = filename.replace('.json', '')

        // Confirm the deletion
        let confirmDelete = confirm("Are you sure you want to delete the category " + category + " from " + filename + "?");
        if (!confirmDelete) {
            return; // If the user clicked "Cancel", don't proceed with the deletion
        }

        // Create the data to send in the request
        let data = {
            filename: filename,
            category: category
        };

        // Send a DELETE request to the server
        fetch('/api/test-file-category', {
            method: 'DELETE',
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
                location.reload(); // Refresh the page
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
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
        newTestTestInput.placeholder = "Test Name";
        newTestTestInput.value = "";  // clear the input field
    });
});

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
            location.reload();
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



editTestBtns.forEach((btn) => {
    btn.addEventListener("click", function() {
        // get the test from the button's data-test attribute
        let test = this.dataset.test;
        editTestTestForm.dataset.test = test;

        // get the filename from the nearest preceding row that contains a td with a filename
        let currentRow = this.closest('tr');
        while (!currentRow.querySelector('.edit-file')) {
            currentRow = currentRow.previousElementSibling;
        }
        let filename = currentRow.querySelector('.edit-file').dataset.filename;
        filename = filename.replace('.json', '');

        editTestTestForm.dataset.filename = filename;
        let categoryElement = this.closest('tr').querySelector('.edit-category') || this.closest('.edit-category');
        if (categoryElement) {
            currentCategory = categoryElement.dataset.category;
        }
        // set the input field to the test name
        editTestTestInput.value = test;

        showForm(editTestTestForm);
    });
});


saveEditTestBtn.addEventListener("click", function(e) {
    e.preventDefault();

    let filename = editTestTestForm.dataset.filename;
    let originalTest = editTestTestForm.dataset.test;
    let newTest = editTestTestInput.value;

    fetch('/api/test-file-test', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filename: filename,
            'category': currentCategory,
            'original-test': originalTest,
            'new-test': newTest,
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
// Delete Test Functions
// ########################################################
let deleteTestBtns = document.querySelectorAll(".delete-test");

deleteTestBtns.forEach((btn) => {
    btn.addEventListener("click", function() {
        // Get the test from the button's data attribute
        let test = this.dataset.test;

    // get the filename from the nearest preceding row that contains a td with a filename
        currentRow = this.closest('tr');
        while (!currentRow.querySelector('.edit-file')) {
            currentRow = currentRow.previousElementSibling;
        }
        let filename = currentRow.querySelector('.edit-file').dataset.filename;
        filename = filename.replace('.json', '');

        currentRow = this.closest('tr');
        while (!currentRow.querySelector('.edit-category')) {
            currentRow = currentRow.previousElementSibling;
        }
        let category = currentRow.querySelector('.edit-category').dataset.category;



        // Confirm the deletion
        let confirmDelete = confirm("Are you sure you want to delete the test " + test + " from " + category + " in " + filename + "?");
        if (!confirmDelete) {
            return; // If the user clicked "Cancel", don't proceed with the deletion
        }

        // Create the data to send in the request
        let data = {
            filename: filename,
            category: category,
            test: test
        };
        console.log(data)

        // Send a DELETE request to the server
        fetch('/api/test-file-test', {
            method: 'DELETE',
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
                location.reload(); // Refresh the page
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });
});


// ########################################################
// Request Headers Functions
// ########################################################





// get references to the pencil icons in the request properties cells

editRequestHeadersBtns.forEach((btn) => {
    btn.addEventListener("click", function() {
        // get the filename from the nearest preceding row that contains a td with a filename
        let currentRow = this.closest('tr');
        while (!currentRow.querySelector('.edit-file')) {
            currentRow = currentRow.previousElementSibling;
        }
        let filename = currentRow.querySelector('.edit-file').dataset.filename;
        filename = filename.replace('.json', '');
        currentFilename = filename
        currentRow = this.closest('tr')
        // get the category from the nearest preceding row that contains a td with a category
        while (!currentRow.querySelector('.edit-category')) {
            currentRow = currentRow.previousElementSibling;
        }
        let categoryElement = currentRow.querySelector('.edit-category');
        if (categoryElement) {
            currentCategory = categoryElement.dataset.category;
        }

        let testElement = this.closest('tr').querySelector('.edit-test') || this.closest('.edit-test');
        if (testElement) {
            currentTest = testElement.dataset.test;
        }
        console.log (filename)
        console.log (currentCategory)
        console.log (currentTest)
        // get the request headers data from the cell
        let requestHeadersCell = this.parentElement.parentElement; // use parentElement twice to get to the td element
        let rows = requestHeadersCell.querySelectorAll(".cell-row");

        // populate the form with the existing request headers data
        for (let i = 0; i < rows.length; i++) {
            let cells = rows[i].querySelectorAll("span");
            let name = cells[0].textContent;
            let value = cells[1].textContent;

            // check if the row has data before populating the form
            if (name || value) {
                // populate the header name and value inputs
                let nameInput = document.querySelector("#header-name-" + (i + 1));
                let valueInput = document.querySelector("#header-value-" + (i + 1));
                if (nameInput && valueInput) {
                    nameInput.value = name;
                    valueInput.value = value;
                }
            }
        }

        // clear any remaining header rows
        for (let i = rows.length + 1; i <= 7; i++) {
            let nameInput = document.querySelector("#header-name-" + i);
            let valueInput = document.querySelector("#header-value-" + i);
            if (nameInput && valueInput) {
                nameInput.value = '';
                valueInput.value = '';
            }
        }

        // show the form
        showForm(editRequestHeadersForm);
    });
});


// Add event listener to the save button
saveRequestHeadersBtn.addEventListener("click", function() {
    // Initialize an empty object to store the headers
    let headers = {};

    // Loop through the form rows
        for (let i = 1; i <= 7; i++) {
            // Get the header name and value inputs
            let nameInput = document.querySelector("#header-name-" + i);
            let valueInput = document.querySelector("#header-value-" + i);

            // Check if both the name and value are not empty
            if (nameInput.value && valueInput.value) {
                // Add the header to the headers object
                headers[nameInput.value] = valueInput.value;
            } else if (nameInput.value || valueInput.value) {
                // If only one of them is not empty, throw an error
    // If only one of them is not empty, show an error to the user
    alert('Both header name and value must be provided for each row');
    return;
            }
        }

    // Check if the headers object is not empty


    // Create the data to send in the request
    let data = {
        filename: currentFilename,
        category: currentCategory,
        test: currentTest,
        properties: {
            headers: headers
        }
    };

    // Send a PUT request to the server
    fetch('/api/test-file-properties', {
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
            location.reload();
            // refresh the page or update the UI
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

// ########################################################
// Payload Files Functions
// ########################################################

editPayloadFilesBtns.forEach((btn) => {
    btn.addEventListener("click", function() {
        // get the payload files data from the cell
        let payloadFilesCell = this.parentElement.parentElement; // change this line
        let rows = payloadFilesCell.querySelectorAll(".cell-row");
        // get the filename from the nearest preceding row that contains a td with a filename
        let currentRow = this.closest('tr');
        while (!currentRow.querySelector('.edit-file')) {
            currentRow = currentRow.previousElementSibling;
        }
        let filename = currentRow.querySelector('.edit-file').dataset.filename;
        filename = filename.replace('.json', '');
        currentFilename = filename
        currentRow = this.closest('tr')
        // get the category from the nearest preceding row that contains a td with a category
        while (!currentRow.querySelector('.edit-category')) {
            currentRow = currentRow.previousElementSibling;
        }
        let categoryElement = currentRow.querySelector('.edit-category');
        if (categoryElement) {
            currentCategory = categoryElement.dataset.category;
        }

        let testElement = this.closest('tr').querySelector('.edit-test') || this.closest('.edit-test');
        if (testElement) {
            currentTest = testElement.dataset.test;
        }
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

            // Add an empty option
            let emptyOption = document.createElement('option');
            emptyOption.text = '';
            emptyOption.value = '';
            payloadFileDropdown.add(emptyOption);

            // Add each item from the data as a new option in the dropdown
            data.forEach(item => {
                let option = document.createElement('option');
                option.text = item; // Assuming the item is a string
                option.value = item;
                payloadFileDropdown.add(option);
            });

            // Set the selected option to the current file or to the empty option if the file is empty
            payloadFileDropdown.value = file || '';

            // populate the expected behavior dropdown
            let expectedBehaviorDropdown = document.querySelector("#expected-behavior-" + (i + 1));
            expectedBehaviorDropdown.value = expectedBehavior || '';
        }

        // populate any remaining payload file dropdowns
        for (let i = rows.length + 1; i <= 7; i++) {
            let payloadFileDropdown = document.querySelector("#payload-file-" + i);
            if (payloadFileDropdown) {
                // Clear any existing options
                payloadFileDropdown.innerHTML = '';

                // Add an empty option
                let emptyOption = document.createElement('option');
                emptyOption.text = '';
                emptyOption.value = '';
                payloadFileDropdown.add(emptyOption);

                // Add each item from the data as a new option in the dropdown
                data.forEach(item => {
                    let option = document.createElement('option');
                    option.text = item; // Assuming the item is a string
                    option.value = item;
                    payloadFileDropdown.add(option);
                });

                // Since no selected file is corresponding to this dropdown, set it to empty
                payloadFileDropdown.value = '';
            }
        }

        // show the form
        showForm(editPayloadFilesForm);
    })
    .catch(error => console.error('Error:', error));
    });
});

let savePayloadFilesBtn = document.querySelector("#save-payload-files-btn");

savePayloadFilesBtn.addEventListener("click", function() {
    // Initialize an empty array to store the payload files
    let files = [];

    // Loop through the form rows
    for (let i = 1; i <= 7; i++) {
        // Get the payload file and expected behavior inputs
        let fileInput = document.querySelector("#payload-file-" + i);
        let expectedBehaviorInput = document.querySelector("#expected-behavior-" + i);

        // Check if both the file and expected behavior are not empty
        if (fileInput.value && expectedBehaviorInput.value) {
            // Add the payload file to the files array
            files.push({
                file: fileInput.value,
                expected: expectedBehaviorInput.value
            });
        } else if (fileInput.value || expectedBehaviorInput.value) {
            // If only one of the inputs is filled, show an alert and stop the function
            alert('Both file and expected behavior must be provided for each row');
            return;
        }
    }

    // Create the data to send in the request
    let data = {
        filename: currentFilename,
        category: currentCategory,
        test: currentTest,
        files: files
    };

    // Send a PUT request to the server
    fetch('/api/test-file-files', {
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
            location.reload();
            // refresh the page or update the UI
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});


// ########################################################
// Payload Location Functions
// ########################################################




editPayloadLocationBtns.forEach((btn) => {
    btn.addEventListener("click", function() {
        // get the payload location data from the cell
        let payloadLocationCell = this.parentElement.parentElement; // use parentElement instead of previousElementSibling
        let rows = payloadLocationCell.querySelectorAll(".cell-row");
        let currentRow = this.closest('tr');
        while (!currentRow.querySelector('.edit-file')) {
            currentRow = currentRow.previousElementSibling;
        }
        let filename = currentRow.querySelector('.edit-file').dataset.filename;
        filename = filename.replace('.json', '');
        currentFilename = filename
        currentRow = this.closest('tr')
        // get the category from the nearest preceding row that contains a td with a category
        while (!currentRow.querySelector('.edit-category')) {
            currentRow = currentRow.previousElementSibling;
        }
        let categoryElement = currentRow.querySelector('.edit-category');
        if (categoryElement) {
            currentCategory = categoryElement.dataset.category;
        }

        let testElement = this.closest('tr').querySelector('.edit-test') || this.closest('.edit-test');
        if (testElement) {
            currentTest = testElement.dataset.test;
        }
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
    // Get the values from the form
    let url = urlCheckbox.checked;
    let bodyType = bodyTypeDropdown.value;
    let bodyMethod = bodyMethodDropdown.value;
    let bodyParameter = bodyParameterInput.value;
    let cookies = cookiesInput.value;
    let headers = headersInput.value;
    let parameters = parametersInput.value;

    // Create the payload location object
    let payloadLocation = {
        url: url || false,
        body: {},
        cookies: [],
        headers: [],
        parameters: []
    };

    // If bodyMethod and bodyParameter are not empty, add them to the body object
    if (bodyMethod && bodyParameter) {
        payloadLocation.body = {
            method: bodyMethod,
            parameter: bodyParameter
        };
    }

    // If cookies, headers, and parameters are not empty, convert them to a list and add them to the corresponding fields
    if (cookies) {
        payloadLocation.cookies = cookies.split(',').map(item => item.trim());
    }
    if (headers) {
        payloadLocation.headers = headers.split(',').map(item => item.trim());
    }
    if (parameters) {
        payloadLocation.parameters = parameters.split(',').map(item => item.trim());
    }

    // Create the data to send in the request
    let data = {
        filename: currentFilename,
        category: currentCategory,
        test: currentTest,
        'body_type': bodyType || "none",
        location: payloadLocation
    };

    // Send a PUT request to the server
    fetch('/api/test-file-location', {
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
            location.reload();
            // refresh the page or update the UI
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});




