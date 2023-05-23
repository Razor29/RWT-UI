document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;
        // Tests Page
        loadTests();
        hideForms();

    document.querySelector('#add-new-test').addEventListener('click', showForm);
    document.querySelector('.overlay').addEventListener('click', hideFormAndOverlay);
});

function hideFormAndOverlay() {
    document.getElementById('create-test-file-form').style.display = 'none';
    document.querySelector('.overlay').style.display = 'none';
}
function showForm() {
    document.getElementById('create-test-file-form').style.display = 'block';
    document.querySelector('.overlay').style.display = 'block';
}
function hideForms() {
    const forms = [
        'create-test-file-form',
        'edit-test-file-form',
        'add-category-form',
        'edit-category-form',
        'add-test-form',
        'edit-test-form',
        'edit-properties-form'
    ];
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        form.style.display = 'none';
    });
}

async function loadTests() {
    const response = await fetch('/api/tests');
    const data = await response.json();
    const tests = data.tests;
    const payloadDbs = data.payloadDbs;
    const stats = data.stats;
    const processedFiles = new Set();

    const tbody = document.getElementById('test-table-body');
    tbody.innerHTML = '';

    tests.forEach(test => {
        const fileStats = stats.find(stat => stat.filename === test.filename);
        const totalTestsInFile = fileStats ? fileStats.tests_count : 0;

        test.categories.forEach((category, categoryIndex) => {
            let totalTestsInCategory = category.tests.length;

            category.tests.forEach((testData, index) => {
                const row = document.createElement('tr');

                if (!processedFiles.has(test.filename)) {
                    processedFiles.add(test.filename);

                    const filenameCell = document.createElement('td');
                    filenameCell.rowSpan = totalTestsInFile;
                    filenameCell.classList.add('narrow', 'hover-icons');
                    filenameCell.innerHTML = `
                        <div title="${test.filename}">${test.filename}</div>
                        <div class="svg-overlay">
                            <img src="/static/icons/icon-pencil.svg" class="icon-pencil">
                            <img src="/static/icons/icon-trash.svg" class="icon-trash">
                        </div>
                    `;
                    row.appendChild(filenameCell);

                    const payloadDbCell = document.createElement('td');
                    payloadDbCell.rowSpan = totalTestsInFile;
                    payloadDbCell.innerHTML = `
                        <select>
                            ${payloadDbs.map(db => `<option value="${db}">${db}</option>`).join('')}
                        </select>
                    `;
                    row.appendChild(payloadDbCell);
                }

                if (index === 0) {
                    const categoryCell = document.createElement('td');
                    categoryCell.rowSpan = totalTestsInCategory;
                    categoryCell.classList.add('hover-icons');
                    categoryCell.innerHTML = `
                        <div title="${category.name}">${category.name}</div>
                        <div class="svg-overlay">
                            <img src="/static/icons/icon-plus.svg" class="icon-plus">
                            <img src="/static/icons/icon-pencil.svg" class="icon-pencil">
                            <img src="/static/icons/icon-trash.svg" class="icon-trash">
                        </div>
                    `;
                    row.appendChild(categoryCell);
                }

                const testNameCell = document.createElement('td');
                testNameCell.classList.add('hover-icons');
                testNameCell.innerHTML = `
                    <div title="${testData.name}">${testData.name}</div>
                    <div class="svg-overlay">
                        <img src="/static/icons/icon-plus.svg" class="icon-plus">
                        <img src="/static/icons/icon-pencil.svg" class="icon-pencil">
                        <img src="/static/icons/icon-trash.svg" class="icon-trash">
                    </div>
                `;
                row.appendChild(testNameCell);

                const skipCell = document.createElement('td');
                skipCell.innerHTML = `<input type="checkbox" ${testData.skip ? 'checked' : ''}>`;
                row.appendChild(skipCell);

                const requestPropertiesCell = document.createElement('td');
                const headers = Object.keys(testData.headers).map(header => `${header}: ${testData.headers[header]}`).join(', ');
                requestPropertiesCell.classList.add('hover-icons');
                requestPropertiesCell.innerHTML = `
                    <div title="Headers: ${headers ? headers : 'None'}">Headers: ${headers ? headers : 'None'}</div>
                    <div title="Body Type: ${testData['body type']}">Body Type: ${testData['body type']}</div>
                    <div class="svg-overlay">
                        <img src="/static/icons/icon-pencil.svg" class="icon-pencil">
                        <img src="/static/icons/icon-trash.svg" class="icon-trash">
                    </div>
                `;
                row.appendChild(requestPropertiesCell);

                const payloadFilesCell = document.createElement('td');
                payloadFilesCell.classList.add('hover-icons');
                payloadFilesCell.innerHTML = testData['payloadFiles']
                    .map(payloadFile => `<div title="${payloadFile.file}\t${payloadFile.expected}">${payloadFile.file}\t${payloadFile.expected}</div>`)
                    .join('') + `
                    <div class="svg-overlay">
                        <img src="/static/icons/icon-pencil.svg" class="icon-pencil">
                    </div>
                `;
                row.appendChild(payloadFilesCell);

                const payloadLocationsCell = document.createElement('td');
                payloadLocationsCell.classList.add('hover-icons');
                payloadLocationsCell.innerHTML = `
                    <div title="URL: ${testData.payloadLocation.url}">URL: ${testData.payloadLocation.url}</div>
                    <div title="Body: ${JSON.stringify(testData.payloadLocation.body)}">Body: ${JSON.stringify(testData.payloadLocation.body)}</div>
                    <div title="Params: ${testData.payloadLocation.parameters.length > 0 ? testData.payloadLocation.parameters.join(', ') : 'None'}">Params: ${testData.payloadLocation.parameters.length > 0 ? testData.payloadLocation.parameters.join(', ') : 'None'}</div>
                    <div title="Cookies: ${testData.payloadLocation.cookies.length > 0 ? testData.payloadLocation.cookies.join(', ') : 'None'}">Cookies: ${testData.payloadLocation.cookies.length > 0 ? testData.payloadLocation.cookies.join(', ') : 'None'}</div>
                    <div title="Headers: ${testData.payloadLocation.headers.length > 0 ? testData.payloadLocation.headers.join(', ') : 'None'}">Headers: ${testData.payloadLocation.headers.length > 0 ? testData.payloadLocation.headers.join(', ') : 'None'}</div>
                    <div class="svg-overlay">
                        <img src="/static/icons/icon-pencil.svg" class="icon-pencil">
                    </div>
                `;
                row.appendChild(payloadLocationsCell);

                tbody.appendChild(row);
           });
        });
    });

        const pencilIcons = document.querySelectorAll('img.icon-pencil');
        pencilIcons.forEach(icon => {
            icon.addEventListener('click', handleEdit);
        });

        const trashIcons = document.querySelectorAll('img.icon-trash');
        trashIcons.forEach(icon => {
            icon.addEventListener('click', handleDelete);
        });

        const plusIcons = document.querySelectorAll('img.icon-plus');
        plusIcons.forEach(icon => {
            icon.addEventListener('click', handleAdd);
    });
}

function handleEdit(event) {
    console.log('handleEdit called');

    const icon = event.target;
    const cell = icon.closest('td');

    // Determine if this is a filename cell
    const isFilenameCell = cell.childNodes[0].nodeName === "DIV" && cell.childNodes[0].getAttribute('title').includes('.'); // Adjust as per your html structure

    if (isFilenameCell) {
        const filename = cell.childNodes[0].innerText;

        // Update the form input value
        document.querySelector('#edit-test-file-form input[name="filename"]').value = filename;

        // Display the form
        document.getElementById('edit-test-file-form').style.display = 'block';
        document.querySelector('.overlay').style.display = 'block';
    }
}

function handleDelete(event) {
    const icon = event.target;
    const cell = icon.closest('td');
    // TODO: Implement the delete action
}

function handleAdd(event) {
    const icon = event.target;
    const cell = icon.closest('td');
    // TODO: Implement the add action
}