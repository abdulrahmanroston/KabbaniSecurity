const SPREADSHEET_ID = '1FQVhuYHqkUA4_YDQjyuHek2UY0Qm5n-xcRdfKRJ0tUM';
let API_KEY = localStorage.getItem('userApiKey') || '';

function getApiKey() {
    return new Promise((resolve) => {
        if (!API_KEY) {
            const storedApiKey = localStorage.getItem('userApiKey');
            if (storedApiKey) {
                API_KEY = storedApiKey;
                resolve(API_KEY);
            } else {
                resolve('');
            }
        } else {
            resolve(API_KEY);
        }
    });
}

// Show/hide note field based on time input
function toggleNoteField(timeInput, noteSelect) {
    timeInput.addEventListener('input', function () {
        if (timeInput.value) {
            noteSelect.style.display = 'block';
        } else {
            noteSelect.style.display = 'none';
        }
    });
}

// Get default time for a given shift
function getDefaultTimeForShift(shift, shiftsData) {
    if (shiftsData && shiftsData[shift] && shiftsData[shift]['Detail']) {
        return shiftsData[shift]['Detail'].split('-')[0].trim();
    }
    return '';
}

// Create form for each employee
function createEmployeeForm(employee, settingsData, shiftsData) {
    const form = document.createElement('form');
    form.classList.add('form');
    const formActionUrl = 'https://script.google.com/macros/s/AKfycbwnWX9zv9bU1YWo1jiKY6nTIHZyi7Rz7jpLgGlvVkdQN65Lh3zvQ8Jo5hfAgfl9KLYI2Q/exec';

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = form.querySelector('.button');
        submitButton.classList.add('loading');
        submitButton.textContent = '';

        const formData = new FormData(form);
        const dateInput = form.querySelector('.input1');
        if (dateInput && dateInput.value) {
            const dateOnly = dateInput.value;
            formData.set('date', dateOnly);
        }

        try {
            const response = await fetch(formActionUrl, {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            });

            submitButton.classList.remove('loading');
            submitButton.textContent = 'تم التسجيل';
            submitButton.disabled = true;

            console.log('Data submitted successfully:', response);
        } catch (error) {
            submitButton.classList.remove('loading');
            submitButton.textContent = 'تسجيل';
            console.error('Error submitting data:', error);
            alert('حدث خطأ أثناء إرسال البيانات، يرجى المحاولة مرة أخرى.');
        }
    });

    const submitByInput = document.createElement('input');
    submitByInput.type = 'hidden';
    submitByInput.name = 'Submit By';
    submitByInput.value = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).name : 'غير محدد';
    form.appendChild(submitByInput);

    const branchSelect = document.createElement('select');
    branchSelect.classList.add('select-branch');
    branchSelect.name = 'Branch';
    const defaultBranch = employee['Branch'] || Object.keys(settingsData)[0] || '';
    const branchFragment = document.createDocumentFragment();
    Object.keys(settingsData).forEach(branch => {
        const option = document.createElement('option');
        option.value = branch;
        option.textContent = branch;
        if (branch === defaultBranch) option.selected = true;
        branchFragment.appendChild(option);
    });
    branchSelect.appendChild(branchFragment);

    const shiftSelect = document.createElement('select');
    shiftSelect.classList.add('select-shift');
    shiftSelect.name = 'Shift';
    const defaultShift = employee['Shift'] || Object.keys(shiftsData)[0] || '';
    const shiftFragment = document.createDocumentFragment();
    Object.keys(shiftsData).forEach(shift => {
        const option = document.createElement('option');
        option.value = shift;
        option.textContent = shift;
        if (shift === defaultShift) option.selected = true;
        shiftFragment.appendChild(option);
    });
    shiftSelect.appendChild(shiftFragment);

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.classList.add('input1');
    dateInput.id = `date-${employee['Code']}`;
    dateInput.name = 'date';
    dateInput.value = new Date().toISOString().split('T')[0];

    const timeInput = document.createElement('input');
    timeInput.type = 'time';
    timeInput.classList.add('input2');
    timeInput.id = `time-${employee['Code']}`;
    timeInput.name = 'time';
    timeInput.value = getDefaultTimeForShift(defaultShift, shiftsData);

    const noteSelect = document.createElement('select');
    noteSelect.classList.add('note-select');
    noteSelect.name = 'Note';
    noteSelect.style.display = 'none';
    const noteOptions = ['تأخير بأذن مسبق', 'تأخير بدون إذن'];
    const noteFragment = document.createDocumentFragment();
    noteOptions.forEach(optionText => {
        const option = document.createElement('option');
        option.value = optionText;
        option.textContent = optionText;
        noteFragment.appendChild(option);
    });
    noteSelect.appendChild(noteFragment);

    const submitDiv = document.createElement('div');
    submitDiv.classList.add('bt-sub');
    const submitButton = document.createElement('button');
    submitButton.classList.add('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'تسجيل';
    submitDiv.appendChild(submitButton);

    const nameInput = document.createElement('input');
    nameInput.type = 'hidden';
    nameInput.name = 'Name';
    nameInput.value = employee['Name'] || 'غير محدد';
    form.appendChild(nameInput);

    form.appendChild(branchSelect);
    form.appendChild(shiftSelect);
    form.appendChild(dateInput);
    form.appendChild(timeInput);
    form.appendChild(noteSelect);
    form.appendChild(submitDiv);

    toggleNoteField(timeInput, noteSelect);

    return form;
}

