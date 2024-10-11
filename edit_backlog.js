let originalBacklogData = null;  // Store the original backlog data

// Load user stories from localStorage on page load
document.addEventListener('DOMContentLoaded', function() {
    const backlogData = JSON.parse(localStorage.getItem('backlogData'));
    if (backlogData && backlogData.length > 0) {
        originalBacklogData = JSON.parse(JSON.stringify(backlogData));  // Deep copy to preserve the original data
        populateEditForm(backlogData);
    } else {
        displayNoUserStoriesMessage();
    }
});

function populateEditForm(userStories) {
    const form = document.getElementById('editBacklogForm');
    
    userStories.forEach((story, index) => {
        addStoryToForm(story, index, form);
    });

    // Add the Add New Story button at the end of the form
    const addButton = document.createElement('button');
    addButton.id = 'addButton';
    addButton.type = 'button';
    addButton.textContent = 'Add New User Story';
    addButton.onclick = addNewStory;
    form.appendChild(addButton);
}

// Function to add a user story to the form
function addStoryToForm(story, index, form) {
    const fieldset = document.createElement('fieldset');
    fieldset.innerHTML = `
        <legend>User Story ${index + 1}</legend>
        <label>Title: <input type="text" name="title" value="${story.title}"></label>
        <label>Story: <input type="text" name="story" value="${story.story}"></label>
        <label>Action: <input type="text" name="action" value="${story.action}"></label>
        <label>Priority: <input type="text" name="priority" value="${story.priority}"></label>
        <label>Dependency: <input type="text" name="dependency" value="${story.dependency}"></label>
        <button type="button" onclick="removeStory(this)">Remove</button>
    `;
    form.insertBefore(fieldset, document.getElementById('addButton'));
}

// Function to add a new user story
function addNewStory() {
    const form = document.getElementById('editBacklogForm');
    const index = form.querySelectorAll('fieldset').length;
    const newStory = { title: '', story: '', action: '', priority: '', dependency: '' };
    addStoryToForm(newStory, index, form);
}

// Function to remove a user story from the form
function removeStory(button) {
    const fieldset = button.parentElement;
    fieldset.remove();
}

// Function to extract user stories from the form
function getUserStoriesFromForm(form) {
    const userStories = [];
    form.querySelectorAll('fieldset').forEach(fieldset => {
        const story = {};
        fieldset.querySelectorAll('input').forEach(input => {
            story[input.name] = input.value;
        });
        userStories.push(story);
    });
    return userStories;
}

async function startTask() {
    const bucket = 'dupbucketforsolutionsfrontendweiyi';
    deleteFile(bucket,'reflection.txt');
    deleteFile(bucket,'architecture.yaml')

    try {
        const response = await fetch('https://cqccrkskyj.execute-api.us-east-1.amazonaws.com/dev/starttask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Task started successfully:', data);
            alert('Task started successfully');
            showProcessingMessage();
            checkFilesPresencePeriodically();
        } else {
            const errorData = await response.json();
            console.error('Error starting task:', errorData);
            alert('Error starting task');
        }
    } catch (error) {
        console.error('Error starting task:', error);
        alert('Error starting task');
    }
}

async function deleteFile(bucket, fileName) {
    const response = await fetch(`/delete/${bucket}/${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
    });
    if (response.ok) {
        console.log(`Deleted ${fileName} successfully!`);
    } else {
        console.log('Failed to delete file.');
    }
}

function showProcessingMessage() {
    const existingMessage = document.getElementById('processingMessage');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const processingMessage = document.createElement('div');
    processingMessage.id = 'processingMessage';
    processingMessage.textContent = 'Processing...';
    document.body.appendChild(processingMessage);
}

async function checkFilesPresencePeriodically() {
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
            clearInterval(interval);
            document.getElementById('processingMessage').textContent = 'Processing timeout. Please try again later.';
            return;
        }
        
        try {
            const response = await fetch('https://cqccrkskyj.execute-api.us-east-1.amazonaws.com/dev/checkprocess', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const rawResponse = await response.text();
            console.log('Raw response:', rawResponse);

            const data = JSON.parse(rawResponse);
            console.log('Parsed data:', data);

            if (data.body) {
                const parsedBody = JSON.parse(data.body);
                console.log('Parsed body:', parsedBody);

                if (parsedBody.filesPresent) {
                    clearInterval(interval);
                    document.getElementById('processingMessage').textContent = 'Processing complete!';
                    const showSolutionButton = document.getElementById('showSolutionButton');
                    if (showSolutionButton) {
                        showSolutionButton.style.display = 'block';
                        showSolutionButton.addEventListener('click', () => {
                            window.location.href = 'solution.html';
                        });
                    }
                }
            } else {
                console.error('Response body is missing');
            }
        } catch (error) {
            console.error('Error checking file presence:', error);
        }
    }, 25000); // Check every 25 seconds
}

// Function to save the edited backlog to DynamoDB
async function saveBacklog() {
    const form = document.getElementById('editBacklogForm');
    const userStories = getUserStoriesFromForm(form);

    try {
        const response = await fetch('https://cqccrkskyj.execute-api.us-east-1.amazonaws.com/dev/storebacklog', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userStories })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('the body is',body)
        console.log('Backlog saved successfully:', data);
    } catch (error) {
        console.error('Error saving backlog:', error);
    }
}

// Function to reset the form to its original state
function resetBacklog() {
    const form = document.getElementById('editBacklogForm');
    form.innerHTML = '';  // Clear the form
    populateEditForm(originalBacklogData);  // Repopulate the form with the original data
}

// Function to confirm cancel action
function confirmCancel() {
    if (confirm("Are you sure you want to cancel? All changes will be lost.")) {
        cancelEdit();
    }
}

// Function to cancel editing
function cancelEdit() {
    returnToMainPage();
}

// Function to display a message if no user stories are detected
function displayNoUserStoriesMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.id = 'noUserStoriesMessage';
    messageDiv.textContent = 'No user story detected, please run generate backlog.';
    document.getElementById('editBacklogPage').appendChild(messageDiv);
}

// Function to return to the initial page
function returnToMainPage() {
    window.location.href = 'index.html';  // Assuming 'index.html' is the initial page
}

document.getElementById('startTaskButton').addEventListener('click', startTask);