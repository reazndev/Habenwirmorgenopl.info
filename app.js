
function createCustomNotification(message, type = 'info', showButtons = false) {
  
  const existingNotification = document.getElementById('custom-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const isDarkMode = document.body.classList.contains('dark-mode');
  const bgColor = isDarkMode ? '#2d2d2d' : 'rgb(247, 244, 244)';
  const textColor = isDarkMode ? '#e0e0e0' : '#333';
  const borderColor = isDarkMode ? '#555' : '#e0e0e0';
  
  
  let accentColor = '#3498db'; 
  let icon = 'fas fa-info-circle';
  
  if (type === 'success') {
    accentColor = '#27ae60';
    icon = 'fas fa-check-circle';
  } else if (type === 'error') {
    accentColor = '#e74c3c';
    icon = 'fas fa-exclamation-circle';
  } else if (type === 'warning') {
    accentColor = '#f39c12';
    icon = 'fas fa-exclamation-triangle';
  } else if (type === 'confirm') {
    accentColor = '#f39c12';
    icon = 'fas fa-question-circle';
  }

  const notificationHTML = `
    <div id="custom-notification-overlay" style="display: block; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); z-index: 3500;"></div>
    <div id="custom-notification" style="display: block; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); min-width: 300px; max-width: 500px; background-color: ${bgColor}; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 4000; padding: 25px; text-align: center; border: 1px solid ${borderColor};">
      <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
        <i class="${icon}" style="font-size: 2em; color: ${accentColor}; margin-right: 15px;"></i>
        <div style="flex: 1; text-align: left;">
          <div style="font-size: 1.1em; font-weight: 600; color: ${textColor}; line-height: 1.4;">${message}</div>
        </div>
      </div>
      
      <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px;">
        ${showButtons ? `
          <button id="confirm-yes" style="padding: 10px 20px; background-color: ${accentColor}; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s;">
            ${type === 'confirm' ? 'Ja, löschen' : 'OK'}
          </button>
          <button id="confirm-no" style="padding: 10px 20px; background-color: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s;">
            Abbrechen
          </button>
        ` : `
          <button id="notification-ok" style="padding: 10px 24px; background-color: ${accentColor}; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s;">
            OK
          </button>
        `}
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', notificationHTML);

  
  const buttons = document.querySelectorAll('#custom-notification button');
  buttons.forEach(button => {
    const originalBg = button.style.backgroundColor;
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
    });
  });

  return new Promise((resolve) => {
    const notification = document.getElementById('custom-notification');
    const overlay = document.getElementById('custom-notification-overlay');
    
    const closeNotification = () => {
      if (notification) notification.remove();
      if (overlay) overlay.remove();
    };

    if (showButtons) {
      const yesButton = document.getElementById('confirm-yes');
      const noButton = document.getElementById('confirm-no');
      
      if (yesButton) {
        yesButton.addEventListener('click', () => {
          closeNotification();
          resolve(true);
        });
      }
      
      if (noButton) {
        noButton.addEventListener('click', () => {
          closeNotification();
          resolve(false);
        });
      }
    } else {
      const okButton = document.getElementById('notification-ok');
      if (okButton) {
        okButton.addEventListener('click', () => {
          closeNotification();
          resolve(true);
        });
      }
      
      
      if (type === 'success') {
        setTimeout(() => {
          closeNotification();
          resolve(true);
        }, 3000);
      }
    }

    
    if (!showButtons || type !== 'confirm') {
      overlay.addEventListener('click', () => {
        closeNotification();
        resolve(false);
      });
    }

    
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeNotification();
        resolve(false);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  });
}


function showSuccessNotification(message) {
  return createCustomNotification(message, 'success');
}

function showErrorNotification(message) {
  return createCustomNotification(message, 'error');
}

function showInfoNotification(message) {
  return createCustomNotification(message, 'info');
}

function showConfirmDialog(message) {
  return createCustomNotification(message, 'confirm', true);
}


let sessions = [];
let isAdminMode = false;

function getStartOfWeek(date) {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay(); 
  
  const mondayBasedDay = day === 0 ? 6 : day - 1;
  const diff = startOfWeek.getDate() - mondayBasedDay; 
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0); 
  return startOfWeek;
}

function getEndOfWeek(date) {
  const endOfWeek = new Date(date);
  const day = endOfWeek.getDay(); 
  
  const mondayBasedDay = day === 0 ? 6 : day - 1;
  const diff = endOfWeek.getDate() + (6 - mondayBasedDay); 
  endOfWeek.setDate(diff);
  endOfWeek.setHours(23, 59, 59, 999); 
  return endOfWeek;
}


let currentWeekOffset = 0;

async function loadSessionsFromJSON() {
  try {
    const response = await fetch('./sessions.json');
    const data = await response.json();
    sessions = data.sessions.map(session => ({
      ...session,
      date: new Date(session.date)
    }));
    return sessions;
  } catch (error) {
    console.error('Error loading sessions:', error);
    return [];
  }
}

async function saveSessionsToJSON(sessionsData) {
  try {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessions: sessionsData })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save sessions');
    }
    
    console.log('Sessions saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving sessions:', error);
    return false;
  }
}

function updateTimetableVisualization(sessions) {
  
  const sessionsBySlot = {
    'monday-morning': null,
    'tuesday-afternoon': null,
    'friday-afternoon': null
  };
  
  sessions.forEach(session => {
    if (session.slot && sessionsBySlot.hasOwnProperty(session.slot)) {
      sessionsBySlot[session.slot] = session;
    }
  });
  
  
  const updateSlot = (slotSelector, session) => {
    const slot = document.querySelector(slotSelector);
    if (!slot) return;
    
    if (session) {
      
      if (session.isExam) {
        slot.style.backgroundColor = '#ff6b6b'; 
      } else if (session.sessionType === 'OPL' || session.sessionType === 'DSL') {
        slot.style.backgroundColor = 'rgb(132, 204, 132)';
      } else if (session.sessionType === 'PPL') {
        slot.style.backgroundColor = 'white';
      }
      
      const date = session.date.toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit'});
      const textColor = session.sessionType === 'PPL' && !session.isExam ? 'black' : 'white';
      
      
      slot.innerHTML = `
        <div style="padding: 5px; color: ${textColor}; text-align: center; overflow: hidden; width: 100%;">
          <div style="font-weight: bold; font-size: clamp(1.0rem, 2.0vw, 1.5rem); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${session.details}
          </div>
          <div style="font-size: clamp(0.8rem, 1.5vw, 1.2rem);">${date}</div>
          <div style="font-size: clamp(0.8rem, 1.5vw, 1.2rem);">${session.sessionType}${session.isExam ? ' (Prüfung)' : ''}</div>
        </div>
      `;
      
      
      if (isAdminMode) {
        slot.style.cursor = 'pointer';
        slot.onclick = () => editSession(session.slot);
      }
    } else {
      slot.innerHTML = '';
      slot.style.backgroundColor = '#cfcfcf';
      slot.style.cursor = isAdminMode ? 'pointer' : 'default';
      if (isAdminMode) {
        slot.onclick = () => editSession(slotSelector.replace('.', '').replace('-slot', ''));
      }
    }
  };
  
  
  updateSlot('.mon-slot', sessionsBySlot['monday-morning']);
  updateSlot('.tue-slot', sessionsBySlot['tuesday-afternoon']);
  updateSlot('.fri-slot', sessionsBySlot['friday-afternoon']);
}


async function loadAllWeekSessions() {
  await loadSessionsFromJSON();
  
  
  const today = new Date();
  const selectedDate = new Date(today.getTime() + currentWeekOffset * 7 * 24 * 60 * 60 * 1000);
  const startOfWeek = getStartOfWeek(selectedDate);
  const endOfWeek = getEndOfWeek(selectedDate);

  const sessionsThisWeek = sessions.filter(session => 
    session.date >= startOfWeek && session.date <= endOfWeek
  );
  console.log(`Sessions for week offset ${currentWeekOffset}:`, sessionsThisWeek);

  
  const weekDisplay = document.getElementById('week-display');
  if (weekDisplay) {
    weekDisplay.textContent = `${startOfWeek.toLocaleDateString('de-DE')} - ${endOfWeek.toLocaleDateString('de-DE')}`;
  }

  updateTimetableVisualization(sessionsThisWeek);
}


function previousWeek() {
  currentWeekOffset--;
  loadAllWeekSessions();
}


function nextWeek() {
  currentWeekOffset++;
  loadAllWeekSessions();
}


function currentWeek() {
  currentWeekOffset = 0;
  loadAllWeekSessions();
}


function initStatsButton() {
  const statsBtn = document.getElementById('stats-button');
  const overlay = document.getElementById('stats-overlay');
  const popup = document.getElementById('stats-popup');
  const closeBtn = document.getElementById('stats-close');
  const content = document.getElementById('stats-content');
  
  if (!statsBtn || !overlay || !popup || !closeBtn || !content) {
    console.error('Stats elements not found in the DOM');
    return;
  }
  
  
  function closePopup() {
    popup.style.display = 'none';
    overlay.style.display = 'none';
    
    document.body.classList.remove('no-scroll');
  }
  
  
  closeBtn.addEventListener('click', closePopup);
  overlay.addEventListener('click', closePopup);
  
  statsBtn.addEventListener('click', async function() {
    
    content.innerHTML = '<p>Loading statistics...</p>';
    popup.style.display = 'block';
    overlay.style.display = 'block';
    
    
    document.body.classList.add('no-scroll');
    
    try {
      const allSessions = await getAllSessions();
      
      if (!allSessions || allSessions.length === 0) {
        content.innerHTML = '<p>No session data available.</p>';
        return;
      }
      
      
      const stats = {
        total: allSessions.length,
        byType: {
          OPL: allSessions.filter(s => s.sessionType === 'OPL').length,
          DSL: allSessions.filter(s => s.sessionType === 'DSL').length,
          PPL: allSessions.filter(s => s.sessionType === 'PPL').length
        },
        byModule: {},
        byTeacher: {
          'Colic (Montag)': { total: 0, OPL: 0, DSL: 0, PPL: 0 },
          'TBD (Dienstag)': { total: 0, OPL: 0, DSL: 0, PPL: 0 },
          'Colic (Freitag)': { total: 0, OPL: 0, DSL: 0, PPL: 0 }
        }
      };
      
      
      allSessions.forEach(session => {
        const module = session.details || 'Unknown';
        
        if (!stats.byModule[module]) {
          stats.byModule[module] = {
            total: 0,
            OPL: 0,
            DSL: 0,
            PPL: 0
          };
        }
        
        stats.byModule[module].total++;
        stats.byModule[module][session.sessionType]++;
        
        
        let teacherKey = '';
        if (session.slot === 'monday-morning') {
          teacherKey = 'Colic (Montag)';
        } else if (session.slot === 'tuesday-afternoon') {
          teacherKey = 'TBD (Dienstag)';
        } else if (session.slot === 'friday-afternoon') {
          teacherKey = 'Colic (Freitag)';
        }
        
        if (teacherKey && stats.byTeacher[teacherKey]) {
          stats.byTeacher[teacherKey].total++;
          stats.byTeacher[teacherKey][session.sessionType]++;
        }
      });
      
      
      const oplDslPercent = ((stats.byType.OPL + stats.byType.DSL) / stats.total * 100).toFixed(1);
      const pplPercent = (stats.byType.PPL / stats.total * 100).toFixed(1);
      
      
      let html = `
        <div style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 10px;">Übersicht</h3>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 8px; background-color: rgba(0,0,0,0.05); border-radius: 5px;">
            <div>Gesamt Einheiten:</div>
            <div>${stats.total}</div>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 8px; border-radius: 5px;">
            <div>OPL/DSL Einheiten:</div>
            <div>${stats.byType.OPL + stats.byType.DSL} (${oplDslPercent}%)</div>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 8px; background-color: rgba(0,0,0,0.05); border-radius: 5px;">
            <div>PPL Einheiten:</div>
            <div>${stats.byType.PPL} (${pplPercent}%)</div>
          </div>
          
          <div style="height: 20px; border-radius: 10px; margin-top: 15px; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; width: ${oplDslPercent}%; height: 100%; background-color: #1a4d1a;"></div>
            <div style="position: absolute; top: 0; left: ${oplDslPercent}%; width: ${pplPercent}%; height: 100%; background-color: #666666;"></div>
            <div style="position: absolute; top: 0; width: 100%; text-align: center; color: white; font-size: 0.8em; line-height: 20px; font-weight: bold; text-shadow: 0 0 2px rgba(0,0,0,0.7);">
              ${oplDslPercent}% OPL/DSL - ${pplPercent}% PPL
            </div>
          </div>
        </div>
        
        <div>
          <h3 style="margin-bottom: 10px;">Nach Lehrer</h3>
        `;
      
      
      let rowIndex = 0;
      for (const [teacher, data] of Object.entries(stats.byTeacher)) {
        if (data.total > 0) { 
          const teacherOplDslPercent = data.total > 0 ? ((data.OPL + data.DSL) / data.total * 100).toFixed(1) : '0.0';
          const teacherPplPercent = data.total > 0 ? (data.PPL / data.total * 100).toFixed(1) : '0.0';
          
          const bgColor = rowIndex % 2 === 0 ? 'rgba(0,0,0,0.05)' : 'transparent';
          rowIndex++;
          
          html += `
            <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 8px; background-color: ${bgColor}; border-radius: 5px;">
              <div>${teacher}:</div>
              <div>${data.total} Einheiten</div>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 8px; background-color: ${rowIndex % 2 === 0 ? 'rgba(0,0,0,0.05)' : 'transparent'}; border-radius: 5px;">
              <div>OPL/DSL: ${data.OPL + data.DSL} (${teacherOplDslPercent}%)</div>
              <div>PPL: ${data.PPL} (${teacherPplPercent}%)</div>
            </div>
          `;
          rowIndex++;
        }
      }
      
      html += `</div>
        
        <div>
          <h3 style="margin-bottom: 10px;">Nach Modul</h3>
        `;
      
      
      for (const [module, data] of Object.entries(stats.byModule)) {
        const moduleOplDslPercent = ((data.OPL + data.DSL) / data.total * 100).toFixed(1);
        const modulePplPercent = (data.PPL / data.total * 100).toFixed(1);
        
        const bgColor = rowIndex % 2 === 0 ? 'rgba(0,0,0,0.05)' : 'transparent';
        rowIndex++;
        
        html += `
          <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 8px; background-color: ${bgColor}; border-radius: 5px;">
            <div>${module}:</div>
            <div>${data.total} Einheiten</div>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 8px; background-color: ${rowIndex % 2 === 0 ? 'rgba(0,0,0,0.05)' : 'transparent'}; border-radius: 5px;">
            <div>OPL/DSL: ${data.OPL + data.DSL} (${moduleOplDslPercent}%)</div>
            <div>PPL: ${data.PPL} (${modulePplPercent}%)</div>
          </div>
        `;
        rowIndex++;
      }
      
      html += `</div>`;
      
      content.innerHTML = html;
      
    } catch (error) {
      console.error('Error displaying stats:', error);
      content.innerHTML = '<p>Error loading statistics. Please try again.</p>';
    }
  });
}


function initCalendarButton() {
  const calendarBtn = document.getElementById('calendar-button');
  const overlay = document.getElementById('calendar-overlay');
  const popup = document.getElementById('calendar-popup');
  const closeBtn = document.getElementById('calendar-close');
  const content = document.getElementById('calendar-content');
  
  if (!calendarBtn || !overlay || !popup || !closeBtn || !content) {
    console.error('Calendar elements not found in the DOM');
    return;
  }
  
  let currentDate = new Date();
  
  
  function closePopup() {
    popup.style.display = 'none';
    overlay.style.display = 'none';
    document.body.classList.remove('no-scroll');
  }
  
  
  closeBtn.addEventListener('click', closePopup);
  overlay.addEventListener('click', closePopup);
  
  
  document.getElementById('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
  
  document.getElementById('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
  
  
  async function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    
    const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                       'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
    
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = (firstDay.getDay() + 6) % 7; 
    
    
    const allSessions = await getAllSessions();
    const monthSessions = allSessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate.getFullYear() === year && sessionDate.getMonth() === month;
    });
    
    
    const grid = document.querySelector('.calendar-grid');
    
    const headers = grid.querySelectorAll('.calendar-header');
    grid.innerHTML = '';
    headers.forEach(header => grid.appendChild(header));
    
    
    for (let i = 0; i < startDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day empty';
      grid.appendChild(emptyDay);
    }
    
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      
      const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;
      
      if (isWeekend) {
        dayElement.classList.add('weekend');
      }
      
      
      const daySessions = monthSessions.filter(session => {
        const sessionDateStr = session.date.toISOString().split('T')[0];
        return sessionDateStr === currentDateStr;
      });
      
      
      if (daySessions.length > 0) {
        const hasExam = daySessions.some(session => session.isExam);
        const hasOplDsl = daySessions.some(session => session.sessionType === 'OPL' || session.sessionType === 'DSL');
        const hasPpl = daySessions.some(session => session.sessionType === 'PPL');
        
        if (hasExam) {
          dayElement.classList.add('session-exam');
        } else if (hasOplDsl) {
          dayElement.classList.add('session-opl-dsl');
        } else if (hasPpl) {
          dayElement.classList.add('session-ppl');
        }
      }
      
      dayElement.innerHTML = `
        <div class="day-number">${day}</div>
      `;
      
      grid.appendChild(dayElement);
    }
  }
  
  
  calendarBtn.addEventListener('click', async function() {
    popup.style.display = 'block';
    overlay.style.display = 'block';
    document.body.classList.add('no-scroll');
    
    await renderCalendar();
  });
}


function updateStatsForDarkMode(isDark) {
  const popup = document.getElementById('stats-popup');
  const calendarPopup = document.getElementById('calendar-popup');
  const adminPanel = document.getElementById('admin-panel');
  const passwordDialog = document.getElementById('password-dialog');
  const darkModeBtn = document.getElementById('dark-mode-toggle');
  const statsBtn = document.getElementById('stats-button');
  const calendarBtn = document.getElementById('calendar-button');
  
  
  if (popup) {
    if (isDark) {
      popup.style.backgroundColor = '#2d2d2d';
      popup.style.color = '#e0e0e0';
      popup.style.border = '1px solid #444';
    } else {
      popup.style.backgroundColor = 'rgb(247, 244, 244)';
      popup.style.color = '#333';
      popup.style.border = '1px solid #e0e0e0';
    }
  }
  
  
  if (calendarPopup) {
    if (isDark) {
      calendarPopup.style.backgroundColor = '#2d2d2d';
      calendarPopup.style.color = '#e0e0e0';
      calendarPopup.style.border = '1px solid #444';
    } else {
      calendarPopup.style.backgroundColor = 'rgb(247, 244, 244)';
      calendarPopup.style.color = '#333';
      calendarPopup.style.border = '1px solid #e0e0e0';
    }
  }
  
  
  if (adminPanel) {
    if (isDark) {
      adminPanel.style.backgroundColor = '#2d2d2d';
      adminPanel.style.color = '#e0e0e0';
      adminPanel.style.border = '1px solid #444';
      
      
      const inputs = adminPanel.querySelectorAll('input, select');
      inputs.forEach(input => {
        input.style.backgroundColor = '#2d2d2d';
        input.style.color = '#e0e0e0';
        input.style.borderColor = '#555';
      });
    } else {
      adminPanel.style.backgroundColor = 'rgb(247, 244, 244)';
      adminPanel.style.color = '#333';
      adminPanel.style.border = '1px solid #e0e0e0';
      
      
      const inputs = adminPanel.querySelectorAll('input, select');
      inputs.forEach(input => {
        input.style.backgroundColor = '#ffffff';
        input.style.color = '#333';
        input.style.borderColor = '#ddd';
      });
    }
  }
  
  
  if (passwordDialog) {
    if (isDark) {
      passwordDialog.style.backgroundColor = '#2d2d2d';
      passwordDialog.style.color = '#e0e0e0';
      passwordDialog.style.border = '1px solid #444';
      
      
      const passwordInput = passwordDialog.querySelector('input');
      if (passwordInput) {
        passwordInput.style.backgroundColor = '#2d2d2d';
        passwordInput.style.color = '#e0e0e0';
        passwordInput.style.borderColor = '#555';
      }
    } else {
      passwordDialog.style.backgroundColor = 'rgb(247, 244, 244)';
      passwordDialog.style.color = '#333';
      passwordDialog.style.border = '1px solid #e0e0e0';
      
      
      const passwordInput = passwordDialog.querySelector('input');
      if (passwordInput) {
        passwordInput.style.backgroundColor = '#ffffff';
        passwordInput.style.color = '#333';
        passwordInput.style.borderColor = '#ddd';
      }
    }
  }
  
  
  const buttonStyle = isDark ? 
    { bg: '#2d2d2d', color: '#e0e0e0', border: '1px solid #444' } : 
    { bg: 'rgb(247, 244, 244)', color: '#333', border: '1px solid #e0e0e0' };
  
  if (darkModeBtn) {
    darkModeBtn.style.backgroundColor = buttonStyle.bg;
    darkModeBtn.style.color = buttonStyle.color;
    darkModeBtn.style.borderColor = buttonStyle.border;
  }
  
  if (statsBtn) {
    statsBtn.style.backgroundColor = buttonStyle.bg;
    statsBtn.style.color = buttonStyle.color;
    statsBtn.style.borderColor = buttonStyle.border;
  }
  
  if (calendarBtn) {
    calendarBtn.style.backgroundColor = buttonStyle.bg;
    calendarBtn.style.color = buttonStyle.color;
    calendarBtn.style.borderColor = buttonStyle.border;
  }
}


function initDarkMode() {
  
  const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
                   (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && 
                    localStorage.getItem('darkMode') !== 'false');
  
  
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
  }
  
  
  const toggleBtn = document.getElementById('dark-mode-toggle');
  
  if (toggleBtn) {
    
    toggleBtn.innerHTML = isDarkMode ? 
      '<i class="fas fa-lightbulb"></i>' : 
      '<i class="fas fa-moon"></i>';
    toggleBtn.setAttribute('aria-label', isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    toggleBtn.title = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    
    
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('darkMode', isDark);
      toggleBtn.innerHTML = isDark ? 
        '<i class="fas fa-lightbulb"></i>' : 
        '<i class="fas fa-moon"></i>';
      toggleBtn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
      toggleBtn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      
      
      updateStatsForDarkMode(isDark);
    });
    
    
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem('darkMode') === null) {
          if (e.matches) {
            document.body.classList.add('dark-mode');
            toggleBtn.innerHTML = '<i class="fas fa-lightbulb"></i>';
            toggleBtn.setAttribute('aria-label', 'Switch to Light Mode');
            toggleBtn.title = 'Switch to Light Mode';
          } else {
            document.body.classList.remove('dark-mode');
            toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
            toggleBtn.setAttribute('aria-label', 'Switch to Dark Mode');
            toggleBtn.title = 'Switch to Dark Mode';
          }
        }
      });
    }
  }
  
  
  updateStatsForDarkMode(document.body.classList.contains('dark-mode'));
}


async function getAllSessions() {
  await loadSessionsFromJSON();
  return sessions;
}


function showPasswordPrompt() {
  createPasswordDialog();
}

function createPasswordDialog() {
  const passwordHTML = `
    <div id="password-overlay" style="display: block; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); z-index: 2500;"></div>
    <div id="password-dialog" style="display: block; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; max-width: 400px; background-color: rgb(247, 244, 244); border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3000; padding: 20px; text-align: left;">
      <div id="password-close" style="position: absolute; top: 10px; right: 15px; font-size: 1.5em; cursor: pointer;">&times;</div>
      <h2 style="font-family: 'nMedium', sans-serif; margin-top: 0; text-align: center; padding-bottom: 10px; border-bottom: 1px solid #e0e0e0;">Admin Zugang</h2>
      
      <div style="margin: 20px 0;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Passwort:</label>
        <input type="password" id="admin-password-input" style="width: 95%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px;" placeholder="Passwort eingeben">
        <div id="password-error" style="color: #f44336; margin-top: 8px; display: none;">Falsches Passwort!</div>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <button onclick="verifyPassword()" style="padding: 10px 20px; background-color: #1A4D1A; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Anmelden</button>
        <button onclick="closePasswordDialog()" style="padding: 10px 20px; background-color: #939393ff; color: white; border: none; border-radius: 4px; cursor: pointer;">Abbrechen</button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', passwordHTML);
  
  
  if (document.body.classList.contains('dark-mode')) {
    updateStatsForDarkMode(true);
  }
  
  
  document.getElementById('password-close').addEventListener('click', closePasswordDialog);
  document.getElementById('password-overlay').addEventListener('click', closePasswordDialog);
  
  
  const passwordInput = document.getElementById('admin-password-input');
  passwordInput.focus();
  
  
  passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      verifyPassword();
    }
  });
}

