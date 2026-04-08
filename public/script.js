let currentUser = null;

function navigateTo(hash) {
    window.location.hash = hash; // Updates the URL hash (e.g., changes it to #/login)
}

function handleRouting() {
    // 1. Read the current hash, or default to '#/' if it's empty
    let currentHash = window.location.hash;
    if (!currentHash) {
        currentHash = '#/';
        window.location.hash = currentHash; // Set hash to #/ if empty on page load
    }

    if (currentHash === '#/logout') {
        // 1. Clear the JWT token from sessionStorage
        sessionStorage.removeItem('authToken');
        
        // 2. Call setAuthState(false)
        setAuthState(false);
        
        // 3. Navigate to home
        showToast('Successfully logged out.', 'info');
        navigateTo('#/');
        
        return; 
    }

    // 2. Hide all page elements
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => {
        page.classList.remove('active');
    });

    // 3. Show the matching page
    // Convert the hash (e.g., '#/login') to match your section IDs ('login-page')
    let targetId = currentHash === '#/' ? 'home-page' : currentHash.replace('#/', '') + '-page';
    
    // ==========================================
    // NEW: FRONTEND SECURITY GUARD
    // ==========================================
    const adminOnlyPages = ['accounts-page', 'departments-page', 'employees-page'];
    
    // If they are trying to access an admin page...
    if (adminOnlyPages.includes(targetId)) {
        // Check if they are NOT logged in OR if they are NOT an admin
        if (!currentUser || currentUser.role.toLowerCase() !== 'admin') {
            showToast('Access Denied: Admin privileges required.', 'danger');
            navigateTo('#/profile'); // Kick them to their profile instead
            return; // Immediately stop loading the page
        }
    }
    // ==========================================    
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');

            if (targetId === 'verify-email-page') {
            const pendingEmail = localStorage.getItem('unverified_email');
            if (pendingEmail) {
                document.getElementById('verify-email-msg').innerHTML = `✅ A verification link has been sent to <strong>${pendingEmail}</strong>`;
            }
        }

        // ////phase 5
        // if (targetId === 'profile-page') {
        //     renderProfile();
        // }

        // ////phase 6B
        // if (targetId === 'departments-page') {
        //     renderDepartmentsTable();
        // }

        // ////phase 6A
        // if (targetId === 'accounts-page') {
        //     renderAccountsTable();
        // }
        // ////phase 6C
        // if (targetId === 'employees-page') {
        //     renderEmployeesTable();
        // }

        // Final Challenge: Router Object mapping routes to functions
        const routeRenderers = {
            'profile-page': renderProfile,
            'departments-page': renderDepartmentsTable,
            'accounts-page': renderAccountsTable,
            'employees-page': renderEmployeesTable,
            'requests-page': renderRequestsTable
        };

        // If the targetId exists in our object, run its attached function!
        if (routeRenderers[targetId]) {
            routeRenderers[targetId]();
        }

    } else {
        // Fallback just in case they type a URL that doesn't exist
        document.getElementById('home-page').classList.add('active'); 
    }
    
    console.log("Navigating to:", currentHash); // Just to test that it's working!
}

// 4. Add the event listener to call handleRouting() whenever the hash changes
window.addEventListener('hashchange', handleRouting);

// 5. Run it once immediately when the page first loads
handleRouting();

