import http from 'http';

const cleanupUser = 'test_debug_navya_' + Date.now();
const email = `${cleanupUser}@example.com`;
const password = 'password123';

function makeRequest(path, method, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', chunk => responseBody += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        body: responseBody ? JSON.parse(responseBody) : {}
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        body: responseBody
                    });
                }
            });
        });

        req.on('error', error => reject(error));
        if (data) req.write(data);
        req.end();
    });
}

async function run() {
    console.log(`Testing with user: ${email}`);

    // 1. Register
    console.log('--- Registering ---');
    try {
        const regRes = await makeRequest('/api/auth/register', 'POST', {
            username: cleanupUser,
            email: email,
            password: password
        });
        console.log(`Status: ${regRes.statusCode}`);
        console.log(`Body:`, regRes.body);
    } catch (err) {
        console.error('Registration failed:', err.message);
    }

    // 2. Login
    console.log('\n--- Logging In ---');
    try {
        const loginRes = await makeRequest('/api/auth/login', 'POST', {
            email: email,
            password: password
        });
        console.log(`Status: ${loginRes.statusCode}`);
        console.log(`Body:`, loginRes.body);

        if (loginRes.statusCode === 200 && loginRes.body.token) {
            console.log('\nSUCCESS: Login returned a token.');
        } else {
            console.log('\nFAILURE: Login did not return a token.');
        }
    } catch (err) {
        console.error('Login failed:', err.message);
    }
}

run();
