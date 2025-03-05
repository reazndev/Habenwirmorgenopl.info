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

      // Allow sessions to be added if they are within the current week
      if (typeof columnBValue === "number" && columnBValue > 0 && columnFValue) {
        const date = excelSerialToDate(columnBValue);
        if (date >= getStartOfWeek(new Date()) && date <= getEndOfWeek(new Date())) {
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
        if (date >= getStartOfWeek(new Date()) && date <= getEndOfWeek(new Date())) {
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
    
    // Mobile-friendly formatting
    slot.innerHTML = `
      <div style="padding: 5px; color: ${textColor}; text-align: center; overflow: hidden;">
        <div style="font-weight: bold; font-size: clamp(0.7rem, 2vw, 1.2rem); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${session.details}</div>
        <div style="font-size: clamp(0.6rem, 1.5vw, 1rem);">${date}</div>
        <div style="font-size: clamp(0.6rem, 1.5vw, 1rem);">${session.sessionType}</div>
      </div>
    `;
  };
  
  // Update Monday slot
  if (sessionsByDay[1].length > 0) {
    updateSlot(document.querySelector('.mon-slot'), sessionsByDay[1][0]);
  }
  
  // Update Wednesday slot
  if (sessionsByDay[3].length > 0) {
    updateSlot(document.querySelector('.wed-slot'), sessionsByDay[3][0]);
  }
  
  // Update Thursday slot
  if (sessionsByDay[4].length > 0) {
    updateSlot(document.querySelector('.thr-slot'), sessionsByDay[4][0]);
  }
  
  // Update Friday slot
  if (sessionsByDay[5].length > 0) {
    updateSlot(document.querySelector('.fri-slot'), sessionsByDay[5][0]);
  }
}

async function loadExcelFiles() {
  const sessions = [];

  const filePaths = [
    "./sheets/colic.xlsx",
    "./sheets/meyer.xlsx",
    "./sheets/rapisadra.xlsx",
  ];

  for (const filePath of filePaths) {
    await processFile(filePath, sessions);
  }

  sessions.sort((a, b) => a.date - b.date);

  const today = new Date();
  const startOfWeek = getStartOfWeek(today);
  const endOfWeek = getEndOfWeek(today);

  const sessionsThisWeek = sessions.filter(session => 
    session.date >= startOfWeek && session.date <= endOfWeek
  );
  console.log("Sessions this week:", sessionsThisWeek);

  updateTimetableVisualization(sessionsThisWeek);

  const tableBody = document.querySelector("#timetable tbody");
  const nextSessionElement = document.getElementById("next-session");
  tableBody.innerHTML = "";

  if (sessionsThisWeek.length > 0) {
    const nextSession = sessionsThisWeek[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timeDiff = Math.ceil(
      (nextSession.date - today) / (1000 * 60 * 60 * 24)
    );
    let timeText;

    if (timeDiff === 0) {
      timeText = "Heute";
    } else if (timeDiff === 1) {
      timeText = "Morgen";
    } else {
      timeText = `In ${timeDiff} Tagen`;
    }

    if (nextSession.details === "ILA") {
      nextSessionElement.textContent = `${timeText} im Lernatelier als ${nextSession.sessionType}`;
    } else {
      nextSessionElement.textContent = `${timeText} im Modul ${nextSession.details} als ${nextSession.sessionType}`;
    }

    if (nextSession.sessionType === "PPL") {
      nextSessionElement.classList.add("red-glow");
    } else {
      nextSessionElement.classList.add("green-glow");
    }
  } else {
    nextSessionElement.textContent = "No upcoming sessions found.";
  }

  sessionsThisWeek.forEach((session) => {
    const newRow = document.createElement("tr");
    const cellDate = document.createElement("td");
    const cellSessionType = document.createElement("td");
    const cellDetails = document.createElement("td");

    cellDate.textContent = session.date.toLocaleDateString();
    cellSessionType.textContent = session.sessionType;
    cellDetails.textContent = session.details;

    if (session.note) {
      const star = document.createElement("span");
      star.className = "star";
      star.textContent = " *";
      star.setAttribute("data-tooltip", session.note);
      cellDetails.appendChild(star);

      if (session.note.includes("Prüfung") || session.note.includes("Abgabe")) {
        newRow.classList.add("highlight-row");
      }
    }

    newRow.appendChild(cellDate);
    newRow.appendChild(cellSessionType);
    newRow.appendChild(cellDetails);

    if (session.sessionType === "OPL" || session.sessionType === "DSL") {
      newRow.classList.add("green-row");
    } else if (session.sessionType === "PPL") {
      newRow.classList.add("red-row");
    }

    tableBody.appendChild(newRow);
  });
}

window.onload = function() {
  loadExcelFiles();      // For the timetable visualization
  loadExcelFilesTable(); // For the table display
};