// This acts as your boolean toggle
function setAuthState(isAuth, user) {
    currentUser = isAuth ? user : null;

    if (isAuth) {
        // User is logged in
        document.body.classList.remove('not-authenticated');
        document.body.classList.add('authenticated');
        
        // FIX: Use .toLowerCase() to match the backend's 'admin' role exactly
        if (user && user.role.toLowerCase() === 'admin') {
            document.body.classList.add('is-admin');
        }
        
        // FIX: The backend only sends 'username', so we use that instead of firstName/lastName
        document.getElementById('navbar-user-name').textContent = user.username;
    } else {
        // User is logged out
        document.body.classList.remove('authenticated');
        document.body.classList.remove('is-admin');
        document.body.classList.add('not-authenticated');
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Phase 3A: Registration

// Safety setup: Initialize a temporary database object if it doesn't exist yet
// if (!window.db) {
//     window.db = { accounts: [] };
// }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Phase 4: Data Persistence with localStorage
const STORAGE_KEY = 'ipt_demo_v1'; // 

function loadFromStorage() { //
    const storedData = localStorage.getItem(STORAGE_KEY);
    
    if (storedData) {
        try {
            window.db = JSON.parse(storedData); // [cite: 232]
        } catch (e) {
            console.error("Corrupt data found. Resetting database.");
            seedDatabase(); // [cite: 233]
        }
    } else {
        seedDatabase(); // [cite: 233]
    }
}

function seedDatabase() {
    window.db = {
        accounts: [
            { // 
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                password: 'Password123!',
                role: 'Admin',
                verified: true
            }
        ],
        departments: [ // [cite: 235]
            { name: 'Engineering', description: 'Software team' },
            { name: 'HR', description: 'Human Resources' }
        ],
        employees: [],
        requests: []
    };
    saveToStorage();
}

function saveToStorage() { // 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

// Call loadFromStorage() on init to load the database 
loadFromStorage();

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Phase 3A: Registration (CONNECTED TO BACKEND)
document.getElementById('reg-submit-btn').addEventListener('click', async function() {
    const firstName = document.getElementById('reg-firstname').value.trim();
    const lastName = document.getElementById('reg-lastname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (password.length < 6) return showToast('Password must be at least 6 characters.', 'danger');
    if (!firstName || !lastName || !email) return showToast('Please fill in all fields.', 'danger');

    try {
        // Send registration to the Node.js backend
        const response = await fetch('http://localhost:4000/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title: 'User',
                firstName: firstName,
                lastName: lastName,
                email: email, // Use the correct key name!
                password: password,
                confirmPassword: password, // Fake confirmPassword since form only has one password field
                role: 'User'
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Registration successful! You may now log in.', 'success');
            navigateTo('#/login');
            
            // Clear the form
            document.getElementById('reg-firstname').value = '';
            document.getElementById('reg-lastname').value = '';
            document.getElementById('reg-email').value = '';
            document.getElementById('reg-password').value = '';
        } else {
            showToast('Registration failed: ' + data.error, 'danger');
        }
    } catch (err) {
        console.error(err);
        showToast('Network error: Cannot reach the backend.', 'danger');
    }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Phase 3B: Email Verification (Simulated)
document.getElementById('simulate-verify-btn').addEventListener('click', function() {
    // 1. Find account by unverified_email
    const unverifiedEmail = localStorage.getItem('unverified_email');
    
    // Safety check to make sure the database and accounts array exist (set up fully in Phase 4)
    if (unverifiedEmail && window.db && window.db.accounts) {
        const account = window.db.accounts.find(acc => acc.email === unverifiedEmail);
        
        if (account) {
            // 2. Set verified to true
            account.verified = true;
            
            // 3. Save to storage
            localStorage.setItem('ipt_demo_v1', JSON.stringify(window.db));
            
            // Clean up the temporary email storage
            localStorage.removeItem('unverified_email');
            
            showToast('Email verified! You may now log in.','success');
            
            // 4. Navigate to login
            navigateTo('#/login');
        }
    } else {
        showToast('No unverified account found in storage. Please register first.', 'warning');
    }
});

// Optional: Hook up the "Go to Login" cancel button just in case
document.getElementById('go-to-login-btn').addEventListener('click', function() {
    navigateTo('#/login');
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Phase 3C: Login System (CONNECTED TO BACKEND)
document.getElementById('login-submit-btn').addEventListener('click', async function() {
    // 1. Get the form values
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    try {
        // 2. Send the data to your Node.js backend
        const response = await fetch('http://localhost:4000/users/authenticate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: email,     // <--- Changed 'username' to 'email' to match backend!
                password: password 
            })
        });

        const data = await response.json();

        if (response.ok) {
            // 3. Save the real JWT token in sessionStorage
            sessionStorage.setItem('authToken', data.token);
            
            // 4. Update the UI state using your existing function
            // We pass the data we got back from the database
            setAuthState(true, { username: data.firstName + ' ' + data.lastName, email: data.email, role: data.role });
            
            // 5. Navigate to profile
            showToast('Login successful!', 'success');
            navigateTo('#/profile');
        } else {
            // Backend returned an error (e.g., wrong password)
            // Changed data.error to data.message to match your backend error handler!
            showToast('Login failed: ' + (data.message || 'Invalid credentials'), 'danger');
        }
    } catch (err) {
        console.error(err);
        showToast('Network error: Is the backend server running?', 'danger');
    }
});

// Helper function to get the token for secure requests
function getAuthHeader() {
    const token = sessionStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Example: Fetch secure admin data from the backend
async function loadAdminDashboard() {
    try {
        const res = await fetch('http://localhost:3000/api/admin/dashboard', {
            method: 'GET',
            headers: getAuthHeader() // <--- Showing our ID badge!
        });

        const data = await res.json();

        if (res.ok) {
            showToast('Success! ' + data.message, 'success');
            console.log('Secret Admin Data:', data.data);
        } else {
            // If we are just a 'user' or not logged in, this will run
            showToast('Access denied! ' + data.error, 'danger');
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

// Hook up the Cancel button to return home
document.getElementById('login-cancel-btn').addEventListener('click', function() {
    navigateTo('#/');
});

// Phase 5: Profile Page
function renderProfile() {
    // Safety check to ensure someone is actually logged in
    if (!currentUser) return; 

    // FIX: Update the DOM with the new backend properties (username and role)
    document.getElementById('profile-name').textContent = currentUser.username;
    // Since our simple backend doesn't have emails yet, we'll just display the username here too
    document.getElementById('profile-email').textContent = currentUser.username; 
    document.getElementById('profile-role').textContent = currentUser.role;
}

// Attach the alert to the Edit Profile button
document.getElementById('profile-edit-btn').addEventListener('click', function() {
    showToast('Edit Profile functionality coming soon!', 'info');
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Phase 6A: Accounts (CONNECTED TO MYSQL)
async function renderAccountsTable() {
    const listContainer = document.getElementById('accounts-list');
    listContainer.innerHTML = '<p class="p-3">Loading accounts from database...</p>'; 
    
    try {
        // 1. Fetch all users from your TypeScript backend
        const response = await fetch('http://localhost:4000/users', {
            method: 'GET',
            headers: getAuthHeader() // Send our JWT token!
        });

        if (!response.ok) throw new Error('Failed to fetch accounts');
        const users = await response.json();

        listContainer.innerHTML = ''; // Clear loading text
        
        // 2. Loop through MySQL users and render them
        users.forEach(acc => {
            const row = document.createElement('div');
            row.className = 'row row-cols-5 ms-4 mt-3 me-4 align-items-center text-center';
            
            // Notice we are using acc.id for the data attributes now!
            row.innerHTML = `
                <div><p class="fs-5"><strong>${acc.firstName} ${acc.lastName}</strong></p></div>
                <div><p class="fs-5"><strong>${acc.email}</strong></p></div>
                <div><p class="fs-5"><strong>${acc.role}</strong></p></div>
                <div><p class="fs-5"><strong>✅</strong></p></div>
                <div>
                    <button data-action="edit" data-id="${acc.id}" class="ms-3 rounded p-2 mb-3" style="border: 3px solid rgb(0, 106, 193); color:rgb(0, 106, 193); background-color: white;"><strong>Edit</strong></button>
                    <button data-action="delete" data-id="${acc.id}" class="ms-3 rounded p-2 mb-3" style="border: 3px solid rgb(193, 45, 0); color:rgb(193, 45, 0); background-color: white;"><strong>Delete</strong></button>
                </div>
            `;
            listContainer.appendChild(row);
        });
    } catch (error) {
        console.error(error);
        listContainer.innerHTML = '<p class="p-3 text-danger">Error loading accounts.</p>';
    }
}

    // Final Challenge: Event Delegation for Accounts List
    document.getElementById('accounts-list').addEventListener('click', function(e) {
        // Check if what we clicked is a button (or inside a button)
        const btn = e.target.closest('button');
        if (!btn) return;

        // Read our custom data attributes
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id'); // <--- CHANGED TO ID

        // Route the click to the correct function
        if (action === 'edit') window.editAccount(email);
        if (action === 'reset') window.resetAccountPassword(email);
        if (action === 'delete') window.deleteAccount(email);
    });

// Action: Reset Password [cite: 251]
window.resetAccountPassword = function(email) {
    const newPassword = prompt("Enter new password (min 6 characters):");
    if (newPassword && newPassword.length >= 6) {
        const acc = window.db.accounts.find(a => a.email === email);
        if (acc) {
            acc.password = newPassword;
            saveToStorage();
            showToast("Password updated successfully.", "success");
        }
    } else if (newPassword) {
        showToast("Password must be at least 6 characters.", "danger"   );
    }
};

// Action: Delete Account (CONNECTED TO MYSQL)
window.deleteAccount = async function(id) {
    if (confirm("Are you sure you want to delete this account?")) {
        try {
            const response = await fetch(`http://localhost:4000/users/${id}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });

            if (response.ok) {
                showToast("Account deleted successfully.", "success");
                renderAccountsTable(); // Refresh the table from the DB
            } else {
                const data = await response.json();
                showToast("Failed to delete: " + data.message, "danger");
            }
        } catch (error) {
            showToast("Network error while deleting.", "danger");
        }
    }
};

// Phase 6A Part 2: Edit and Save Accounts
window.editAccount = function(email) {
    const acc = window.db.accounts.find(a => a.email === email);
    if (acc) {
        // Pre-fill the form with the selected user's data
        document.getElementById('acc-first').value = acc.firstName;
        document.getElementById('acc-last').value = acc.lastName;
        document.getElementById('acc-email').value = acc.email;
        document.getElementById('acc-password').value = acc.password;
        document.getElementById('acc-role').value = acc.role;
        document.getElementById('acc-verified').checked = acc.verified;
        
        // Scroll down to the form
        window.scrollTo(0, document.body.scrollHeight); 
    }
};

document.getElementById('save-account-btn').addEventListener('click', function() {
    const firstName = document.getElementById('acc-first').value.trim();
    const lastName = document.getElementById('acc-last').value.trim();
    const email = document.getElementById('acc-email').value.trim();
    const password = document.getElementById('acc-password').value;
    const role = document.getElementById('acc-role').value.trim() || 'User';
    const verified = document.getElementById('acc-verified').checked;

    if (!firstName || !lastName || !email || !password) {
        return showToast('Please fill all text fields.', 'warning');
    }

    const existingAcc = window.db.accounts.find(a => a.email === email);
    if (existingAcc) {
        // Update existing account
        existingAcc.firstName = firstName;
        existingAcc.lastName = lastName;
        existingAcc.password = password;
        existingAcc.role = role;
        existingAcc.verified = verified;
        showToast('Account updated successfully.', 'success');
    } else {
        // Add new account
        window.db.accounts.push({ firstName, lastName, email, password, role, verified });
        showToast('New account created.', 'success');
    }
    
    saveToStorage();
    renderAccountsTable();
    document.getElementById('cancel-account-btn').click(); // Clear the form
});

// Clear form on Cancel
document.getElementById('cancel-account-btn').addEventListener('click', function() {
    document.getElementById('acc-first').value = '';
    document.getElementById('acc-last').value = '';
    document.getElementById('acc-email').value = '';
    document.getElementById('acc-password').value = '';
    document.getElementById('acc-role').value = '';
    document.getElementById('acc-verified').checked = false;
});


////////////////////////////////////////////////////////////////////////

// ==========================================
// Phase 6B: Departments (CONNECTED TO MYSQL)
// ==========================================

async function renderDepartmentsTable() {
    const listContainer = document.getElementById('departments-list');
    listContainer.innerHTML = '<p class="p-3 fs-5">Loading departments from database...</p>'; 
    
    try {
        // 1. Fetch departments from Node.js
        const response = await fetch('http://localhost:4000/departments', {
            method: 'GET',
            headers: getAuthHeader() // Send our security badge
        });

        if (!response.ok) throw new Error('Failed to fetch departments');
        const departments = await response.json();

        listContainer.innerHTML = ''; 

        // 2. Handle empty state
        if (departments.length === 0) {
            listContainer.innerHTML = '<p class="p-3 fs-5 text-muted">No departments found. Add one above!</p>';
            return;
        }

        // 3. Render the MySQL data
        departments.forEach(dept => {
            const row = document.createElement('div');
            row.className = 'row ms-4 mt-3 me-4 align-items-center text-center border-bottom pb-3';
            row.innerHTML = `
                <div class="col-4"><p class="fs-5 mb-0"><strong>${dept.name}</strong></p></div>
                <div class="col-4"><p class="fs-5 mb-0"><strong>${dept.description}</strong></p></div>
                <div class="col-4">
                    <button class="ms-3 rounded p-2" style="border: 3px solid rgb(193, 45, 0); color:rgb(193, 45, 0); background-color: white;" onclick="deleteDepartment(${dept.id})">
                        <strong>Delete</strong>
                    </button>
                </div>
            `;
            listContainer.appendChild(row);
        });
    } catch (error) {
        console.error(error);
        listContainer.innerHTML = '<p class="p-3 text-danger">Error loading departments.</p>';
    }
}

// 4. Create a New Department (POST)
// Note: We use prompts here for a quick UI, but you could build a modal later!
document.getElementById('add-dept-btn').addEventListener('click', async function() {
    const name = prompt("Enter the new Department Name:");
    if (!name) return; // User clicked cancel
    
    const description = prompt("Enter a short description:");
    if (!description) return;

    try {
        const headers = getAuthHeader();
        headers['Content-Type'] = 'application/json';

        const response = await fetch('http://localhost:4000/departments', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ name, description })
        });

        if (response.ok) {
            showToast('Department added successfully!', 'success');
            renderDepartmentsTable(); // Refresh the table
        } else {
            showToast('Failed to add department.', 'danger');
        }
    } catch (err) {
        showToast('Network error while saving.', 'danger');
    }
});

// 5. Delete a Department (DELETE)
window.deleteDepartment = async function(id) {
    if (confirm("Are you sure you want to delete this department?")) {
        try {
            const response = await fetch(`http://localhost:4000/departments/${id}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });

            if (response.ok) {
                showToast("Department deleted.", "success");
                renderDepartmentsTable(); // Refresh the table
            } else {
                showToast("Failed to delete.", "danger");
            }
        } catch (error) {
            showToast("Network error.", "danger");
        }
    }
};

// ==========================================
// Phase 6C: Employees (CONNECTED TO MYSQL)
// ==========================================

async function renderEmployeesTable() {
    const listContainer = document.getElementById('employees-list');
    listContainer.innerHTML = '<p class="p-3 fs-5">Loading employees...</p>'; 
    
    try {
        // 1. Fetch Employees AND Departments simultaneously!
        const [empRes, deptRes] = await Promise.all([
            fetch('http://localhost:4000/employees', { headers: getAuthHeader() }),
            fetch('http://localhost:4000/departments', { headers: getAuthHeader() })
        ]);

        const employees = await empRes.json();
        const departments = await deptRes.json();

        // 2. Render Employees
        listContainer.innerHTML = ''; 
        if (employees.length === 0) {
            listContainer.innerHTML = '<p class="p-3 fs-5 text-muted">No employees found.</p>';
        } else {
            employees.forEach(emp => {
                const row = document.createElement('div');
                row.className = 'd-flex flex-row justify-content-around ms-4 mt-3 me-4 align-items-center text-center border-bottom pb-3';
                row.innerHTML = `
                    <div style="width: 20%;"><p class="fs-5 mb-0"><strong>${emp.empId}</strong></p></div>
                    <div style="width: 20%;"><p class="fs-5 mb-0"><strong>${emp.email}</strong></p></div>
                    <div style="width: 20%;"><p class="fs-5 mb-0"><strong>${emp.position}</strong></p></div>
                    <div style="width: 20%;"><p class="fs-5 mb-0"><strong>${emp.department}</strong></p></div>
                    <div style="width: 20%;">
                        <button class="rounded p-2" style="border: 3px solid rgb(193, 45, 0); color:rgb(193, 45, 0); background-color: white;" onclick="deleteEmployee(${emp.id})">
                            <strong>Delete</strong>
                        </button>
                    </div>
                `;
                listContainer.appendChild(row);
            });
        }

        // 3. Populate Department Dropdown dynamically from MySQL
        const deptSelect = document.getElementById('emp-dept');
        deptSelect.innerHTML = '<option value="">Select Department...</option>';
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.name;
            option.textContent = dept.name;
            deptSelect.appendChild(option);
        });

    } catch (err) {
        listContainer.innerHTML = '<p class="p-3 text-danger">Error loading data.</p>';
    }
}

// Save Employee (POST)
document.getElementById('save-emp-btn').addEventListener('click', async function() {
    const empId = document.getElementById('emp-id').value.trim();
    const email = document.getElementById('emp-email').value.trim();
    const position = document.getElementById('emp-position').value.trim();
    const department = document.getElementById('emp-dept').value;
    const hireDate = document.getElementById('emp-hire-date').value;

    if (!empId || !email || !position || !department || !hireDate) {
        return showToast('Fill all fields.', 'warning');
    }

    try {
        const response = await fetch('http://localhost:4000/employees', {
            method: 'POST',
            headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ empId, email, position, department, hireDate })
        });

        if (response.ok) {
            showToast('Employee saved to database!', 'success');
            renderEmployeesTable(); // Refresh UI
            // Clear inputs
            document.querySelectorAll('#employees-page input').forEach(input => input.value = '');
            document.getElementById('emp-dept').value = '';
        } else {
            showToast('Failed to save employee.', 'danger');
        }
    } catch (err) {
        showToast('Network error.', 'danger');
    }
});

// Delete Employee (DELETE)
window.deleteEmployee = async function(id) {
    if (confirm('Delete this employee?')) {
        try {
            const response = await fetch(`http://localhost:4000/employees/${id}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });

            if (response.ok) {
                showToast('Employee deleted.', 'success');
                renderEmployeesTable(); // Refresh UI
            } else {
                showToast('Failed to delete.', 'danger');
            }
        } catch (err) {
            showToast('Network error.', 'danger');
        }
    }
};

// ==========================================
// Phase 7: User Requests (CONNECTED TO MYSQL)
// ==========================================

async function renderRequestsTable() {
    const listContainer = document.getElementById('requests-list');
    listContainer.innerHTML = '<p class="p-3 fs-5">Loading requests...</p>'; 
    if (!currentUser) return;

    try {
        const response = await fetch('http://localhost:4000/requests', {
            method: 'GET',
            headers: getAuthHeader()
        });

        if (!response.ok) throw new Error('Failed to fetch requests');
        const allRequests = await response.json();

        // Filter requests so users only see their own
        const myRequests = allRequests.filter(req => req.employeeEmail === currentUser.email);

        listContainer.innerHTML = ''; 
        if (myRequests.length === 0) {
            listContainer.innerHTML = '<p class="lead fs-5 mt-3 ms-3">You have no requests yet.</p>';
            return;
        }

        myRequests.forEach(req => {
            let badgeColor = req.status === 'Approved' ? 'bg-success' : req.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark';
            
            // Format our JSON items back into a readable string
            const itemsArray = typeof req.items === 'string' ? JSON.parse(req.items) : req.items;
            const itemsString = itemsArray.map(i => `${i.qty}x ${i.name}`).join(', ');

            const row = document.createElement('div');
            row.className = 'border p-3 mb-3 ms-3 rounded shadow-sm';
            row.style.borderColor = 'lightgray';
            row.innerHTML = `
                <p class="fs-4 mb-1"><strong>${req.type}</strong> <span class="badge ${badgeColor} ms-2">${req.status}</span></p>
                <p class="fs-5 mb-1 text-muted">Date: ${req.date}</p>
                <p class="fs-5 mb-0">Items: ${itemsString}</p>
            `;
            listContainer.appendChild(row);
        });
    } catch (err) {
        listContainer.innerHTML = '<p class="p-3 text-danger">Error loading requests.</p>';
    }
}

// Add dynamic item row
document.getElementById('add-item-btn').addEventListener('click', function() {
    const container = document.getElementById('req-items-container');
    const newRow = document.createElement('div');
    newRow.className = 'row g-2 align-items-center text-center req-item-row mb-2';
    newRow.innerHTML = `
        <div class="ms-3 col-6"><input type="text" class="form-control p-3 item-name fs-5" placeholder="Item Name"></div>    
        <div class="col-3"><input type="number" class="form-control p-3 item-qty fs-5" placeholder="Qty" value="1"></div>   
        <div class="col-2"><button type="button" class="btn btn-danger remove-item-btn fs-5 p-2 w-100">X</button></div>
    `;
    container.appendChild(newRow);
});

// Remove item row (Using Event Delegation)
document.getElementById('req-items-container').addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-item-btn')) {
        e.target.closest('.req-item-row').remove();
    }
});

// Submit Request
// Submit Request (POST)
document.getElementById('submit-request-btn').addEventListener('click', async function(e) {
    const type = document.getElementById('req-type').value;
    const itemRows = document.querySelectorAll('.req-item-row');
    const items = [];

    // Loop through all dynamic rows and grab the data
    itemRows.forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const qty = row.querySelector('.item-qty').value;
        if (name) items.push({ name, qty });
    });

    if (items.length === 0) {
        return showToast('Validation Error: You must include at least one item.', 'danger');
    }

    const newRequest = {
        type: type,
        items: items,
        status: "Pending",
        date: new Date().toLocaleDateString(),
        employeeEmail: currentUser.email
    };

    try {
        const response = await fetch('http://localhost:4000/requests', {
            method: 'POST',
            headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(newRequest)
        });

        if (response.ok) {
            showToast('Request submitted successfully!', 'success');
            renderRequestsTable(); // Refresh UI
            
            // Reset the modal inputs for next time
            document.querySelectorAll('.item-name').forEach(input => input.value = '');
            document.querySelectorAll('.item-qty').forEach(input => input.value = '1');
        } else {
            showToast('Failed to submit request.', 'danger');
        }
    } catch (err) {
        showToast('Network error.', 'danger');
    }
});

///////////////////////////////////////////////////////////////////////////////////////////

// Phase 8: UX Polish - Toast Notifications
function showToast(message, type = 'success') {
const toastEl = document.getElementById('app-toast');
const toastMessage = document.getElementById('toast-message');

// 1. Set the text
toastMessage.textContent = message;

// 2. Reset the background color
toastEl.className = 'toast align-items-center text-white border-0';

// 3. Apply the right Bootstrap color class
if (type === 'success') toastEl.classList.add('bg-success');
if (type === 'danger') toastEl.classList.add('bg-danger');
if (type === 'warning') toastEl.classList.add('bg-warning', 'text-dark');
if (type === 'info') toastEl.classList.add('bg-info', 'text-dark');

// 4. Trigger the toast using Bootstrap's JS API
const toast = new bootstrap.Toast(toastEl);
toast.show();
}

