async function loadReportFiles() {
  const response = await fetch('/api/reports-files');
  const reports = await response.json();
  const select = document.getElementById('report-file-select');

  reports.forEach(report => {
    const option = document.createElement('option');
    option.value = report;
    option.text = report;
    select.appendChild(option);
  });
}

let summaryChart = null;
let totalChart = null;
let currentCategory = null;

async function loadReportData(reportFile) {
  let summaryResponse;
  if (currentCategory) {
    summaryResponse = await fetch(`/test_passed_failed_specific_category?filename=${reportFile}&category=${currentCategory}`);
  } else {
    summaryResponse = await fetch(`/category_passed_failed?filename=${reportFile}`);
  }
  const totalResponse = await fetch(`/overall_passed_failed?filename=${reportFile}`);

  const summaryData = await summaryResponse.json();
  const totalData = await totalResponse.json();

  const summaryLabels = Object.keys(summaryData);
  const summaryFailedData = summaryLabels.map(key => summaryData[key].Failed);
  const summaryPassedData = summaryLabels.map(key => summaryData[key].Passed);

  if (summaryChart) {
    summaryChart.destroy();
  }
  if (totalChart) {
    totalChart.destroy();
  }
  summaryChart = new Chart(document.getElementById('summary-chart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: summaryLabels,
      datasets: [
        {
          label: 'Failed',
          data: summaryFailedData,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          label: 'Passed',
          data: summaryPassedData,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      },
      onClick: function(event, elements) {
        if (elements.length > 0) {
          const chartElement = elements[0];
          const label = this.data.labels[chartElement.index];
          const datasetLabel = this.data.datasets[chartElement.datasetIndex].label;
          if (!currentCategory && datasetLabel === 'Passed') {
            currentCategory = label;
            loadReportData(reportFile, label);
          }
        }
      }
    }
  });

  totalChart = new Chart(document.getElementById('total-chart').getContext('2d'), {
    type: 'pie',
    data: {
      labels: ['Failed', 'Passed'],
      datasets: [
        {
          data: [totalData.Failed, totalData.Passed],
          backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(75, 192, 192, 0.2)'],
          borderColor: ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'],
          borderWidth: 1
        }
      ]
    }
  });
}

document.getElementById('back-button').addEventListener('click', function(event) {
  event.preventDefault();
  if (currentCategory) {
    currentCategory = null;
    const reportFile = document.getElementById('report-file-select').value;
    loadReportData(reportFile);
  }
});



document.getElementById('display-button').addEventListener('click', function(event) {
  event.preventDefault();
  const reportFile = document.getElementById('report-file-select').value;
  loadReportData(reportFile);
});

loadReportFiles();

async function selectReportFile(reportFile) {
  // Select the report file in the dropdown
  const select = document.getElementById('report-file-select');
  select.value = reportFile;

  // Load the report data
  loadReportData(reportFile);
}

window.addEventListener('load', function() {
  // Get the report file from the URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const reportFile = urlParams.get('filename');

  // If a report file is specified, select it
  if (reportFile) {
    selectReportFile(reportFile);
  }
});

document.getElementById('export-json').addEventListener('click', function(event) {
  event.preventDefault();
  // Handle JSON export
});

document.getElementById('export-excel').addEventListener('click', function(event) {
  event.preventDefault();
  // Handle Excel export
});

document.getElementById('export-pdf').addEventListener('click', function(event) {
  event.preventDefault();
  // Handle PDF export
});