function verifyPassword() {
  const password = document.getElementById('admin-password-input').value;
  const errorDiv = document.getElementById('password-error');
  
  if (password === 'admin123') { 
    isAdminMode = true;
    closePasswordDialog();
    showAdminPanel();
  } else {
    errorDiv.style.display = 'block';
    document.getElementById('admin-password-input').value = '';
    document.getElementById('admin-password-input').focus();
  }
}

function closePasswordDialog() {
  const passwordDialog = document.getElementById('password-dialog');
  const passwordOverlay = document.getElementById('password-overlay');
  
  if (passwordDialog) passwordDialog.remove();
  if (passwordOverlay) passwordOverlay.remove();
}

function showAdminPanel() {
  const adminPanel = document.getElementById('admin-panel');
  if (!adminPanel) {
    createAdminPanel();
    
    if (document.body.classList.contains('dark-mode')) {
      updateStatsForDarkMode(true);
    }
  } else {
    adminPanel.style.display = 'block';
  }
  loadAdminSessions();
}

function createAdminPanel() {
  const isDarkMode = document.body.classList.contains('dark-mode');
  const panelBg = isDarkMode ? '#2d2d2d' : 'rgb(247, 244, 244)';
  const textColor = isDarkMode ? '#e0e0e0' : '#333';
  const borderColor = isDarkMode ? '#555' : '#e0e0e0';
  
  const adminHTML = `
    <div id="admin-overlay" style="display: block; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); z-index: 2500;"></div>
    <div id="admin-panel" style="display: block; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: 900px; background-color: ${panelBg}; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 3000; padding: 25px; text-align: left; max-height: 85vh; overflow-y: auto; color: ${textColor};">
      <div id="admin-close" style="position: absolute; top: 15px; right: 20px; font-size: 1.5em; cursor: pointer; color: ${textColor};">&times;</div>
      <h2 style="font-family: 'nMedium', sans-serif; margin-top: 0; text-align: center; padding-bottom: 15px; border-bottom: 1px solid ${borderColor}; color: ${textColor};">Admin Panel</h2>
      
      <div style="margin-bottom: 25px;">
        <h3 style="margin-bottom: 15px; color: ${textColor};">Sessions verwalten</h3>
        <div id="admin-sessions-list"></div>
        <button onclick="addNewSession()" 
                style="margin-top: 15px; padding: 12px 20px; background-color: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background-color 0.2s;"
                onmouseover="this.style.backgroundColor='#229954'" 
                onmouseout="this.style.backgroundColor='#27ae60'">
          Neue Session hinzufügen
        </button>
      </div>
      
      <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid ${borderColor};">
        <button onclick="saveAllSessions()" 
                style="padding: 12px 24px; background-color: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; margin-right: 15px; font-size: 14px; font-weight: 500; transition: background-color 0.2s;"
                onmouseover="this.style.backgroundColor='#2980b9'" 
                onmouseout="this.style.backgroundColor='#3498db'">
          Alle Änderungen speichern
        </button>
        <button onclick="closeAdminPanel()" 
                style="padding: 12px 24px; background-color: #95a5a6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background-color 0.2s;"
                onmouseover="this.style.backgroundColor='#7f8c8d'" 
                onmouseout="this.style.backgroundColor='#95a5a6'">
          Schließen
        </button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', adminHTML);
  
  
  document.getElementById('admin-close').addEventListener('click', closeAdminPanel);
  document.getElementById('admin-overlay').addEventListener('click', closeAdminPanel);
}

function loadAdminSessions() {
  const sessionsList = document.getElementById('admin-sessions-list');
  if (!sessionsList) return;
  
  sessionsList.innerHTML = '';
  
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  
  const futureSessions = sessions
    .filter(session => session.date >= today) 
    .sort((a, b) => a.date - b.date); 
  
  if (futureSessions.length === 0) {
    sessionsList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic; margin: 20px 0;">Keine zukünftigen Sessions gefunden.</p>';
    return;
  }
  
  futureSessions.forEach((session, originalIndex) => {
    
    const sessionIndex = sessions.findIndex(s => s.id === session.id);
    
    const sessionDiv = document.createElement('div');
    const isDarkMode = document.body.classList.contains('dark-mode');
    const cardBg = isDarkMode ? '#3a3a3a' : '#f9f9f9';
    const inputBg = isDarkMode ? '#2d2d2d' : '#ffffff';
    const inputColor = isDarkMode ? '#e0e0e0' : '#333';
    const borderColor = isDarkMode ? '#555' : '#ddd';
    const examColor = isDarkMode ? (session.isExam ? '#c0392b' : '#6c757d') : (session.isExam ? '#ff6b6b' : '#6c757d');
    const examHoverColor = isDarkMode ? (session.isExam ? '#a93226' : '#5a6268') : (session.isExam ? '#ff5252' : '#5a6268');
    
    sessionDiv.style.cssText = `
      border: 1px solid ${borderColor}; 
      padding: 20px; 
      margin: 15px 0; 
      border-radius: 10px; 
      background-color: ${cardBg};
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    
    const hasNote = session.note && session.note.trim();
    
    sessionDiv.innerHTML = `
      <div style="display: grid; grid-template-columns: 130px 90px 150px 40px 1fr 90px 90px; gap: 20px; align-items: center; margin-bottom: ${hasNote ? '10px' : '15px'};">
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: 500; color: ${inputColor}; font-size: 12px;">Datum:</label>
          <input type="date" value="${session.date.toISOString().split('T')[0]}" onchange="updateSessionWithSlot(${sessionIndex}, 'date', this.value)" 
                 style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background-color: ${inputBg}; color: ${inputColor}; font-size: 14px;">
        </div>
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: 500; color: ${inputColor}; font-size: 12px;">Typ:</label>
          <select onchange="updateSession(${sessionIndex}, 'sessionType', this.value)" 
                  style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background-color: ${inputBg}; color: ${inputColor}; font-size: 14px;">
            <option value="OPL" ${session.sessionType === 'OPL' ? 'selected' : ''}>OPL</option>
            <option value="DSL" ${session.sessionType === 'DSL' ? 'selected' : ''}>DSL</option>
            <option value="PPL" ${session.sessionType === 'PPL' ? 'selected' : ''}>PPL</option>
          </select>
        </div>
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: 500; color: ${inputColor}; font-size: 12px;">Modul:</label>
          <input type="text" value="${session.details}" onchange="updateSession(${sessionIndex}, 'details', this.value)" 
                 style="width: 30%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background-color: ${inputBg}; color: ${inputColor}; font-size: 14px;" 
                 placeholder="Modulnr">
        </div>
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: 500; color: ${inputColor}; font-size: 12px;">Prüfung:</label>
          <button onclick="toggleExam(${sessionIndex})" id="exam-toggle-${sessionIndex}"
                  style="width: 32px; height: 32px; padding: 4px; background-color: ${examColor}; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; transition: background-color 0.2s; display: flex; align-items: center; justify-content: center;"
                  onmouseover="this.style.backgroundColor='${examHoverColor}'" 
                  onmouseout="this.style.backgroundColor='${examColor}'"
                  title="${session.isExam ? 'Als normale Session markieren' : 'Als Prüfung markieren'}">
            <i class="fas fa-graduation-cap"></i>
          </button>
        </div>
        <div></div>
        <div>
          <label style="margin-left: 55%; display: block; margin-bottom: 5px; font-weight: 500; color: ${inputColor}; font-size: 12px;">Notiz:</label>
          <div style="display: flex; gap: 5px; margin-left: 55%;">
            <button onclick="toggleNote(${sessionIndex})" id="note-toggle-${sessionIndex}"
                    style="flex: 1; padding: 8px; background-color: #2D2D2D; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; transition: background-color 0.2s;"
                    onmouseover="this.style.backgroundColor='#535353ff'" 
                    onmouseout="this.style.backgroundColor='#2D2D2D'">
              ${hasNote ? 'Edit' : 'Add'}
            </button>
          </div>
        </div>
        <div style="margin-left: 20%; display: flex; align-items: end; margin-top: 12px;">
          <button onclick="deleteSession(${sessionIndex})" 
                  style="margin-top: 7px; padding: 8px 12px; background-color: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; transition: background-color 0.2s;"
                  onmouseover="this.style.backgroundColor='#c0392b'" 
                  onmouseout="this.style.backgroundColor='#e74c3c'">
            Delete
          </button>
        </div>
      </div>
      <div id="note-section-${sessionIndex}" style="display: ${hasNote ? 'block' : 'none'}; margin-top: 10px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: ${inputColor}; font-size: 12px;">Notiz bearbeiten:</label>
        <textarea onchange="updateSession(${sessionIndex}, 'note', this.value)" 
                  style="width: 98%; padding: 10px; border: 1px solid ${borderColor}; border-radius: 6px; background-color: ${inputBg}; color: ${inputColor}; font-size: 14px; min-height: 60px; resize: vertical;" 
                  placeholder="Optionale Notiz hinzufügen">${session.note || ''}</textarea>
      </div>
    `;
    
    sessionsList.appendChild(sessionDiv);
  });
}

