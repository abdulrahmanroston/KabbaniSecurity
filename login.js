document.addEventListener('DOMContentLoaded', () => {
  const authOverlay = document.createElement('div');
  authOverlay.id = 'auth-overlay';
  authOverlay.className = 'auth-overlay';
  authOverlay.innerHTML = `
        <div class="auth-container">
            <h2>إعداد الحساب</h2>
            <div id="api-key-section" class="auth-section">
                <label for="api-key">يرجى إدخال مفتاح API الخاص بك:</label>
                <div class="form-key">
                    <input type="text" class="login-key" id="api-key" placeholder="أدخل مفتاح API هنا">
                    <button id="submit-api-key">تأكيد</button>
                </div>
            </div>
            <div id="user-code-section" class="auth-section" style="display: none;">
                <div class="form-key">
                    <label for="user-code">يرجى إدخال الكود الخاص بك:</label>
                    <input type="text" id="user-code" placeholder="أدخل الكود الخاص بك">
                    <button id="submit-user-code">تأكيد</button>
                </div>
            </div>
            <div id="welcome-message" class="welcome-message" style="display: none;">
                <h3 id="welcome-text"></h3>
            </div>
        </div>
    `;
  
  if (!localStorage.getItem('userApiKey')) {
    document.body.appendChild(authOverlay);
  }
  
  const apiKeySection = document.getElementById('api-key-section');
  const userCodeSection = document.getElementById('user-code-section');
  const welcomeMessage = document.getElementById('welcome-message');
  const welcomeText = document.getElementById('welcome-text');
  const apiKeyInput = document.getElementById('api-key');
  const userCodeInput = document.getElementById('user-code');
  const submitApiKeyBtn = document.getElementById('submit-api-key');
  const submitUserCodeBtn = document.getElementById('submit-user-code');
  const atendBox = document.querySelector('.atend-box');
  const hollydayBox = document.querySelector('.hollyday-box');
  
  if (localStorage.getItem('userInfo')) {
    authOverlay.style.display = 'none';
    atendBox.style.display = 'block';
    if (hollydayBox) hollydayBox.style.display = 'block';
    initializeAttendance();
    if (typeof displayHolidays === 'function') displayHolidays();
    return;
  }
  
  if (!localStorage.getItem('userApiKey')) {
    authOverlay.style.display = 'flex';
  } else {
    fetchUserData(localStorage.getItem('userApiKey'))
      .then(() => {
        apiKeySection.style.display = 'none';
        userCodeSection.style.display = 'block';
      })
      .catch(error => {
        alert('فشل في جلب بيانات المستخدمين: ' + error.message);
      });
  }
  
  submitApiKeyBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      localStorage.setItem('userApiKey', apiKey);
      fetchUserData(apiKey)
        .then(() => {
          apiKeySection.style.display = 'none';
          userCodeSection.style.display = 'block';
          if (typeof window.displayHolidays === 'function') {
            window.displayHolidays();
          }
        })
        .catch(error => {
          alert(`فشل في جلب بيانات المستخدمين: ${error.message}\nيرجى إدخال مفتاح API صحيح.`);
          apiKeyInput.value = '';
          apiKeySection.style.display = 'block';
        });
    } else {
      alert('يرجى إدخال مفتاح API صالح!');
    }
  });
  
  submitUserCodeBtn.addEventListener('click', () => {
    const userCode = userCodeInput.value.trim();
    if (userCode) {
      const employeesData = JSON.parse(localStorage.getItem('employeesData')) || {};
      const employee = Object.values(employeesData).find(emp => emp['Code'] === userCode);
      if (employee) {
        const userInfo = {
          code: userCode,
          name: employee['Name'] || 'غير محدد'
        };
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        userCodeSection.style.display = 'none';
        welcomeMessage.style.display = 'block';
        welcomeText.textContent = `مرحبًا ${userInfo.name}`;
        setTimeout(() => {
          loadDataAndProceed();
        }, 2000);
      } else {
        alert('الكود الذي أدخلته غير صحيح، يرجى إدخال الكود الصحيح مرة أخرى!');
        userCodeInput.value = '';
        userCodeSection.style.display = 'block';
      }
    } else {
      alert('يرجى إدخال الكود الخاص بك!');
    }
  });
  
  // Fetch user data from Employees sheet
  function fetchUserData(apiKey) {
    return new Promise((resolve, reject) => {
      const SPREADSHEET_ID = '1FQVhuYHqkUA4_YDQjyuHek2UY0Qm5n-xcRdfKRJ0tUM';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Employees!A1:M?key=${apiKey}`;
      fetch(url)
        .then(response => {
          if (!response.ok) throw new Error('Failed to connect to API');
          return response.json();
        })
        .then(data => {
          if (data.values && data.values.length > 1) {
            const headers = data.values[0];
            const employees = data.values.slice(1);
            const employeesData = {};
            employees.forEach(employee => {
              const employeeObj = {};
              headers.forEach((header, index) => {
                let value = employee[index] || '';
                // Convert numeric fields to numbers
                if (['Work Days', 'Last Holiday', 'Vacation Every', 'Vacation Duration'].includes(header)) {
                  value = value === 'لا توجد' ? 0 : parseInt(value) || 0;
                }
                employeeObj[header] = value;
              });
              if (employeeObj['Code']) {
                employeesData[employeeObj['Code']] = employeeObj;
              }
            });
            localStorage.setItem('employeesData', JSON.stringify(employeesData));
            resolve();
          } else {
            reject(new Error('No user data found'));
          }
        })
        .catch(error => reject(error));
    });
  }
  
  // Fetch holiday data from Employees sheet
  function loadHollydayData(apiKey) {
    return new Promise((resolve, reject) => {
      const SPREADSHEET_ID = '1FQVhuYHqkUA4_YDQjyuHek2UY0Qm5n-xcRdfKRJ0tUM';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Employees!A1:M?key=${apiKey}`;
      fetch(url)
        .then(response => {
          if (!response.ok) throw new Error('Failed to connect to API');
          return response.json();
        })
        .then(data => {
          if (data.values && data.values.length > 1) {
            const headers = data.values[0];
            const employees = data.values.slice(1);
            const formattedData = {};
            employees.forEach(row => {
              const employeeObj = {};
              headers.forEach((header, index) => {
                let value = row[index] || '';
                // Convert numeric fields to numbers
                if (['Work Days', 'Last Holiday', 'Vacation Every', 'Vacation Duration'].includes(header)) {
                  value = value === 'لا توجد' ? 0 : parseInt(value) || 0;
                }
                employeeObj[header] = value;
              });
              if (employeeObj['Code']) {
                formattedData[employeeObj['Code']] = employeeObj;
              }
            });
            localStorage.setItem('holidays', JSON.stringify(formattedData));
            resolve();
          } else {
            reject(new Error('No holiday data found'));
          }
        })
        .catch(error => reject(error));
    });
  }
  
  // Proceed to load data and initialize pages
  function loadDataAndProceed() {
    authOverlay.style.display = 'none';
    atendBox.style.display = 'block';
    if (hollydayBox) hollydayBox.style.display = 'block';
    initializeAttendance();
    if (typeof window.displayHolidays === 'function') window.displayHolidays();
  }
});
