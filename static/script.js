function updateClock() {
    const clockElement = document.getElementById("digital-clock");
    const currentTime = moment().format("HH:mm:ss");
    clockElement.textContent = currentTime;
}

setInterval(updateClock, 1000);

// Event listener for when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;
    if (currentPage.includes('tests')) {
        document.querySelector('#nav-tests img').src = document.querySelector('#nav-tests img').dataset.activeSrc;
    } else if (currentPage.includes('database')) {
        document.querySelector('#nav-database img').src = document.querySelector('#nav-database img').dataset.activeSrc;
    } else if (currentPage.includes('results')) {
        document.querySelector('#nav-results img').src = document.querySelector('#nav-results img').dataset.activeSrc;
    } else {
        document.querySelector('#nav-configurations img').src = document.querySelector('#nav-configurations img').dataset.activeSrc;
    }

    // Database Page
    const contextMenu = createContextMenu();
    document.body.appendChild(contextMenu);
    document.body.onclick = hideContextMenu;
    const fileExplorer = document.getElementById('file-explorer');
    if (fileExplorer) {
        loadFileExplorer('/payloadDB');
    }

});

// ...





// Database Page Functions