function updateSession(index, field, value) {
  if (field === 'date') {
    sessions[index][field] = new Date(value);
  } else {
    sessions[index][field] = value;
  }
  console.log(`Updated session ${index}: ${field} = ${value}`);
}

function updateSessionWithSlot(index, field, value) {
  if (field === 'date') {
    const date = new Date(value);
    sessions[index][field] = date;
    
    
    const dayOfWeek = date.getDay(); 
    
    if (dayOfWeek === 1) { 
      sessions[index].slot = 'monday-morning';
    } else if (dayOfWeek === 2) { 
      sessions[index].slot = 'tuesday-afternoon';
    } else if (dayOfWeek === 5) { 
      sessions[index].slot = 'friday-afternoon';
    } else {
      
      sessions[index].slot = 'monday-morning';
    }
    
    console.log(`Updated session ${index}: date = ${value}, auto-assigned slot = ${sessions[index].slot}`);
  } else {
    updateSession(index, field, value);
  }
}

function toggleNote(index) {
  const noteSection = document.getElementById(`note-section-${index}`);
  const toggleButton = document.getElementById(`note-toggle-${index}`);
  
  if (noteSection) {
    const isVisible = noteSection.style.display !== 'none';
    noteSection.style.display = isVisible ? 'none' : 'block';
    
    
    if (toggleButton) {
      const hasNote = sessions[index].note && sessions[index].note.trim();
      if (isVisible) {
        
        toggleButton.textContent = hasNote ? 'Edit' : 'Add';
      } else {
        
        toggleButton.textContent = 'Close';
      }
    }
    
    
    if (!isVisible) {
      const textarea = noteSection.querySelector('textarea');
      if (textarea) {
        setTimeout(() => textarea.focus(), 100);
      }
    }
  }
}

