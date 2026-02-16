// Sample data storage
let dashboardData = {
    finbert: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1: 0,
        sentiments: { positive: 0, neutral: 0, negative: 0 },
        history: []
    },
    vader: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1: 0,
        sentiments: { positive: 0, neutral: 0, negative: 0 },
        history: []
    }
};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadSampleData();
    updateDashboard();
});

// Load sample data
function loadSampleData() {
    dashboardData.finbert = {
        accuracy: 89.2,
        precision: 88.5,
        recall: 87.3,
        f1: 87.9,
        sentiments: { positive: 35, neutral: 42, negative: 23 },
        history: [82, 84, 85, 87, 89.2]
    };

    dashboardData.vader = {
        accuracy: 86.4,
        precision: 85.2,
        recall: 84.1,
        f1: 84.6,
        sentiments: { positive: 38, neutral: 40, negative: 22 },
        history: [78, 80, 82, 84, 86.4]
    };

    addActivityLog('Sample data loaded successfully', 'info');
}

// Update dashboard with current data
function updateDashboard() {
    // Update FinBERT metrics
    updateMetricValue('finbert-accuracy', dashboardData.finbert.accuracy);
    updateMetricValue('finbert-precision', dashboardData.finbert.precision);
    updateMetricValue('finbert-recall', dashboardData.finbert.recall);
    updateMetricValue('finbert-f1', dashboardData.finbert.f1);
    updateSentimentDistribution('finbert', dashboardData.finbert.sentiments);

    // Update VADER metrics
    updateMetricValue('vader-accuracy', dashboardData.vader.accuracy);
    updateMetricValue('vader-precision', dashboardData.vader.precision);
    updateMetricValue('vader-recall', dashboardData.vader.recall);
    updateMetricValue('vader-f1', dashboardData.vader.f1);
    updateSentimentDistribution('vader', dashboardData.vader.sentiments);
}

// Update a metric value
function updateMetricValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value.toFixed(2) + '%';
    }
}

// Update sentiment distribution
function updateSentimentDistribution(model, sentiments) {
    const total = sentiments.positive + sentiments.neutral + sentiments.negative;
    
    if (total === 0) return;

    const positivePct = (sentiments.positive / total) * 100;
    const neutralPct = (sentiments.neutral / total) * 100;
    const negativePct = (sentiments.negative / total) * 100;

    // Update progress bars
    document.getElementById(`${model}-positive`).style.width = positivePct + '%';
    document.getElementById(`${model}-neutral`).style.width = neutralPct + '%';
    document.getElementById(`${model}-negative`).style.width = negativePct + '%';

    // Update percentages
    document.getElementById(`${model}-positive-pct`).textContent = positivePct.toFixed(1) + '%';
    document.getElementById(`${model}-neutral-pct`).textContent = neutralPct.toFixed(1) + '%';
    document.getElementById(`${model}-negative-pct`).textContent = negativePct.toFixed(1) + '%';
}

// Handle file uploads
function handleUpload(type) {
    const fileInputId = getFileInputId(type);
    const statusId = getStatusId(type);
    const fileInput = document.getElementById(fileInputId);
    const statusDiv = document.getElementById(statusId);

    if (!fileInput.files || fileInput.files.length === 0) {
        showStatus(statusDiv, 'Please select a file first', 'error');
        return;
    }

    const file = fileInput.files[0];
    showStatus(statusDiv, `Uploading ${file.name}...`, 'info');

    // Simulate file upload
    setTimeout(() => {
        processUploadedFile(file, type, statusDiv);
    }, 1000);
}

// Get file input ID based on type
function getFileInputId(type) {
    const mapping = {
        'rawData': 'rawDataUpload',
        'preprocessed': 'preprocessedUpload',
        'results': 'resultsUpload',
        'groundTruth': 'groundTruthUpload'
    };
    return mapping[type];
}

