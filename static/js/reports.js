
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
  let totalResponse;

  if (currentCategory) {
    summaryResponse = await fetch(`/test_passed_failed_specific_category?filename=${reportFile}&category=${currentCategory}`);
    totalResponse = await fetch(`/overall_passed_failed_for_category?filename=${reportFile}&category=${currentCategory}`);
  } else {
    summaryResponse = await fetch(`/category_passed_failed?filename=${reportFile}`);
    totalResponse = await fetch(`/overall_passed_failed?filename=${reportFile}`);
  }

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
      aspectRatio: 3,
      scales: {
        y: {
          beginAtZero: true
        },
        x: {
          ticks: {
            maxRotation: 0,
            minRotation: 0
          }
        }
      },
        onClick: function(event, elements) {
          if (elements.length > 0) {
            const chartElement = elements[0];
            const label = this.data.labels[chartElement.index];
            const datasetLabel = this.data.datasets[chartElement.datasetIndex].label;
            if (!currentCategory && (datasetLabel === 'Passed' || datasetLabel === 'Failed')) {
              currentCategory = label;
              loadReportData(reportFile);
            } else if (currentCategory && (datasetLabel === 'Passed' || datasetLabel === 'Failed')) {
              // Load detailed results for the selected test and result type (passed or failed)
              loadDetailedResults(reportFile, currentCategory, label, datasetLabel);
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

  if (currentCategory) {
    document.getElementById('back-button').style.display = 'block';
  } else {
    document.getElementById('back-button').style.display = 'none';
  }
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


async function loadDetailedResults(reportFile, category, test, resultType) {
  const response = await fetch(`/test_detailed_results?filename=${reportFile}&category=${encodeURIComponent(category)}&test=${encodeURIComponent(test)}&result_type=${resultType}`);
  const data = await response.json();

  const tableBody = document.getElementById('detailsTableBody');
  // Clear previous results
  tableBody.innerHTML = '';

  // Use Object.values to get an array of the values in the object
  Object.values(data).forEach(result => {
    let row = document.createElement('tr');

    let locationCell = document.createElement('td');
    locationCell.textContent = result.location;  // Adjusted to match data structure
    row.appendChild(locationCell);

    let payloadCell = document.createElement('td');
    payloadCell.className = "wide-column"; // Added this line
    payloadCell.textContent = result.payload;
    row.appendChild(payloadCell);

    let resultCell = document.createElement('td');
    resultCell.className = "wide-column"; // Added this line
    resultCell.textContent = result.result;
    row.appendChild(resultCell);

    let statusCodeCell = document.createElement('td');
    statusCodeCell.textContent = result.status_code;  // Adjusted to match data structure
    row.appendChild(statusCodeCell);

    tableBody.appendChild(row);
  });

  // Show the modal
  $('#detailsModal').modal('show');
}



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

//function createChart(canvas, data, type) {
//    return new Promise((resolve, reject) => {
//        // Determine the labels and datasets based on the type of chart
//        let labels, datasets;
//        if (type === 'bar') {
//            labels = Object.keys(data);
//            datasets = [
//                {
//                    label: 'Failed',
//                    data: labels.map(key => data[key].Failed),
//                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
//                    borderColor: 'rgba(255, 99, 132, 1)',
//                    borderWidth: 1
//                },
//                {
//                    label: 'Passed',
//                    data: labels.map(key => data[key].Passed),
//                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
//                    borderColor: 'rgba(75, 192, 192, 1)',
//                    borderWidth: 1
//                }
//            ];
//        } else if (type === 'pie') {
//            labels = ['Failed', 'Passed'];
//            datasets = [
//                {
//                    data: [data.Failed, data.Passed],
//                    backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(75, 192, 192, 0.2)'],
//                    borderColor: ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'],
//                    borderWidth: 1
//                }
//            ];
//        }
//
//        // Create the chart
//        new Chart(canvas.getContext('2d'), {
//            type: type,
//            data: {
//                labels: labels,
//                datasets: datasets
//            },
//            options: {
//                aspectRatio: 3,
//                scales: {
//                    y: {
//                        beginAtZero: true
//                    },
//                    x: {
//                        ticks: {
//                            maxRotation: 0,
//                            minRotation: 0
//                        }
//                    }
//                },
//                animation: {
//                    onComplete: function() {
//                        setTimeout(() => {
//                            resolve(canvas);
//                        }, 500); // Wait for 500ms to allow the chart to render
//                    }
//                }
//            }
//        });
//
//        // Add the canvas to the DOM
//        document.body.appendChild(canvas);
//    });
//}
//async function exportPDF() {
//    // Create a new jsPDF instance
//    var pdf = new jsPDF('p', 'mm', 'a4');
//
//    // Add title
//    pdf.setFontSize(22);
//    pdf.text('Test Report', 105, 30, { align: 'center' });
//
//    // Fetch the data
//    const reportFile = document.getElementById('report-file-select').value;
//    const summaryResponse = await fetch(`/category_passed_failed?filename=${reportFile}`);
//    const totalResponse = await fetch(`/overall_passed_failed?filename=${reportFile}`);
//    const summaryData = await summaryResponse.json();
//    const totalData = await totalResponse.json();
//    console.log("here1")
//    console.log(summaryData);
//    console.log(totalData);
//    // Create the charts
//    var summaryChartCanvas = await createChart(document.createElement('canvas'), summaryData, 'bar');
//        console.log("here2")
//    var totalChartCanvas = await createChart(document.createElement('canvas'), totalData, 'pie');
//
//    console.log("here3")
//    // Convert the canvases to data URLs
//    var summaryChartImgData = summaryChartCanvas.toDataURL('image/png');
//    var totalChartImgData = totalChartCanvas.toDataURL('image/png');
//
//        // Remove the canvases from the DOM
//    document.body.removeChild(summaryChartCanvas);
//    document.body.removeChild(totalChartCanvas);
//
//    console.log(summaryChartImgData)
//    console.log(totalChartImgData)
//
//    // Add the images to the PDF
//    pdf.addImage(summaryChartImgData, 'PNG', 10, 60, 180, 60); // Adjust these parameters as needed
//    pdf.addImage(totalChartImgData, 'PNG', 70, 130, 60, 60); // Adjust these parameters as needed
//
//    // Save the PDF
//    pdf.save('report.pdf');
//}



// document.getElementById('export-pdf').addEventListener('click', exportPDF);


document.getElementById('export-json').addEventListener('click', async function(event) {
  event.preventDefault();

  // Get the selected report file
  const reportFile = document.getElementById('report-file-select').value;

  // Fetch the JSON data from the server
  const response = await fetch(`/api/report-json/${reportFile}`);
  if (!response.ok) {
    console.error('Failed to fetch JSON report');
    return;
  }
  const data = await response.json();

  // Create a "blob" of data in the JSON format
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

  // Create a link to download the blob
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportFile}`;

  // Append the link to the body (this is required for Firefox)
  document.body.appendChild(link);

  // Start the download
  link.click();

  // Clean up: remove the link after the download starts
  setTimeout(() => document.body.removeChild(link), 100);
});


document.getElementById('export-excel').addEventListener('click', function(event) {
  event.preventDefault();
  // Handle Excel export
});

document.getElementById('export-pdf').addEventListener('click', function(event) {
  event.preventDefault();
  // Handle PDF export
});