function toggleExam(index) {
  sessions[index].isExam = !sessions[index].isExam;
  
  
  const examButton = document.getElementById(`exam-toggle-${index}`);
  if (examButton) {
    const isExam = sessions[index].isExam;
    examButton.style.backgroundColor = isExam ? '#ff6b6b' : '#6c757d';
    examButton.title = isExam ? 'Als normale Session markieren' : 'Als Prüfung markieren';
    
    
    examButton.onmouseover = () => {
      examButton.style.backgroundColor = isExam ? '#ff5252' : '#5a6268';
    };
    examButton.onmouseout = () => {
      examButton.style.backgroundColor = isExam ? '#ff6b6b' : '#6c757d';
    };
  }
  
  console.log(`Updated session ${index}: isExam = ${sessions[index].isExam}`);
}

async function deleteSession(index) {
  const confirmed = await showConfirmDialog('Möchten Sie diese Session wirklich löschen?');
  if (confirmed) {
    sessions.splice(index, 1);
    loadAdminSessions();
    showSuccessNotification('Session erfolgreich gelöscht!');
  }
}

function addNewSession() {
  const newSession = {
    id: Date.now().toString(),
    date: new Date(),
    sessionType: 'OPL',
    details: 'Neues Modul',
    note: '',
    slot: 'monday-morning',
    isExam: false
  };
  
  sessions.push(newSession);
  loadAdminSessions();
}

