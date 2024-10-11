document.addEventListener('DOMContentLoaded', () => {
    fetchFileContent('reflection.txt', 'reflectionsText');
    fetchFileContent('architecture.yaml', 'architectureText');

    const bucketName = 'dupbucketforsolutionsfrontendweiyi';

    document.getElementById('downloadReflectionButton').addEventListener('click', () => downloadFile(bucketName, 'reflection.txt'));
    document.getElementById('downloadArchitectureButton').addEventListener('click', () => downloadFile(bucketName, 'architecture.yaml'));

    document.getElementById('returnButton').addEventListener('click', () => {
        window.location.href = 'index.html'; // Replace with your main menu page
    });
});

async function fetchFileContent(filename, elementId) {
    try {
        const response = await fetch(`https://d6d0eyc94d.execute-api.us-east-1.amazonaws.com/dev/dupbucketforsolutionsfrontendweiyi/${filename}`);
        if (response.ok) {
            const content = await response.text();
            document.getElementById(elementId).textContent = content;
        } else {
            console.error(`Error fetching ${filename}:`, response.statusText);
        }
    } catch (error) {
        console.error(`Error fetching ${filename}:`, error);
    }
}


async function downloadFile(bucket, filename) {
    try {
        const response = await fetch('/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bucket, filename })
        });

        if (response.ok) {
            const data = await response.json();
            const downloadUrl = data.downloadUrl;
            console.log(`Download URL for ${filename}: ${downloadUrl}`);

            // Create a link and trigger a download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.error(`Error fetching download URL for ${filename}:`, response.statusText);
        }
    } catch (error) {
        console.error(`Error fetching download URL for ${filename}:`, error);
    }
}