// Create data section for each employee
function createEmployeeData(employee) {
    const dataDiv = document.createElement('div');
    dataDiv.classList.add('data');
    // Convert values to numbers and handle invalid cases
    const workDays = parseInt(employee['Work Days']) || 0;
    const lastHoliday = employee['Last Holiday'] === 'لا توجد' ? 0 : parseInt(employee['Last Holiday']) || 0;
    const totalDelay = parseInt(employee['Total delay']) || 0;
    
    dataDiv.innerHTML = `
        <div class="day"><p>أيام العمل</p><span>${workDays}</span></div>
        <div class="break"><p>آخر إجازة منذ</p><span>${lastHoliday}</span></div>
        <div class="hours"><p>التأخير بالساعات</p><span>${totalDelay}</span></div>
    `;
    return dataDiv;
}

// Render employees in the UI
function renderEmployees(employeesData) {
    const atendBox = document.querySelector('.atend-box');
    if (!atendBox) {
        console.error('Element .atend-box not found');
        return;
    }

    const settingsData = JSON.parse(localStorage.getItem('settingsData')) || {};
    const shiftsData = JSON.parse(localStorage.getItem('shiftsData')) || {};

    const employees = Array.isArray(employeesData) ? employeesData : Object.values(employeesData);

    atendBox.innerHTML = '';

    const fragment = document.createDocumentFragment();
    employees.forEach(employee => {
        const personDiv = document.createElement('div');
        personDiv.classList.add('person');

        const nameDiv = document.createElement('div');
        nameDiv.classList.add('name');
        nameDiv.textContent = employee['Name'] || 'غير محدد';
        personDiv.appendChild(nameDiv);

        const form = createEmployeeForm(employee, settingsData, shiftsData);
        personDiv.appendChild(form);

        const dataDiv = createEmployeeData(employee);
        personDiv.appendChild(dataDiv);

        fragment.appendChild(personDiv);
    });

    atendBox.appendChild(fragment);
    console.log('Data rendered:', employeesData);
}

// Fetch settings data from Settings sheet
async function fetchSettingsData(apiKey) {
    const range = 'Settings!B7:E11';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (!data.values || data.values.length === 0) throw new Error('No data in settings range');
        const rows = data.values;
        const settingsData = {};
        const headers = ['Branch', 'From', 'To'];
        rows.forEach(row => {
            if (row[0]) {
                const branch = row[0];
                settingsData[branch] = { From: row[1] || '', To: row[2] || '' };
            }
        });
        localStorage.setItem('settingsData', JSON.stringify(settingsData));
        return settingsData;
    } catch (error) {
        console.error('Error fetching settings data:', error.message);
        return null;
    }
}

