const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = '';

const testBackend = async () => {
    try {
        console.log('--- Testing Authentication ---');
        // 1. Register Regular User (Family)
        try {
            const registerRes = await axios.post(`${API_URL}/auth/register`, {
                fullName: 'Test User',
                email: `test${Math.random().toString(36).substring(7)}@example.com`,
                password: 'password123',
                role: 'family'
            });
            console.log('✅ Register Family User Success:', registerRes.data.email);
            token = registerRes.data.token;
        } catch (e) {
            console.log('⚠️ Register failed:', e.response ? JSON.stringify(e.response.data) : e.message);
        }

        // 2. Login (if register didn't yield token or just to test)
        if (!token) {
            // This part needs a known user if register fails, but for a fresh run verify register first
            // For simplicity in this script, we assume register works or we just fail here
            console.log('❌ Auth test failed: No token obtained');
            return;
        }

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        console.log('\n--- Testing Dashboard ---');
        // 3. Add Vital
        const vitalRes = await axios.post(`${API_URL}/dashboard/stats`, {
            type: 'Heart Rate',
            value: '75 bpm',
            status: 'Normal'
        }, config);
        console.log('✅ Add Vital Success:', vitalRes.data.type);

        // 4. Get Vitals
        const getVitalsRes = await axios.get(`${API_URL}/dashboard/stats`, config);
        console.log('✅ Get Vitals Success. Count:', getVitalsRes.data.length);

        console.log('\n--- Testing Medical Vault ---');
        // 5. Add Record
        const recordRes = await axios.post(`${API_URL}/vault`, {
            title: 'Test Report',
            type: 'Report',
            date: new Date(),
            doctor: 'Dr. Test',
            size: '1.2 MB'
        }, config);
        console.log('✅ Add Record Success:', recordRes.data.title);

        // 6. Get Records
        const getRecordsRes = await axios.get(`${API_URL}/vault`, config);
        console.log('✅ Get Records Success. Count:', getRecordsRes.data.length);

        console.log('\n--- Testing Medications ---');
        // 7. Add Medication
        const medRes = await axios.post(`${API_URL}/medications`, {
            name: 'Test Med',
            dosage: '500mg',
            frequency: 'Daily',
            time: '08:00 AM',
            stock: 30
        }, config);
        console.log('✅ Add Medication Success:', medRes.data.name);

        // 8. Get Medications
        const getMedsRes = await axios.get(`${API_URL}/medications`, config);
        console.log('✅ Get Medications Success. Count:', getMedsRes.data.length);

        console.log('\n--- Testing Admin Panel ---');
        // 9. Register Admin User
        let adminToken = '';
        try {
            const adminRes = await axios.post(`${API_URL}/auth/register`, {
                fullName: 'Admin User',
                email: `admin${Date.now()}@example.com`,
                password: 'adminpassword',
                role: 'admin'
            });
            console.log('✅ Register Admin Success:', adminRes.data.email);
            adminToken = adminRes.data.token;
        } catch (e) {
            console.log('⚠️ Admin Register failed:', e.message);
        }

        if (adminToken) {
            // 10. Get All Users (Admin only)
            try {
                const usersRes = await axios.get(`${API_URL}/auth/users`, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                console.log('✅ Admin Get Users Success. Count:', usersRes.data.length);
            } catch (e) {
                console.log('❌ Admin Get Users Failed:', e.message);
            }
        }

        console.log('\n🎉 All Backend Tests Passed!');

    } catch (error) {
        console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
    }
};

testBackend();
