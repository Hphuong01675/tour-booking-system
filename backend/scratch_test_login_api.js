const axios = require('axios');

async function testLogin() {
    try {
        console.log('Sending login request to http://localhost:8080/api/auth/login...');
        const response = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'trung@gmail.com',
            password: '123456'
        });
        console.log('Login Response:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Login Failed Status:', error.response.status);
            console.error('Login Failed Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testLogin();
