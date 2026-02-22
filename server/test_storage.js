const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function testFileUpload() {
    console.log("--- Testing Domain-Based File Upload ---");
    const userId = "test_user_123";
    const domain = "Artificial Intelligence";
    const filePath = path.join(__dirname, 'test_paper.pdf');

    // Create a dummy PDF file content
    fs.writeFileSync(filePath, "Dummy PDF Content for Testing");

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('title', 'Test AI Paper');
    formData.append('domain', domain);
    formData.append('file', fs.createReadStream(filePath));

    try {
        const res = await axios.post('http://localhost:5000/api/papers/upload', formData, {
            headers: formData.getHeaders()
        });
        console.log("Upload Response:", res.data.message);

        const expectedDir = path.join(__dirname, 'user_workspace', userId, domain);
        if (fs.existsSync(expectedDir)) {
            console.log(`Success: Directory created at ${expectedDir}`);
            const files = fs.readdirSync(expectedDir);
            console.log("Files in directory:", files);
        } else {
            console.error(`Failure: Directory NOT created at ${expectedDir}`);
        }
    } catch (err) {
        console.error("Upload Error:", err.response ? err.response.data : err.message);
    } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
}

testFileUpload();
