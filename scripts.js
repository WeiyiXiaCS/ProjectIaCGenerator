function uploadFile(bucket, filename, fileContent, contentType) {
    // Log the parameters before the fetch call
    console.log('Upload Parameters:', {
        bucket,
        filename,
        contentType,
        fileContentSnippet: fileContent.substring(0, 100) // Log only the first 100 characters for brevity
    });

    fetch('/upload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bucket, filename, fileContent, contentType })
    })
    .then(response => {
        console.log('Response Status:', response.status);
        console.log('Response Headers:', response.headers);

        return response.json();
    })
    .then(data => {
        if (data.message) {
            alert(data.message); // Show alert with success message
            listFiles('dupbucketforuploadfilesdemofrontendweiyi', 'filesListBucket1');
            startProcessingCheck();
        } else if (data.error) {
            alert(data.error); // Show alert with error message
        }
    })
    .catch(error => {
        console.error('Error uploading file:', error);
        alert('Error uploading file'); // Show alert with error message
    });
}

async function deleteFile(bucket, fileName) {
    const response = await fetch(`/delete/${bucket}/${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
    });
    if (response.ok) {
        alert(`Deleted ${fileName} successfully!`);
        listFiles('dupbucketforuploadfilesdemofrontendweiyi', 'filesListBucket1');
    } else {
        alert('Failed to delete file.');
    }
}

let filenames = [];  // Temporary storage for filenames

async function listFiles(bucket, elementId) {
    const fileList = document.getElementById(elementId);
    if (!fileList) {
        console.error(`Element with id ${elementId} not found.`);
        return;
    }

    try {
        const response = await fetch(`/files/${bucket}`);
        const files = await response.json();
        fileList.innerHTML = '';
        files.forEach(file => {
            const li = document.createElement('li');
            li.textContent = file;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'file-actions';

            const delButton = document.createElement('button');
            delButton.textContent = 'Delete';
            delButton.onclick = () => deleteFile(bucket, file);
            actionsDiv.appendChild(delButton);

            const showSummaryButton = document.createElement('button');
            showSummaryButton.textContent = 'Show Summary';
            showSummaryButton.onclick = () => showSummary(file);
            actionsDiv.appendChild(showSummaryButton);

            li.appendChild(actionsDiv);
            fileList.appendChild(li);
        });

        // Update the temporary storage for filenames
        filenames = files;
        populateFilenameDropdown();
        console.log('Filenames updated:', filenames);
    } catch (error) {
        console.error(`Error listing files for bucket ${bucket}:`, error);
    }
}

function populateFilenameDropdown() {
    const filenameSelect = document.getElementById('filename');
    filenameSelect.innerHTML = ''; // Clear the existing options

    filenames.forEach(filename => {
        const option = document.createElement('option');
        option.value = filename;
        option.text = filename;
        filenameSelect.appendChild(option);
    });
}

let processingComplete = false;
let checkTimeouts = [];

async function checkProcessingStatus() {
    const statusDiv = document.getElementById('processingStatus');
    if (!statusDiv) {
        console.error('Processing status div not found.');
        return;
    }

    try {
        const response = await fetch('https://d6d0eyc94d.execute-api.us-east-1.amazonaws.com/dev/dupbucketforuploadfilesdemofrontendweiyi', {
            method: 'POST'
        });
        const data = await response.json();

        if (data.body && JSON.parse(data.body).allProcessed) {
            console.log('All files processed successfully.');
            statusDiv.innerHTML = 'Process done';
            processingComplete = true; // Set the flag to true when processing is done

            // Clear all queued timeouts
            checkTimeouts.forEach(timeout => clearTimeout(timeout));
            checkTimeouts = [];
        } else {
            console.log('Files are still being processed.');
            statusDiv.innerHTML = 'Processing...';

            if (!processingComplete) {
                const timeoutId = setTimeout(checkProcessingStatus, 10000);
                checkTimeouts.push(timeoutId); // Store the timeout ID for later clearing
            }
        }
    } catch (error) {
        console.error('Error checking processing status:', error);
        statusDiv.innerHTML = `Error: ${error.message}`;

        if (!processingComplete) {
            const timeoutId = setTimeout(checkProcessingStatus, 10000);
            checkTimeouts.push(timeoutId); // Store the timeout ID for later clearing
        }
    }
}

function startProcessingCheck() {
    let attempts = 0;
    const maxAttempts = 6;

    function attemptCheck() {
        if (processingComplete || attempts >= maxAttempts) {
            return; // Stop further attempts if processing is complete or max attempts reached
        }
        attempts++;
        checkProcessingStatus();
        const timeoutId = setTimeout(attemptCheck, 10000);
        checkTimeouts.push(timeoutId); // Store the timeout ID for later clearing
    }

    attemptCheck();
}

async function addInformation() {
    const filename = document.getElementById('filename').value;
    const additionalInfo = document.getElementById('additionalInfo').value;
    const messageDiv = document.getElementById('addInfoMessage');

    const requestBody = {
        filename: filename,
        additional_info: additionalInfo
    };

    try {
        const response = await fetch('https://cqccrkskyj.execute-api.us-east-1.amazonaws.com/dev/addinfo', {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const result = await response.json();
        if (response.ok) {
            messageDiv.textContent = 'Content added successfully';
        } else {
            throw new Error(result.error || 'Failed to add content');
        }
    } catch (error) {
        messageDiv.textContent = `Error: ${error.message}`;
    }
}

function showAddInfoZone() {
    document.getElementById('additionalInformation').style.display = 'block';
}

function hideAddInfoZone() {
    document.getElementById('additionalInformation').style.display = 'none';
}

async function checkConsistency() {
    const resultDiv = document.getElementById('consistencyResult');
    const messageDiv = document.getElementById('consistencyMessage');
    const summaryZone = document.getElementById('summaryZone');
    
    resultDiv.innerHTML = '';
    messageDiv.innerHTML = '<p class="loading">Checking consistency, please wait...</p>';
    // Clear previous user story content, but keep the title
    const summaryContent = summaryZone.querySelector('.summary-content');
    if (summaryContent) {
        summaryContent.innerHTML = '';
    } else {
        const newSummaryContent = document.createElement('div');
        newSummaryContent.className = 'summary-content';
        summaryZone.appendChild(newSummaryContent);
    }

    try {
        const data = await fetchWithRetry('https://d6d0eyc94d.execute-api.us-east-1.amazonaws.com/dev/consistencyCheck', { method: 'POST' });
        const parsedBody = JSON.parse(data.body);
        const consistenciesKey = Object.keys(parsedBody).find(key => key.toLowerCase() === 'consistencies');
        const overallScoreKey = Object.keys(parsedBody).find(key => key.toLowerCase() === 'overall_average_score');
        const adviceKey = Object.keys(parsedBody).find(key => key.toLowerCase() === 'advice');
        const possibleTitleKey = Object.keys(parsedBody).find(key => key.toLowerCase() === 'possible_title');
        const userStoryKey = Object.keys(parsedBody).find(key => key.toLowerCase() === 'story');

        if (consistenciesKey && parsedBody[consistenciesKey] && Array.isArray(parsedBody[consistenciesKey])) {
            // Display overall average score
            const overallScore = document.createElement('h3');
            overallScore.textContent = `Overall Average Score: ${parsedBody[overallScoreKey]}`;
            overallScore.style.fontSize = '20px';  // Larger font size for emphasis
            resultDiv.appendChild(overallScore);

            // Display possible title if it exists and is not an empty string
            if (possibleTitleKey && parsedBody[possibleTitleKey].trim() !== '') {
                const possibleTitle = document.createElement('h3');
                possibleTitle.textContent = `Possible Title: ${parsedBody[possibleTitleKey]}`;
                possibleTitle.style.fontSize = '20px';  // Larger font size for emphasis
                resultDiv.appendChild(possibleTitle);
            }

            // Display user story if it exists and is not an empty string
            if (userStoryKey && parsedBody[userStoryKey].trim() !== '') {
                const userStory = document.createElement('p');
                userStory.textContent = `${parsedBody[userStoryKey]}`;
                summaryZone.appendChild(userStory);
            }

            // Display each consistency pair, score, and reason
            parsedBody[consistenciesKey].forEach(consistency => {
                const pairElement = document.createElement('div');
                pairElement.className = 'consistency-pair';

                const pairText = document.createElement('p');
                pairText.textContent = `Pair: ${consistency.pair.join(' and ')}`;
                pairElement.appendChild(pairText);

                const scoreKey = Object.keys(consistency).find(key => key.toLowerCase() === 'consistency_score');
                const reasonKey = Object.keys(consistency).find(key => key.toLowerCase() === 'reason');

                const scoreText = document.createElement('p');
                scoreText.textContent = `Consistency Score: ${consistency[scoreKey]}`;
                pairElement.appendChild(scoreText);

                const reasonText = document.createElement('p');
                reasonText.textContent = `Reason: ${consistency[reasonKey]}`;
                pairElement.appendChild(reasonText);

                resultDiv.appendChild(pairElement);
            });

            // Display advice if it exists
            if (adviceKey && parsedBody[adviceKey]) {
                const adviceText = document.createElement('p');
                adviceText.style.fontWeight = 'bold';
                adviceText.textContent = `Advice: ${parsedBody[adviceKey]}`;
                resultDiv.appendChild(adviceText);
            }

            // Show the Accept button only if the overall score is below 80%
            if (parseFloat(parsedBody[overallScoreKey]) < 80) {
                document.getElementById('acceptButton').style.display = 'block';
            } else {
                document.getElementById('acceptButton').style.display = 'none';
            }

            messageDiv.innerHTML = ''; // Clear message once successful
        } else {
            throw new Error('Expected consistency data not found.');
        }
    } catch (error) {
        console.error('Final attempt failed:', error);
        messageDiv.innerHTML = `<p>${error.message}</p>`;  // Display final error message only
    }
}

async function showSummary(fileName) {
    const brutInformationDiv = document.getElementById('brutInformation');
    const summaryDiv = document.getElementById('summaryResult');
    const messageDiv = document.getElementById('summaryMessage');
    
    summaryDiv.style.display = 'block';
    messageDiv.style.display = 'block';
    
    summaryDiv.innerHTML = '';
    messageDiv.innerHTML = `<p class="loading">Fetching summary for ${fileName}, please wait...</p>`;

    try {
        const response = await fetch(`https://cqccrkskyj.execute-api.us-east-1.amazonaws.com/dev/${encodeURIComponent(fileName)}`, { method: 'POST' });
        const data = await response.json();
        console.log('Response data:', data);  
        if (data && data.thesis) {
            let summaryHTML = `<p><strong>Thesis:</strong> ${data.thesis}</p>`;
            if (data.additional_info && data.additional_info.trim() !== '') {
                summaryHTML += `<p><strong>Additional Information:</strong> ${data.additional_info}</p>`;
            }
            summaryHTML += '<button id="hideSummaryButton">Hide</button>';
            summaryDiv.innerHTML = summaryHTML;
            messageDiv.innerHTML = 'Summary fetched successfully!';

            document.getElementById('hideSummaryButton').addEventListener('click', function() {
                summaryDiv.style.display = 'none';
                messageDiv.style.display = 'none';
            });

        } else {
            throw new Error('Summary data is missing or invalid.');
        }
    } catch (error) {
        console.error('Final attempt failed:', error);
        messageDiv.innerHTML = `<p>${error.message}</p>`;
    }
}

