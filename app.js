function excelSerialToDate(serial) {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const date = new Date(utcValue * 1000);
  return date;
}

function isDateTodayOrLater(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

function getStartOfWeek(date) {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay(); // Get current day of the week (0-6)
  const diff = startOfWeek.getDate() - day; // Adjust the date to the start of the week
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0); // Set time to the start of the day
  return startOfWeek;
}

function getEndOfWeek(date) {
  const endOfWeek = new Date(date);
  const day = endOfWeek.getDay(); // Get current day of the week (0-6)
  const diff = endOfWeek.getDate() + (6 - day); // Adjust the date to the end of the week
  endOfWeek.setDate(diff);
  endOfWeek.setHours(23, 59, 59, 999); // Set time to the end of the day
  return endOfWeek;
}

// Add a variable to track the current week offset (0 = current week, 1 = next week, etc.)
let currentWeekOffset = 0;

async function processFile(filePath, sessions) {
  try {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    jsonData.forEach((row) => {
      const columnBValue = row[1]; // date
      const columnEValue = row[4]; // details
      const columnFValue = row[5]; // session type
      const columnGValue = row[6]; // note
      const columnMValue = row[12]; // date
      const columnOValue = row[14]; // details
      const columnPValue = row[15]; // session type
      const columnQValue = row[16]; // note

      // Process all sessions, not just those in the current week
      if (typeof columnBValue === "number" && columnBValue > 0 && columnFValue) {
        const date = excelSerialToDate(columnBValue);
        if (isDateTodayOrLater(date)) {
          sessions.push({
            date: date,
            sessionType: columnFValue,
            details: columnEValue || "",
            note: columnGValue || "",
          });
        }
      }

      if (typeof columnMValue === "number" && columnMValue > 0 && columnPValue) {
        const date = excelSerialToDate(columnMValue);
        if (isDateTodayOrLater(date)) {
          sessions.push({
            date: date,
            sessionType: columnPValue,
            details: columnOValue || "",
            note: columnQValue || "",
          });
        }
      }
    });
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

function updateTimetableVisualization(sessions) {
  // Group sessions by day of week
  const sessionsByDay = {
    0: [], // Sunday
    1: [], // Monday
    2: [], // Tuesday
    3: [], // Wednesday
    4: [], // Thursday
    5: [], // Friday
    6: []  // Saturday
  };
  
  sessions.forEach(session => {
    const day = session.date.getDay();
    sessionsByDay[day].push(session);
  });
  
  // Create a reusable function for formatting the slots
  const updateSlot = (slot, session) => {
    if (session.sessionType === 'OPL' || session.sessionType === 'DSL') {
      slot.style.backgroundColor = 'rgb(132, 204, 132)';
    } else if (session.sessionType === 'PPL') {
      slot.style.backgroundColor = 'white';
    }
    
    const date = session.date.toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit'});
    const textColor = session.sessionType === 'PPL' ? 'black' : 'white';
    
    // Enhanced mobile-friendly formatting
    slot.innerHTML = `
      <div style="padding: 5px; color: ${textColor}; text-align: center; overflow: hidden; width: 100%;">
        <div style="font-weight: bold; font-size: clamp(0.7rem, 1.5vw, 1.2rem); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${session.details}</div>
        <div style="font-size: clamp(0.6rem, 1.2vw, 1rem);">${date}</div>
        <div style="font-size: clamp(0.6rem, 1.2vw, 1rem);">${session.sessionType}</div>
      </div>
    `;
  };
  
  // Update Monday slot
  if (sessionsByDay[1].length > 0) {
    updateSlot(document.querySelector('.mon-slot'), sessionsByDay[1][0]);
  } else {
    document.querySelector('.mon-slot').innerHTML = '';
    document.querySelector('.mon-slot').style.backgroundColor = '#cfcfcf';
  }
  
  // Update Wednesday slot
  if (sessionsByDay[3].length > 0) {
    updateSlot(document.querySelector('.wed-slot'), sessionsByDay[3][0]);
  } else {
    document.querySelector('.wed-slot').innerHTML = '';
    document.querySelector('.wed-slot').style.backgroundColor = '#cfcfcf';
  }
  
  // Update Thursday slot
  if (sessionsByDay[4].length > 0) {
    updateSlot(document.querySelector('.thr-slot'), sessionsByDay[4][0]);
  } else {
    document.querySelector('.thr-slot').innerHTML = '';
    document.querySelector('.thr-slot').style.backgroundColor = '#cfcfcf';
  }
  
  // Update Friday slot
  if (sessionsByDay[5].length > 0) {
    updateSlot(document.querySelector('.fri-slot'), sessionsByDay[5][0]);
  } else {
    document.querySelector('.fri-slot').innerHTML = '';
    document.querySelector('.fri-slot').style.backgroundColor = '#cfcfcf';
  }
}

// Function to load all sessions for the current week offset, including past sessions
async function loadAllWeekSessions() {
  const sessions = [];

  const filePaths = [
    "./sheets/colic.xlsx",
    "./sheets/meyer.xlsx",
    "./sheets/rapisadra.xlsx",
  ];

  // Process all files without date filtering
  for (const filePath of filePaths) {
    try {
      const response = await fetch(filePath);
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      jsonData.forEach((row) => {
        const columnBValue = row[1]; // date
        const columnEValue = row[4]; // details
        const columnFValue = row[5]; // session type
        const columnGValue = row[6]; // note
        const columnMValue = row[12]; // date
        const columnOValue = row[14]; // details
        const columnPValue = row[15]; // session type
        const columnQValue = row[16]; // note

        // Process all sessions without date filtering
        if (typeof columnBValue === "number" && columnBValue > 0 && columnFValue) {
          const date = excelSerialToDate(columnBValue);
          sessions.push({
            date: date,
            sessionType: columnFValue,
            details: columnEValue || "",
            note: columnGValue || "",
          });
        }

        if (typeof columnMValue === "number" && columnMValue > 0 && columnPValue) {
          const date = excelSerialToDate(columnMValue);
          sessions.push({
            date: date,
            sessionType: columnPValue,
            details: columnOValue || "",
            note: columnQValue || "",
          });
        }
      });
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }

  sessions.sort((a, b) => a.date - b.date);

  // Calculate the start and end of the selected week based on the currentWeekOffset
  const today = new Date();
  const selectedDate = new Date(today.getTime() + currentWeekOffset * 7 * 24 * 60 * 60 * 1000);
  const startOfWeek = getStartOfWeek(selectedDate);
  const endOfWeek = getEndOfWeek(selectedDate);

  const sessionsThisWeek = sessions.filter(session => 
    session.date >= startOfWeek && session.date <= endOfWeek
  );
  console.log(`Sessions for week offset ${currentWeekOffset}:`, sessionsThisWeek);

  // Update the week display
  const weekDisplay = document.getElementById('week-display');
  if (weekDisplay) {
    weekDisplay.textContent = `${startOfWeek.toLocaleDateString('de-DE')} - ${endOfWeek.toLocaleDateString('de-DE')}`;
  }

  updateTimetableVisualization(sessionsThisWeek);
}

// Function to navigate to the previous week
function previousWeek() {
  currentWeekOffset--;
  loadAllWeekSessions();
}

// Function to navigate to the next week
function nextWeek() {
  currentWeekOffset++;
  loadAllWeekSessions();
}

// Function to reset to the current week
function currentWeek() {
  currentWeekOffset = 0;
  loadAllWeekSessions();
}

window.onload = function() {
  loadAllWeekSessions();  // For the timetable visualization with all week sessions
  loadExcelFilesTable();  // For the table display
};