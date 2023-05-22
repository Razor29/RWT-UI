async function loadConfigurations() {
  const response = await fetch('/api/configurations-files');
  const configurations = await response.json();
  const select = document.getElementById('config-file-select');

  configurations.forEach(config => {
    const option = document.createElement('option');
    option.value = config;
    option.text = config;
    select.appendChild(option);
  });
}

async function loadTestFiles() {
  const response = await fetch('/api/tests-files');
  const tests = await response.json();
  const select = document.getElementById('test-file-select');

  tests.forEach(test => {
    const option = document.createElement('option');
    option.value = test; // Change this line
    option.text = test;
    select.appendChild(option);
  });
}

async function loadPayloadDbs() {
  const response = await fetch('/api/payload-dbs');
  const payloadDbs = await response.json();
  const select = document.getElementById('payload-db-select');

  payloadDbs.forEach(db => {
    const option = document.createElement('option');
    option.value = db;
    option.text = db;
    select.appendChild(option);
  });
}

document.getElementById('run-test-form').addEventListener('submit', function(event) {
  event.preventDefault();

  const configFile = document.getElementById('config-file-select').value;
  const testFile = document.getElementById('test-file-select').value;
  const payloadDb = document.getElementById('payload-db-select').value;
  const detailedSuccess = document.getElementById('detailed-success-checkbox').checked;
  const detailedFailure = document.getElementById('detailed-failure-checkbox').checked;

  // TODO: Implement what happens when the form is submitted
});

loadConfigurations();
loadTestFiles();
loadPayloadDbs();