async function fetchWithRetryBacklog(url, options = {}, maxRetries = 3, retryDelay = 1000) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Check if response is valid based on specific conditions
            if (isValidResponse(data, url)) {
                return data;
            } else {
                throw new Error('Invalid response structure or content.');
            }
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed: ${error.message}`);

            // If the maximum number of retries is reached, throw the error
            if (attempt >= maxRetries) {
                throw error;
            }

            // Wait for the specified delay before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}

async function fetchWithRetry(url, options, retries = 3, backoff = 300) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);

            // Check if the response is ok (status 200-299)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json(); // Assuming the response is in JSON format
            console.log("Raw Response Body:", data.body);  // Log the raw body from the response

            const parsedBody = JSON.parse(data.body);
            console.log("Parsed Response Body:", parsedBody);  // Log the parsed body as JSON

            return data;  // Return the original data or parsed body as needed

        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i < retries - 1) {
                // Implement backoff if necessary
                await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, i)));
            } else {
                throw error;
            }
        }
    }
}

function isValidResponse(data, url) {
    if (url.includes('checkconsistency')) {
        const parsedBody = JSON.parse(data.body);
        const consistenciesKey = Object.keys(parsedBody).find(key => key.toLowerCase() === 'consistencies');
        const overallScoreKey = Object.keys(parsedBody).find(key => key.toLowerCase() === 'overall_average_score');
        return consistenciesKey && overallScoreKey;
    } else if (url.includes('generatebacklog')) {
        return data.userStories && Array.isArray(data.userStories);
    }
    return false;
}

let tempBacklogData = null;  // Temporary storage for backlog data

async function generateBacklog() {
    const resultDiv = document.getElementById('backlogResult');
    const messageDiv = document.getElementById('backlogMessage');
    
    resultDiv.innerHTML = '';
    messageDiv.innerHTML = '<p class="loading">Generating backlog, please wait...</p>';

    try {
        const data = await fetchWithRetryBacklog('https://cqccrkskyj.execute-api.us-east-1.amazonaws.com/dev/generatebacklog', { method: 'POST' });
        if (data && data.userStories) {
            tempBacklogData = data.userStories;
            displayUserStories(data.userStories, resultDiv);
            messageDiv.innerHTML = 'Backlog generated successfully!';  // Notify success
        } else {
            throw new Error('Backlog data is missing or invalid.');
        }
    } catch (error) {
        console.error('Final attempt failed:', error);
        messageDiv.innerHTML = `<p>${error.message}</p>`;  // Display final error message only
    }
}

function displayUserStories(userStories, parentElement) {
    if (!Array.isArray(userStories)) {
        console.error('Invalid user stories encountered:', userStories);
        return;
    }

    // Create a table for user stories
    const table = document.createElement('table');
    table.className = 'user-story-table';

    // Create table header
    const header = document.createElement('tr');
    ['Title', 'Story', 'Action', 'Priority', 'Dependency'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        header.appendChild(th);
    });
    table.appendChild(header);

    // Create table rows for each user story
    userStories.forEach(story => {
        if (story && typeof story === 'object') {
            const row = document.createElement('tr');
            Object.entries(story).forEach(([key, value]) => {
                const td = document.createElement('td');
                td.textContent = value;
                row.appendChild(td);
            });
            table.appendChild(row);
        } else {
            const row = document.createElement('tr');
            const td = document.createElement('td');
            td.textContent = `Story: ${story}`;
            row.appendChild(td);
            table.appendChild(row);
        }
    });

    parentElement.appendChild(table);
}

function editBacklog() {
    window.location.href = 'edit_backlog.html';
    localStorage.setItem('backlogData', JSON.stringify(tempBacklogData));  // Store data in localStorage
}

document.getElementById('uploadForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const input = document.querySelector('input[type="file"]');
    if (!input) {
        console.error('File input element not found.');
        return;
    }

    const files = input.files;
    const bucket = 'dupbucketforuploadfilesdemofrontendweiyi'; // hardcoded bucket name

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = function (e) {
            const fileContent = e.target.result.split(',')[1]; // get the base64 content

            // Log the file details
            console.log(`File name: ${file.name}`);
            console.log(`Content Type: ${file.type}`);
            console.log(`File Content (first 100 chars): ${fileContent.substring(0, 100)}...`);

            // Send the file details to the server
            uploadFile(bucket, file.name, fileContent, file.type);
        };

        reader.readAsDataURL(file);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    listFiles('dupbucketforuploadfilesdemofrontendweiyi', 'filesListBucket1');
});

document.getElementById('acceptButton').addEventListener('click', function() {
    const consistencyResultDiv = document.getElementById('consistencyResult');
    const adviceTextElement = Array.from(consistencyResultDiv.getElementsByTagName('p')).find(p => p.textContent.includes('Advice:'));

    if (adviceTextElement) {
        const advice = adviceTextElement.textContent.replace('Advice: ', '').trim();
        console.log('Extracted advice:', advice); // Log the extracted advice

        const filenamesToDelete = advice.match(/\b\w+\.\w+\b/g); // Match filenames without quotes
        if (!filenamesToDelete) {
            console.log('No filenames found in advice.');
            return;
        }

        const cleanedFilenames = filenamesToDelete.map(name => name.replace(/"/g, ''));
        console.log('Filenames to delete:', cleanedFilenames); // Log the filenames to delete

        const confirmDelete = confirm(`Are you sure you want to delete the following files?\n${cleanedFilenames.join('\n')}`);
        if (confirmDelete) {
            cleanedFilenames.forEach(filename => {
                if (filenames.includes(filename)) {
                    deleteFile('dupbucketforuploadfilesdemofrontendweiyi', filename);
                }
            });
            consistencyResultDiv.innerHTML += '<p>Advice followed: Files deleted.</p>';
        } else {
            console.log('File deletion canceled.');
        }
    } else {
        console.log('No advice found in consistency results.');
    }
});


