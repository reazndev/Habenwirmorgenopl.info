function excelSerialToDateTable(serial) {
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    const date = new Date(utcValue * 1000);
    return date;
  }
  
  function isDateTodayOrLaterTable(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }
  
  async function processFileTable(filePath, sessions) {
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
  
        if (
          typeof columnBValue === "number" &&
          columnBValue > 0 &&
          columnFValue
        ) {
          const date = excelSerialToDateTable(columnBValue);
          if (isDateTodayOrLaterTable(date)) {
            sessions.push({
              date: date,
              sessionType: columnFValue,
              details: columnEValue || "",
              note: columnGValue || "",
            });
          }
        }
  
        if (
          typeof columnMValue === "number" &&
          columnMValue > 0 &&
          columnPValue
        ) {
          const date = excelSerialToDateTable(columnMValue);
          if (isDateTodayOrLaterTable(date)) {
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
  
  async function loadExcelFilesTable() {
    const sessions = [];
  
    const filePaths = [
      "./sheets/colic.xlsx",
      "./sheets/meyer.xlsx",
      "./sheets/rapisadra.xlsx",
    ];
  
    for (const filePath of filePaths) {
      await processFileTable(filePath, sessions);
    }
  
    sessions.sort((a, b) => a.date - b.date);
  
    const limitedSessions = sessions.slice(0, 14);
  
    const tableBody = document.querySelector("#timetable tbody");
    const nextSessionElement = document.getElementById("next-session");
    tableBody.innerHTML = "";
  
    if (limitedSessions.length > 0) {
      const nextSession = limitedSessions[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const timeDiff = Math.ceil(
        (nextSession.date - today) / (1000 * 60 * 60 * 24)
      );
      let timeText;
  
      if (timeDiff === 1) {
        timeText = "Heute";
      } else if (timeDiff === 2) {
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
        nextSessionElement.classList.add("green-text");
      }
    } else {
      nextSessionElement.textContent = "No upcoming sessions found.";
    }
  
    limitedSessions.forEach((session) => {
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
  
    updateHeaderColor();
  
    // Add this line at the end of loadExcelFilesTable or in your initialization code
    addEscKeyListener();
  }
  
  function updateHeaderColor() {
    const firstRow = document.querySelector('#timetable tr:first-child td:nth-child(2)');
    const header = document.querySelector('#next-session');
    
    if (!firstRow || !header) {
        console.log('Could not find required elements for header color update');
        return;
    }
    
    const sessionType = firstRow.textContent;
    
    // First, remove any existing animation class
    header.classList.remove('green-glow');
    header.classList.remove('red-glow');
    
    if (sessionType === 'OPL' || sessionType === 'DSL') {
        header.style.backgroundColor = '#90EE90'; // Light green background
        header.classList.add('green-glow');
    } else if (sessionType === 'PPL') {
        header.style.backgroundColor = 'transparent'; // Transparent background
        header.classList.add('red-glow');
    }
  }
  
  // Add this function to handle the ESC key for closing the stats popup
  function addEscKeyListener() {
    document.addEventListener('keydown', function(event) {
      // Check if the pressed key is ESC (key code 27)
      if (event.key === 'Escape') {
        // Get the stats popup and overlay elements
        const statsPopup = document.getElementById('stats-popup');
        const statsOverlay = document.getElementById('stats-overlay');
        
        // If the popup is visible, close it
        if (statsPopup && statsPopup.style.display === 'block') {
          statsPopup.style.display = 'none';
          if (statsOverlay) {
            statsOverlay.style.display = 'none';
          }
        }
      }
    });
  }