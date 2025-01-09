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
      const columnBValue = row[1];
      const columnEValue = row[4];
      const columnFValue = row[5];
      const columnGValue = row[6];
      const columnMValue = row[12];
      const columnOValue = row[14];
      const columnPValue = row[15];
      const columnQValue = row[16];

      if (
        typeof columnBValue === "number" &&
        columnBValue > 0 &&
        columnFValue
      ) {
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

      if (
        typeof columnMValue === "number" &&
        columnMValue > 0 &&
        columnPValue
      ) {
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
      timeText = "morgen";
    } else if (timeDiff === 2) {
      timeText = "übermorgen";
    } else {
      timeText = `in ${timeDiff} Tagen`;
    }

    nextSessionElement.textContent = `${timeText}, bei ${nextSession.details} als ${nextSession.sessionType}`;
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
}

window.onload = loadExcelFiles;
