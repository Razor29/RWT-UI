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

async function loadReportData(reportFile) {
  const summaryResponse = await fetch(`/summary?filename=${reportFile}`);
  const totalResponse = await fetch(`/total_failed_passed?filename=${reportFile}`);

  const summaryData = await summaryResponse.json();
  const totalData = await totalResponse.json();

  const summaryLabels = Object.keys(summaryData);
  const summaryFailedData = summaryLabels.map(key => summaryData[key].Failed);
  const summaryPassedData = summaryLabels.map(key => summaryData[key].Passed);

  new Chart(document.getElementById('summary-chart').getContext('2d'), {
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
      }
    }
  });

  new Chart(document.getElementById('total-chart').getContext('2d'), {
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

document.getElementById('display-button').addEventListener('click', function(event) {
  event.preventDefault();
  const reportFile = document.getElementById('report-file-select').value;
  loadReportData(reportFile);
});

loadReportFiles();
