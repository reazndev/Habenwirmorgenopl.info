// Class configuration - add new classes here
const CLASS_CONFIG = {
  i3a: {
    name: "I3A",
    label: "I3A",
    sessionsFile: "sessions-i3a.json",
    slots: [
      {
        id: "monday-morning",
        day: 1,
        period: "morning",
        label: "Montag",
        shortLabel: "MO",
      },
      {
        id: "tuesday-afternoon",
        day: 2,
        period: "afternoon",
        label: "Dienstag",
        shortLabel: "DI",
      },
      {
        id: "friday-afternoon",
        day: 5,
        period: "afternoon",
        label: "Freitag",
        shortLabel: "FR",
      },
    ],
    teachers: {
      "Colic (Montag)": { total: 0, OPL: 0, DSL: 0, PPL: 0 },
      "TBD (Dienstag)": { total: 0, OPL: 0, DSL: 0, PPL: 0 },
      "Colic (Freitag)": { total: 0, OPL: 0, DSL: 0, PPL: 0 },
    },
  },
  i2a: {
    name: "I2A",
    label: "I2A",
    sessionsFile: "sessions-i2a.json",
    slots: [
      {
        id: "monday-afternoon",
        day: 1,
        period: "afternoon",
        label: "Montag",
        shortLabel: "MO",
      },
      {
        id: "wednesday-afternoon",
        day: 3,
        period: "afternoon",
        label: "Mittwoch",
        shortLabel: "MI",
      },
      {
        id: "thursday-morning",
        day: 4,
        period: "morning",
        label: "Donnerstag",
        shortLabel: "DO",
      },
      {
        id: "friday-morning",
        day: 5,
        period: "morning",
        label: "Freitag",
        shortLabel: "FR",
      },
    ],
    teachers: {
      "Thut (Montag)": { total: 0, OPL: 0, DSL: 0, PPL: 0 },
      "Thut (Mittwoch)": { total: 0, OPL: 0, DSL: 0, PPL: 0 },
      "Rapisarda (Donnerstag)": { total: 0, OPL: 0, DSL: 0, PPL: 0 },
      "Schneider (Freitag)": { total: 0, OPL: 0, DSL: 0, PPL: 0 },
    },
  },
};

// Default class on first load
const DEFAULT_CLASS = "i3a";

// Get active class from localStorage or default
function getActiveClass() {
  return localStorage.getItem("activeClass") || DEFAULT_CLASS;
}

// Set active class
function setActiveClass(classId) {
  localStorage.setItem("activeClass", classId);
}

// Get config for active class
function getActiveClassConfig() {
  return CLASS_CONFIG[getActiveClass()];
}

// Auto-assign slot based on date and class config
function autoAssignSlot(date, classId) {
  const config = CLASS_CONFIG[classId || getActiveClass()];
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ...

  const matchingSlot = config.slots.find((s) => s.day === dayOfWeek);
  if (matchingSlot) {
    return matchingSlot.id;
  }
  // Fallback to first slot
  return config.slots[0].id;
}
