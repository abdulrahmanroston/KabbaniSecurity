(() => {
  const HOLIDAY_SPREADSHEET_ID = '1FQVhuYHqkUA4_YDQjyuHek2UY0Qm5n-xcRdfKRJ0tUM';
  let HOLIDAY_API_KEY = localStorage.getItem('userApiKey') || '';
  const HOLIDAY_SHEET_NAME = 'Employees';
  
  function getApiKey() {
    return new Promise((resolve) => {
      if (!HOLIDAY_API_KEY) {
        const storedApiKey = localStorage.getItem('userApiKey');
        if (storedApiKey) {
          HOLIDAY_API_KEY = storedApiKey;
          resolve(HOLIDAY_API_KEY);
        } else {
          resolve('');
        }
      } else {
        resolve(HOLIDAY_API_KEY);
      }
    });
  }
  
  // Format days for display
  function formatDays(days) {
    return isNaN(days) || days < 0 ? 'غير محدد' : (days <= 2 ? `${days} يوم` : `${days} أيام`);
  }
  
  // Fetch employee data from API
  async function fetchEmployeeData(apiKey) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${HOLIDAY_SPREADSHEET_ID}/values/${HOLIDAY_SHEET_NAME}!A1:M?key=${apiKey}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (!data.values || data.values.length === 0) throw new Error('No data in the sheet');
      return data.values;
    } catch (error) {
      console.error('Error fetching employee data:', error.message);
      return null;
    }
  }
  
  // Transform raw data into object
  function transformDataToObject(rawData) {
    if (!rawData) return null;
    const headers = rawData[0];
    const employees = rawData.slice(1);
    const formattedData = {};
    employees.forEach(row => {
      const employee = {};
      headers.forEach((header, index) => {
        let value = row[index] || '';
        // Convert numeric fields to numbers
        if (['Work Days', 'Last Holiday', 'Vacation Every', 'Vacation Duration'].includes(header)) {
          value = value === 'لا توجد' ? 0 : parseInt(value) || 0;
        }
        employee[header] = value;
      });
      formattedData[employee['Code']] = employee;
    });
    return formattedData;
  }
  
  // Store data in localStorage
  function storeDataInLocalStorage(data) {
    if (!data) return;
    localStorage.setItem('holidays', JSON.stringify(data));
  }
  
  // Calculate eligibility and difference
  function calculateEligibilityAndDifference(employeesData) {
    const employees = Object.values(employeesData);
    const employeesWithEligibility = employees.map(employee => {
      const lastHoliday = employee['Last Holiday'];
      const vacationEvery = employee['Vacation Every'];
      const difference = lastHoliday - vacationEvery;
      const isEligible = lastHoliday >= vacationEvery;
      return {
        ...employee,
        difference: difference,
        isEligible: isEligible
      };
    });
    return employeesWithEligibility;
  }
  
  // Get vacation duration from data
  function calculateHolidayDuration(employee) {
    return parseInt(employee['Vacation Duration']) || 1;
  }
  
  // Sort employees by difference
  function sortEmployeesByDifference(employeesWithEligibility) {
    const eligibleEmployees = employeesWithEligibility
      .filter(emp => emp.isEligible)
      .sort((a, b) => {
        if (b.difference !== a.difference) {
          return b.difference - a.difference;
        }
        return (parseInt(b['Work Days']) || 0) - (parseInt(a['Work Days']) || 0);
      });
    const nonEligibleEmployees = employeesWithEligibility
      .filter(emp => !emp.isEligible)
      .sort((a, b) => (parseInt(b['Last Holiday']) || 0) - (parseInt(a['Last Holiday']) || 0));
    const sortedEmployees = [...eligibleEmployees, ...nonEligibleEmployees];
    return sortedEmployees;
  }
  
  // Render holidays in the UI
  function renderHolidays(sortedEmployees) {
    const hollydayBox = document.querySelector('.hollyday-box');
    if (!hollydayBox) {
      console.error('Element .hollyday-box not found');
      return;
    }
    hollydayBox.innerHTML = '';
    const priorityDiv = document.createElement('div');
    priorityDiv.classList.add('priority-head');
    priorityDiv.innerHTML = `
            <p> الأولوية في الإجازات </p>
           
 <span> يتم إعطاء الأولوية تلقائيًا بناءً على نوع الإجازة والمدة التي تخطت ميعاد الإجازة المعتاد 
 (اللون الاحمر يعني موعد اجازة) 
 </span>
 
        `;
    hollydayBox.appendChild(priorityDiv);
    
    sortedEmployees.forEach(employee => {
      const isEligible = employee.isEligible;
      const hollydayDiv = document.createElement('div');
      hollydayDiv.classList.add('hollyday');
      if (isEligible) {
        hollydayDiv.classList.add('priority');
      }
      const vacationEvery = employee['Vacation Every'];
      const typeOfHoliday = employee['Type of Holiday'] ?
        `${employee['Type of Holiday']}` :
        `كل ${formatDays(vacationEvery)}`;
      const vacationDuration = calculateHolidayDuration(employee);
      
      hollydayDiv.innerHTML = `
                <div class="name">${employee['Name'] || 'غير محدد'}</div>
                <div class="image">
                    <img src="${employee['Image'] || 'https://picsum.photos/75750'}" alt="صورة">
                </div>
                <div class="holly-data">
                    <div class="type">
                        <p>نوع الإجازة :</p>
                        <span>${typeOfHoliday}</span>
                    </div>
                    <div class="last">
                        <p>آخر إجازة منذ :</p>
                        <span>${formatDays(employee['Last Holiday'])}</span>
                    </div>
                    <div class="duration">
                        <p>مدة الإجازة :</p>
                        <span>${formatDays(vacationDuration)}</span>
                    </div>
                </div>
            `;
      hollydayBox.appendChild(hollydayDiv);
    });
    console.log('Holidays data rendered:', sortedEmployees);
  }
  
  // Main function to display holidays
  async function displayHolidays() {
    const hollydayBox = document.querySelector('.hollyday-box');
    if (!hollydayBox) {
      console.error('Element .hollyday-box not found');
      return;
    }
    const apiKey = await getApiKey();
    if (!apiKey) {
      console.log('API key not provided, check login.js');
      return;
    }
    const storedData = localStorage.getItem('holidays');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const employeesWithEligibility = calculateEligibilityAndDifference(parsedData);
      const sortedEmployees = sortEmployeesByDifference(employeesWithEligibility);
      renderHolidays(sortedEmployees);
    } else {
      hollydayBox.innerHTML = '<p>جارٍ تحميل البيانات...</p>';
    }
    const rawData = await fetchEmployeeData(apiKey);
    if (rawData) {
      const formattedData = transformDataToObject(rawData);
      if (formattedData) {
        storeDataInLocalStorage(formattedData);
        const employeesWithEligibility = calculateEligibilityAndDifference(formattedData);
        const sortedEmployees = sortEmployeesByDifference(employeesWithEligibility);
        renderHolidays(sortedEmployees);
      }
    }
  }
  
  window.displayHolidays = displayHolidays;
  if (localStorage.getItem('userApiKey')) {
    displayHolidays();
  }
  window.addEventListener('storage', (event) => {
    if (event.key === 'userApiKey' && localStorage.getItem('userApiKey')) {
      displayHolidays();
    }
  });
  window.addEventListener('load', displayHolidays);
})();
