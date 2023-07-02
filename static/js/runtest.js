async function loadConfigurations() {
  const response = await fetch('/api/configurations-files');
  const configurations = await response.json();
  const select = document.getElementById('config-file-select');

  configurations.forEach(config => {
    const option = document.createElement('option');
    option.value = config.replace('.json', '');
    option.text = config.replace('.json', '');
    select.appendChild(option);
  });
}

async function loadTestFiles() {
  const response = await fetch('/api/tests-files');
  const tests = await response.json();
  const select = document.getElementById('test-file-select');

  tests.forEach(test => {
    const option = document.createElement('option');
    option.value = test.replace('.json', ''); // Change this line
    option.text = test.replace('.json', '');
    select.appendChild(option);
  });
}



document.getElementById('run-test-form').addEventListener('submit', function(event) {
  event.preventDefault();

  const configFile = document.getElementById('config-file-select').value;
  const testFile = document.getElementById('test-file-select').value;
  const detailedSuccess = document.getElementById('detailed-success-checkbox').checked;
  const detailedFailure = document.getElementById('detailed-failure-checkbox').checked;

  // Send a POST request to the server to start the test
  fetch('/api/runtest-start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      configuration_file: configFile + ".json",
      test_file: testFile + ".json",
      success: detailedSuccess,
      failure: detailedFailure
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
    // Start updating the progress bar
    updateProgressBar();
  })
  .catch((error) => {
    console.error('Error:', error);
  });
});


function updateProgressBar() {
  // Fetch the current progress from the server
  fetch('/api/runtest-progress')
    .then(response => response.json())
    .then(progress => {
      // Update the progress bar
      const progressBar = document.getElementById('progress-bar');
      progressBar.style.width = progress.progress + '%';

      // Update the test info
      const testInfo = document.getElementById('test-info');
      testInfo.textContent = `Tests: ${progress.Tests}`;

      // Update the current test
      const currentTest = document.getElementById('current-test');
      currentTest.textContent = `Current Test: ${progress.current_test_name}`;

      // Redirect to the results page if the test is complete
        if (progress.test_complete) {
          window.location.href = '/results?filename=' + progress.results_filename;
        }
       else {
        // Call this function again after a delay
        setTimeout(updateProgressBar, 1000);
      }
    });
}

loadConfigurations();
loadTestFiles();