async function saveAllSessions() {
  const sessionsData = sessions.map(session => ({
    ...session,
    date: session.date.toISOString().split('T')[0]
  }));
  
  const success = await saveSessionsToJSON(sessionsData);
  if (success) {
    showSuccessNotification('Sessions erfolgreich gespeichert!');
    loadAllWeekSessions(); 
    loadExcelFilesTable(); 
  } else {
    showErrorNotification('Fehler beim Speichern der Sessions!');
  }
}

function closeAdminPanel() {
  isAdminMode = false;
  const adminPanel = document.getElementById('admin-panel');
  const adminOverlay = document.getElementById('admin-overlay');
  
  if (adminPanel) adminPanel.remove();
  if (adminOverlay) adminOverlay.remove();
  
  
  loadAllWeekSessions();
}

function editSession(slot) {
  if (!isAdminMode) return;
  
  const session = sessions.find(s => s.slot === slot);
  if (session) {
    
    showAdminPanel();
  } else {
    
    addNewSession();
    const newSession = sessions[sessions.length - 1];
    newSession.slot = slot;
    loadAdminSessions();
  }
}


document.addEventListener('keydown', function(event) {
  if (event.altKey && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (!isAdminMode) {
      showPasswordPrompt();
    } else {
      showAdminPanel();
    }
  }
  
  
  if (event.key === 'Escape') {
    if (document.getElementById('password-dialog')) {
      closePasswordDialog();
    } else if (isAdminMode && document.getElementById('admin-panel')) {
      closeAdminPanel();
    }
  }
});


