document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.querySelector('.edit-form');
    const overlay = document.querySelector('.conf-overlay');
    const newForm = document.querySelector('.new-form');
    let originalFilename;

    // Edit configuration
    document.querySelectorAll('.edit-config').forEach(img => {

        img.onclick = () => {
            const row = img.parentElement.parentElement;
            originalFilename = row.getAttribute('data-filename');
            const cells = row.querySelectorAll('td');

            document.querySelector('#edit-filename').value = originalFilename;
            document.querySelector('#edit-url').value = cells[1].getAttribute('title');
            document.querySelector('#edit-blocking-page-regex').value = cells[2].getAttribute('title');
            document.querySelector('#edit-user-agent').value = cells[3].getAttribute('title');  // Changed index from 4 to 3
            document.querySelector('#edit-host').value = cells[4].getAttribute('title');  // Changed index from 5 to 4
            document.querySelector('#edit-xff-name').value = cells[5].getAttribute('title');  // Changed index from 6 to 5
            document.querySelector('#edit-xff-value').value = cells[6].getAttribute('title');  // Changed index from 7 to 6

            // Show the edit form and darken the overlay
            editForm.style.display = 'block';
            overlay.style.display = 'block';

        };
    });

    document.querySelector('#add-new-config').onclick = () => {
    // Show the new form and darken the overlay
    newForm.style.display = 'block';
    overlay.style.display = 'block';
    };
    // Close the form when the overlay is clicked
    document.querySelector('.conf-overlay').onclick = () => {
        const newForm = document.querySelector('.new-form');

        // Check if the new form is currently displayed
        if (newForm.style.display === 'block') {
            // If so, hide it
            newForm.style.display = 'none';
        }

        // Check if the edit form is currently displayed
        if (editForm.style.display === 'block') {
            // If so, hide it
            editForm.style.display = 'none';
        }

        // Lighten the overlay
        overlay.style.display = 'none';
    };

    // ...


    // Delete configuration
    document.querySelectorAll('.delete-config').forEach(img => {
        img.onclick = () => {
            // Ask for confirmation before deleting
            if (confirm('Are you sure you want to delete this configuration?')) {
                // If the user clicked "OK", proceed with deletion
                const filename = img.parentElement.parentElement.getAttribute('data-filename');
                fetch(`/api/configurations`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                     body: JSON.stringify({filename: filename + '.json'}),
                })
                .then(response => response.json())
                .then(data => {
                    // Check if the delete was successful and refresh the page
                    if (data.message === 'Configuration deleted successfully') {
                        location.reload();
                    } else {
                        alert('Could not delete configuration: ' + data.error);
                    }
                });
            }
        };
    });

    // Save edited configuration
    document.querySelector('#save-edit').onclick = () => {
        // Get the data from the form
        const filename = document.querySelector('#edit-filename').value;
        const url = document.querySelector('#edit-url').value;
        const blockingPageRegex = document.querySelector('#edit-blocking-page-regex').value;
        const userAgent = document.querySelector('#edit-user-agent').value;
        const host = document.querySelector('#edit-host').value;
        const xffName = document.querySelector('#edit-xff-name').value;
        const xffValue = document.querySelector('#edit-xff-value').value;

        // Create a JSON object with the data
        const data = {
            original_filename: originalFilename + '.json',
            filename: filename + '.json',
            data: {
                url: url,
                blocking_page_regex: blockingPageRegex,
                user_agent: userAgent,
                host: host,
                xff: {
                    [xffName]: xffValue
                }
            }
        };

        // Make a PUT request to the Flask API
        fetch(`/api/configurations`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(data => {
            // Check if the update was successful and refresh the page
            if (data.message === 'Configuration updated successfully') {
                location.reload();
            } else {
                alert('Could not update configuration: ' + data.error);
            }
        });
    };

// Save new configuration
    document.querySelector('#save-new').onclick = () => {
        // Get the data from the new form
        const newFilename = document.querySelector('#new-filename').value;
        const newUrl = document.querySelector('#new-url').value;
        const newBlockingPageRegex = document.querySelector('#new-blocking-page-regex').value;
        const newUserAgent = document.querySelector('#new-user-agent').value;
        const newHost = document.querySelector('#new-host').value;
        const newXffName = document.querySelector('#new-xff-name').value;
        const newXffValue = document.querySelector('#new-xff-value').value;

        const newData = {
            filename: newFilename + '.json',
            data: {
                url: newUrl,
                blocking_page_regex: newBlockingPageRegex,
                user_agent: newUserAgent,
                host: newHost,
                xff: {
                    [newXffName]: newXffValue
                }
        }
    };

        // Make a POST request to the Flask API
        fetch(`/api/configurations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newData),
        })
        .then(response => response.json())
        .then(data => {
            // Check if the creation was successful and refresh the page
            if (data.message === 'Configuration created successfully') {
                location.reload();
            } else {
                alert('Could not create configuration: ' + data.error);
            }
        });
    };

});