// Get status div ID based on type
function getStatusId(type) {
    const mapping = {
        'rawData': 'rawDataStatus',
        'preprocessed': 'preprocessedStatus',
        'results': 'resultsStatus',
        'groundTruth': 'groundTruthStatus'
    };
    return mapping[type];
}

// Process uploaded file
function processUploadedFile(file, type, statusDiv) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let data;
            const fileName = file.name.toLowerCase();

            if (fileName.endsWith('.json')) {
                data = JSON.parse(e.target.result);
            } else if (fileName.endsWith('.csv')) {
                data = parseCSV(e.target.result);
            } else {
                data = { raw: e.target.result };
            }

            // Update dashboard based on upload type
            if (type === 'results') {
                updateMetricsFromResults(data);
            }

            showStatus(statusDiv, `✓ ${file.name} uploaded successfully!`, 'success');
            addActivityLog(`Uploaded ${type} file: ${file.name}`, 'success');
            
            // Update dashboard
            updateDashboard();
        } catch (error) {
            showStatus(statusDiv, `✗ Error processing file: ${error.message}`, 'error');
            addActivityLog(`Failed to upload ${file.name}: ${error.message}`, 'error');
        }
    };

    reader.onerror = function() {
        showStatus(statusDiv, '✗ Error reading file', 'error');
    };

    reader.readAsText(file);
}

// Parse CSV data
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index];
        });
        data.push(row);
    }

    return data;
}

// Update metrics from results data
function updateMetricsFromResults(data) {
    // This is a simplified example - adjust based on actual data structure
    if (Array.isArray(data)) {
        // Calculate metrics from data
        const finbertData = data.filter(d => d.model === 'finbert' || d.model === 'FinBERT');
        const vaderData = data.filter(d => d.model === 'vader' || d.model === 'VADER');

        if (finbertData.length > 0) {
            updateModelMetrics('finbert', finbertData);
        }

        if (vaderData.length > 0) {
            updateModelMetrics('vader', vaderData);
        }
    }
}

// Update model metrics from data
function updateModelMetrics(model, data) {
    // Calculate sentiment distribution
    const sentiments = { positive: 0, neutral: 0, negative: 0 };
    
    data.forEach(item => {
        const sentiment = (item.sentiment || item.label || '').toLowerCase();
        if (sentiments.hasOwnProperty(sentiment)) {
            sentiments[sentiment]++;
        }
    });

    dashboardData[model].sentiments = sentiments;

    // If accuracy metrics are provided in the data
    if (data[0] && data[0].accuracy) {
        dashboardData[model].accuracy = parseFloat(data[0].accuracy);
    }
    if (data[0] && data[0].precision) {
        dashboardData[model].precision = parseFloat(data[0].precision);
    }
    if (data[0] && data[0].recall) {
        dashboardData[model].recall = parseFloat(data[0].recall);
    }
    if (data[0] && data[0].f1) {
        dashboardData[model].f1 = parseFloat(data[0].f1);
    }
}

// Show status message
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = 'status-message ' + type;
}

// Add activity log entry
function addActivityLog(message, type) {
    const activityLog = document.getElementById('activityLog');
    
    // Remove "no data" message if present
    const noData = activityLog.querySelector('.no-data');
    if (noData) {
        noData.remove();
    }

    const timestamp = new Date().toLocaleString();
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.innerHTML = `
        <div class="timestamp">${timestamp}</div>
        <div class="message">${message}</div>
    `;

    activityLog.insertBefore(activityItem, activityLog.firstChild);

    // Keep only last 10 items
    while (activityLog.children.length > 10) {
        activityLog.removeChild(activityLog.lastChild);
    }
}

// Export data functionality (for future use)
function exportData() {
    const dataStr = JSON.stringify(dashboardData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kilwa-dashboard-${Date.now()}.json`;
    link.click();
}

// Refresh dashboard
function refreshDashboard() {
    updateDashboard();
    addActivityLog('Dashboard refreshed', 'info');
}