function updateStatsPopupText() {
  
  const statsPopupTitle = document.querySelector('#stats-popup h2');
  if (statsPopupTitle) {
    statsPopupTitle.textContent = 'Statistik';
  }
  
  
  const statsButton = document.getElementById('stats-button');
  if (statsButton) {
    statsButton.title = 'Statistik anzeigen';
    statsButton.setAttribute('aria-label', 'Statistik anzeigen');
  }
  
  
  const translateStatsContent = function() {
    
    const statsContent = document.getElementById('stats-content');
    if (!statsContent) return;
    
    
    const textReplacements = {
      'Session Statistics': 'Statistik',
      'sessions': 'Einheiten',
      'session': 'Einheit',
      'Sessions': 'Einheiten',
      'Session': 'Einheit',
      'Total': 'Gesamt',
      'Upcoming': 'Bevorstehend',
      'DSL': 'DSL',
      'OPL': 'OPL',
      'PPL': 'PPL',
      'by type': 'nach Typ',
      'by module': 'nach Modul',
      'Close': 'Schließen',
      'Distribution': 'Verteilung',
      'Percentage': 'Prozentsatz',
      'Module': 'Modul',
      'Type': 'Typ',
      'Count': 'Anzahl'
    };
    
    
    let htmlContent = statsContent.innerHTML;
    for (const [english, german] of Object.entries(textReplacements)) {
      const regex = new RegExp(english, 'g');
      htmlContent = htmlContent.replace(regex, german);
    }
    statsContent.innerHTML = htmlContent;
  };
  
  
  const originalCreateStats = window.createStats || function(){};
  window.createStats = function() {
    originalCreateStats.apply(this, arguments);
    translateStatsContent();
  };
  
  
  translateStatsContent();
}


document.addEventListener('DOMContentLoaded', function() {
  updateStatsPopupText();
});

window.onload = function() {
  loadAllWeekSessions();  
  loadExcelFilesTable();  
  initDarkMode();
  initStatsButton();
  initCalendarButton();
};