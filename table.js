function isDateTodayOrLaterTable(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
}

async function loadSessionsFromJSONTable() {
  try {
    const response = await fetch('./sessions.json');
    const data = await response.json();
    return data.sessions.map(session => ({
      ...session,
      date: new Date(session.date)
    }));
  } catch (error) {
    console.error('Error loading sessions:', error);
    return [];
  }
}

async function loadExcelFilesTable() {
    const sessions = await loadSessionsFromJSONTable();
    
    // Filter for future sessions only
    const futureSessions = sessions.filter(session => 
      isDateTodayOrLaterTable(session.date)
    );

    futureSessions.sort((a, b) => a.date - b.date);

    const limitedSessions = futureSessions.slice(0, 14);

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

      // Add exam styling first (highest priority)
      if (session.isExam) {
        newRow.classList.add("exam-row");
      } else if (session.sessionType === "OPL" || session.sessionType === "DSL") {
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