// Fetch shifts data from Settings sheet
async function fetchShiftsData(apiKey) {
    const range = 'Settings!B22:C36';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (!data.values || data.values.length === 0) throw new Error('No data in shifts range');
        const rows = data.values;
        const shiftsData = {};
        rows.forEach(row => {
            if (row[0]) {
                const shift = row[0];
                shiftsData[shift] = { Detail: row[1] || '' };
            }
        });
        localStorage.setItem('shiftsData', JSON.stringify(shiftsData));
        return shiftsData;
    } catch (error) {
        console.error('Error fetching shifts data:', error.message);
        return null;
    }
}

// Fetch attendance data from Employees sheet
async function fetchAttendanceData(apiKey) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Employees!A1:M?key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (!data.values || data.values.length === 0) throw new Error('No data in the sheet');
        const rows = data.values;
        const formattedData = {};
        const headers = ['Code', 'Name', 'Branch', 'Shift', 'Work Days', 'Last Holiday', 'Vacation Every', 'Vacation Duration', 'Count Holidays', 'Total delay', 'Absence', 'Note', 'Image'];
        const employees = rows.slice(1);

        employees.forEach(employee => {
            const employeeObj = {};
            headers.forEach((header, index) => {
                let value = employee[index] || '';
                // Convert numeric fields to numbers
                if (['Work Days', 'Last Holiday', 'Vacation Every', 'Vacation Duration', 'Count Holidays', 'Total delay', 'Absence'].includes(header)) {
                    value = value === 'لا توجد' ? 0 : parseInt(value) || 0;
                }
                employeeObj[header] = value;
            });
            formattedData[employeeObj['Code']] = employeeObj;
        });

        localStorage.setItem('employeesData', JSON.stringify(formattedData));
        return formattedData;
    } catch (error) {
        console.error('Error fetching attendance data:', error.message);
        return null;
    }
}

// Main function to initialize attendance
async function initializeAttendance() {
    const apiKey = await getApiKey();
    if (!apiKey) {
        console.log('API key not provided, check login.js');
        return;
    }

    const atendBox = document.querySelector('.atend-box');
    if (!atendBox) {
        console.error('Element .atend-box not found');
        return;
    }

    const storedEmployeesData = localStorage.getItem('employeesData');
    const storedSettingsData = localStorage.getItem('settingsData');
    const storedShiftsData = localStorage.getItem('shiftsData');

    if (storedEmployeesData && storedSettingsData && storedShiftsData) {
        renderEmployees(JSON.parse(storedEmployeesData));
        console.log('Rendered stored data from localStorage.');
    } else {
        atendBox.innerHTML = '<p class="loading-text">جارٍ تحميل البيانات...</p>';
    }

    try {
        const settingsPromise = storedSettingsData ? Promise.resolve(JSON.parse(storedSettingsData)) : fetchSettingsData(apiKey);
        const shiftsPromise = storedShiftsData ? Promise.resolve(JSON.parse(storedShiftsData)) : fetchShiftsData(apiKey);
        const attendancePromise = fetchAttendanceData(apiKey);

        const [settings, shifts, attendance] = await Promise.all([
            settingsPromise,
            shiftsPromise,
            attendancePromise
        ]);

        if (settings && shifts && attendance) {
            console.log('New data fetched successfully, updating now...');
            localStorage.setItem('employeesData', JSON.stringify(attendance));
            localStorage.setItem('settingsData', JSON.stringify(settings));
            localStorage.setItem('shiftsData', JSON.stringify(shifts));
            renderEmployees(attendance);
        } else {
            console.log('Failed to load some data in the background');
            if (!storedEmployeesData) {
                atendBox.innerHTML = '<p class="error-text">فشل في تحميل البيانات، يرجى المحاولة مرة أخرى لاحقًا.</p>';
            }
        }
    } catch (error) {
        console.error('Error fetching new data:', error);
        if (!storedEmployeesData) {
            atendBox.innerHTML = '<p class="error-text">فشل في تحميل البيانات، يرجى المحاولة مرة أخرى لاحقًا.</p>';
        }
    }
}

window.addEventListener('load', initializeAttendance);
