const express = require('express');
//const multer = require('multer');
const axios = require('axios');
const xml2js = require('xml2js');

const app = express();
const port = 3000;

//const storage = multer.memoryStorage();
//const upload = multer({ storage: storage });

app.use(express.static('.')); // Serve static files from root directory
app.use(express.json({ limit: '50mb' })); // Increase the limit to 50MB

const apiGatewayUrl = 'https://d6d0eyc94d.execute-api.us-east-1.amazonaws.com/dev';
const bucketName = 'dupbucketforuploadfilesdemofrontendweiyi'

app.post('/upload', async (req, res) => {
    try {
        const { filename, fileContent } = req.body;
        console.log(`Received upload request for file: ${filename}, bucket: ${bucketName}`);

        // Step 1: Get the pre-signed URL from the API Gateway
        console.log(`Requesting pre-signed URL for file: ${filename}`);
        const response = await axios.post(`${apiGatewayUrl}/${bucketName}/${filename}`, {}, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Ensure proper parsing of the response
        const { uploadUrl, fileKey } = JSON.parse(response.data.body);
        console.log(`Received pre-signed URL: ${uploadUrl}`);

        // Step 2: Upload the file to S3 using the pre-signed URL
        console.log(`Uploading file to S3: ${filename}`);
        await axios.put(uploadUrl, Buffer.from(fileContent, 'base64'), {
            headers: {
                'Content-Type': 'application/octet-stream'
            }
        });
        console.log(`File uploaded successfully to S3: ${filename}`);

        res.json({ message: `File uploaded successfully to S3: ${filename}` });
    } catch (error) {
        console.error('Error uploading file:', error.message);
        res.status(500).json({ error: 'Error uploading file' });
    }
});

// List files from specified bucket
app.get('/files/:bucket', async (req, res) => {
    const bucket = req.params.bucket;
    const baseUrl = `https://d6d0eyc94d.execute-api.us-east-1.amazonaws.com/dev/${bucket}`;

    try {
        const response = await axios.get(baseUrl);
        xml2js.parseString(response.data, { explicitArray: false }, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                res.status(500).json({ message: "Failed to parse file list." });
                return;
            }
            try {
                if (result.ListBucketResult && result.ListBucketResult.Contents) {
                    let files = result.ListBucketResult.Contents;
                    if (!Array.isArray(files)) {
                        files = [files];
                    }
                    const fileNames = files
                    .map(item => item.Key)
                    .filter(key => !key.startsWith('Crewai_response/'));  // Filter out the response folder for the response from crewai lambda function
                    res.json(fileNames);
                } else {
                    res.json([]);
                }
            } catch (parseError) {
                console.error('Error processing files:', parseError);
                res.status(500).json({ message: "Failed to process file list." });
            }
        });
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ message: "Failed to list files." });
    }
});

// Delete a file from specified bucket
app.delete('/delete/:bucket/:fileName', async (req, res) => {
    const { bucket, fileName } = req.params;
    const baseUrl = `https://d6d0eyc94d.execute-api.us-east-1.amazonaws.com/dev/${bucket}/${encodeURIComponent(fileName)}`;
    try {
        await axios.delete(baseUrl);
        res.json({ message: `Deleted ${fileName} successfully!` });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: `Failed to delete ${fileName}.` });
    }
});

app.post('/download', async (req, res) => {
    try {
        const { filename } = req.body;
        const bucket = 'dupbucketforsolutionsfrontendweiyi';
        console.log(`Received download request for file: ${filename} from bucket: ${bucket}`);

        // Step 1: Get the pre-signed URL from the API Gateway
        console.log(`Requesting pre-signed URL for downloading file: ${filename}`);
        const response = await axios.post(`${apiGatewayUrl}/${bucket}/${filename}`, {}, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const { downloadUrl } = JSON.parse(response.data.body);
        //console.log(`Received pre-signed download URL: ${downloadUrl}`);

        res.json({ downloadUrl });
    } catch (error) {
        console.error('Error fetching download URL:', error.message);
        res.status(500).json({ error: 'Error fetching download URL' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});