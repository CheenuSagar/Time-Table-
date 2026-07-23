/**
 * Helper to manage localStorage, import/export, and schedule compression for URL sharing.
 */

const STORAGE_KEYS = {
  TIMETABLE: 'lecalert_timetable',
  SETTINGS: 'lecalert_settings',
  GEMINI_KEY: 'lecalert_gemini_api_key',
  ACADEMIC_EVENTS: 'lecalert_academic_events'
};

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  notificationsEnabled: false,
  preTime: 5, // minutes before lecture
  alarmSound: 'chime',
  timeFormat12h: true
};

// Map class object to array elements to save URL length
// Order: [id, name, teacher, location, day, startTime, endTime, color]
function classToCompactArray(cls) {
  return [
    cls.id || '',
    cls.name || '',
    cls.teacher || '',
    cls.location || '',
    cls.day || '',
    cls.startTime || '',
    cls.endTime || '',
    cls.color || '#6366f1'
  ];
}

function compactArrayToClass(arr) {
  return {
    id: arr[0],
    name: arr[1],
    teacher: arr[2],
    location: arr[3],
    day: arr[4],
    startTime: arr[5],
    endTime: arr[6],
    color: arr[7]
  };
}

export const DEFAULT_TIMETABLE_A = [
  // --- MONDAY ---
  {
    id: "mca3a-mon-1",
    name: "Computer Networks (25CA303)",
    teacher: "Dr. Shikha Verma-SV",
    location: "AB-207",
    day: "Monday",
    startTime: "08:50",
    endTime: "09:40",
    color: "#3b82f6"
  },
  {
    id: "mca3a-mon-2",
    name: "Design & Analysis of Algorithm (25CA301)",
    teacher: "Ms. Savita Singh-SS",
    location: "AB-207",
    day: "Monday",
    startTime: "09:40",
    endTime: "10:30",
    color: "#6366f1"
  },
  {
    id: "mca3a-mon-3",
    name: "Agile S/w Dev & Testing (25CA302)",
    teacher: "Dr. Rajesh Kr. Maurya-RKM",
    location: "AB-207",
    day: "Monday",
    startTime: "10:40",
    endTime: "11:30",
    color: "#06b6d4"
  },
  {
    id: "mca3a-mon-4",
    name: "Elective-I: AML (25CA304-E1) / Cloud-II (E2)",
    teacher: "Ms. Shilpa Tyagi / Ms. Gunjan Agarwal / Ms. Kalpna Dwivedi",
    location: "AB-207/208/209",
    day: "Monday",
    startTime: "11:30",
    endTime: "12:20",
    color: "#8b5cf6"
  },
  {
    id: "mca3a-mon-lunch",
    name: "Lunch Break",
    teacher: "",
    location: "",
    day: "Monday",
    startTime: "12:20",
    endTime: "13:10",
    color: "#4b5563"
  },
  {
    id: "mca3a-mon-lab1",
    name: "Mini Project Lab (25CA353)",
    teacher: "SSH+ST",
    location: "AB-207",
    day: "Monday",
    startTime: "13:10",
    endTime: "14:00",
    color: "#10b981"
  },
  {
    id: "mca3a-mon-lab2",
    name: "Mini Project Lab (25CA353)",
    teacher: "SSH+ST",
    location: "AB-207",
    day: "Monday",
    startTime: "14:00",
    endTime: "14:50",
    color: "#10b981"
  },
  {
    id: "mca3a-mon-8",
    name: "Elective-II: Data Analytics (25DE002) / Cyber Security (25DE003)",
    teacher: "Ms. Priya Mishra / Ms. Surbhi Sharma / Mr. Chirag Jain",
    location: "AB-207/208/209",
    day: "Monday",
    startTime: "14:50",
    endTime: "15:40",
    color: "#f59e0b"
  },
  {
    id: "mca3a-mon-9",
    name: "Library",
    teacher: "",
    location: "Library",
    day: "Monday",
    startTime: "15:40",
    endTime: "16:30",
    color: "#f43f5e"
  },

  // --- TUESDAY ---
  {
    id: "mca3a-tue-1",
    name: "Elective-II: Data Analytics (25DE002) / Cyber Security (25DE003)",
    teacher: "Ms. Priya Mishra / Ms. Surbhi Sharma / Mr. Chirag Jain",
    location: "AB-207/208/209",
    day: "Tuesday",
    startTime: "08:50",
    endTime: "09:40",
    color: "#f59e0b"
  },
  {
    id: "mca3a-tue-2",
    name: "Computer Networks (25CA303)",
    teacher: "Dr. Shikha Verma-SV",
    location: "AB-207",
    day: "Tuesday",
    startTime: "09:40",
    endTime: "10:30",
    color: "#3b82f6"
  },
  {
    id: "mca3a-tue-3",
    name: "Mini Project Lab (25CA353)",
    teacher: "SSH+AL",
    location: "AB-207",
    day: "Tuesday",
    startTime: "10:40",
    endTime: "11:30",
    color: "#10b981"
  },
  {
    id: "mca3a-tue-4",
    name: "Elective-I: AML (25CA304-E1) / Cloud-II (E2)",
    teacher: "Ms. Shilpa Tyagi / Ms. Gunjan Agarwal / Ms. Kalpna Dwivedi",
    location: "AB-207/208/209",
    day: "Tuesday",
    startTime: "11:30",
    endTime: "12:20",
    color: "#8b5cf6"
  },
  {
    id: "mca3a-tue-lunch",
    name: "Lunch Break",
    teacher: "",
    location: "",
    day: "Tuesday",
    startTime: "12:20",
    endTime: "13:10",
    color: "#4b5563"
  },
  {
    id: "mca3a-tue-6",
    name: "Soft Skills - SS(N)",
    teacher: "Employability Skills (25HM301(T))",
    location: "AB-207",
    day: "Tuesday",
    startTime: "13:10",
    endTime: "14:00",
    color: "#f97316"
  },
  {
    id: "mca3a-tue-7",
    name: "Design & Analysis of Algorithm (25CA301)",
    teacher: "Ms. Savita Singh-SS",
    location: "AB-207",
    day: "Tuesday",
    startTime: "14:00",
    endTime: "14:50",
    color: "#6366f1"
  },
  {
    id: "mca3a-tue-8",
    name: "Agile S/w Dev & Testing (25CA302)",
    teacher: "Dr. Rajesh Kr. Maurya-RKM",
    location: "AB-207",
    day: "Tuesday",
    startTime: "14:50",
    endTime: "15:40",
    color: "#06b6d4"
  },
  {
    id: "mca3a-tue-9",
    name: "Library",
    teacher: "",
    location: "Library",
    day: "Tuesday",
    startTime: "15:40",
    endTime: "16:30",
    color: "#f43f5e"
  },

  // --- WEDNESDAY ---
  {
    id: "mca3a-wed-1",
    name: "Agile S/w Dev & Testing (25CA302)",
    teacher: "Dr. Rajesh Kr. Maurya-RKM",
    location: "AB-207",
    day: "Wednesday",
    startTime: "08:50",
    endTime: "09:40",
    color: "#06b6d4"
  },
  {
    id: "mca3a-wed-2",
    name: "Elective-I: AML (25CA304-E1) / Cloud-II (E2)",
    teacher: "Ms. Shilpa Tyagi / Ms. Gunjan Agarwal / Ms. Kalpna Dwivedi",
    location: "AB-207/208/209",
    day: "Wednesday",
    startTime: "09:40",
    endTime: "10:30",
    color: "#8b5cf6"
  },
  {
    id: "mca3a-wed-3",
    name: "Quantitative Aptitude - QA(N-2)",
    teacher: "Employability Skills (25HM301(T))",
    location: "AB-207",
    day: "Wednesday",
    startTime: "10:40",
    endTime: "11:30",
    color: "#f97316"
  },
  {
    id: "mca3a-wed-4",
    name: "Elective-II: Data Analytics (25DE002) / Cyber Security (25DE003)",
    teacher: "Ms. Priya Mishra / Ms. Surbhi Sharma / Mr. Chirag Jain",
    location: "AB-207/208/209",
    day: "Wednesday",
    startTime: "11:30",
    endTime: "12:20",
    color: "#f59e0b"
  },
  {
    id: "mca3a-wed-lunch",
    name: "Lunch Break",
    teacher: "",
    location: "",
    day: "Wednesday",
    startTime: "12:20",
    endTime: "13:10",
    color: "#4b5563"
  },
  {
    id: "mca3a-wed-6",
    name: "Computer Networks (25CA303)",
    teacher: "Dr. Shikha Verma-SV",
    location: "AB-207",
    day: "Wednesday",
    startTime: "13:10",
    endTime: "14:00",
    color: "#3b82f6"
  },
  {
    id: "mca3a-wed-7",
    name: "Design & Analysis of Algorithm (25CA301)",
    teacher: "Ms. Savita Singh-SS",
    location: "AB-207",
    day: "Wednesday",
    startTime: "14:00",
    endTime: "14:50",
    color: "#6366f1"
  },
  {
    id: "mca3a-wed-lab1",
    name: "Full Stack Lab (25VC352)",
    teacher: "HJ+CJ",
    location: "AB-207",
    day: "Wednesday",
    startTime: "14:50",
    endTime: "15:40",
    color: "#10b981"
  },
  {
    id: "mca3a-wed-lab2",
    name: "Full Stack Lab (25VC352)",
    teacher: "HJ+CJ",
    location: "AB-207",
    day: "Wednesday",
    startTime: "15:40",
    endTime: "16:30",
    color: "#10b981"
  },

  // --- THURSDAY ---
  {
    id: "mca3a-thu-1",
    name: "Elective-I: AML (25CA304-E1) / Cloud-II (E2)",
    teacher: "Ms. Shilpa Tyagi / Ms. Gunjan Agarwal / Ms. Kalpna Dwivedi",
    location: "AB-207/208/209",
    day: "Thursday",
    startTime: "08:50",
    endTime: "09:40",
    color: "#8b5cf6"
  },
  {
    id: "mca3a-thu-2",
    name: "Agile S/w Dev & Testing (25CA302)",
    teacher: "Dr. Rajesh Kr. Maurya-RKM",
    location: "AB-207",
    day: "Thursday",
    startTime: "09:40",
    endTime: "10:30",
    color: "#06b6d4"
  },
  {
    id: "mca3a-thu-3",
    name: "Computer Networks (25CA303)",
    teacher: "Dr. Shikha Verma-SV",
    location: "AB-207",
    day: "Thursday",
    startTime: "10:40",
    endTime: "11:30",
    color: "#3b82f6"
  },
  {
    id: "mca3a-thu-4",
    name: "Design & Analysis of Algorithm (25CA301)",
    teacher: "Ms. Savita Singh-SS",
    location: "AB-207",
    day: "Thursday",
    startTime: "11:30",
    endTime: "12:20",
    color: "#6366f1"
  },
  {
    id: "mca3a-thu-lunch",
    name: "Lunch Break",
    teacher: "",
    location: "",
    day: "Thursday",
    startTime: "12:20",
    endTime: "13:10",
    color: "#4b5563"
  },
  {
    id: "mca3a-thu-lab1",
    name: "DAA Lab (25CA351)",
    teacher: "SS+GA",
    location: "AB-207",
    day: "Thursday",
    startTime: "13:10",
    endTime: "14:00",
    color: "#10b981"
  },
  {
    id: "mca3a-thu-lab2",
    name: "DAA Lab (25CA351)",
    teacher: "SS+GA",
    location: "AB-207",
    day: "Thursday",
    startTime: "14:00",
    endTime: "14:50",
    color: "#10b981"
  },
  {
    id: "mca3a-thu-8",
    name: "Elective-II: Data Analytics (25DE002) / Cyber Security (25DE003)",
    teacher: "Ms. Priya Mishra / Ms. Surbhi Sharma / Mr. Chirag Jain",
    location: "AB-207/208/209",
    day: "Thursday",
    startTime: "14:50",
    endTime: "15:40",
    color: "#f59e0b"
  },
  {
    id: "mca3a-thu-9",
    name: "Computer Networks (25CA303)",
    teacher: "Dr. Shikha Verma-SV",
    location: "AB-207",
    day: "Thursday",
    startTime: "15:40",
    endTime: "16:30",
    color: "#3b82f6"
  },

  // --- FRIDAY ---
  {
    id: "mca3a-fri-1",
    name: "Design & Analysis of Algorithm (25CA301)",
    teacher: "Ms. Savita Singh-SS",
    location: "AB-207",
    day: "Friday",
    startTime: "08:50",
    endTime: "09:40",
    color: "#6366f1"
  },
  {
    id: "mca3a-fri-2",
    name: "Elective-II: Data Analytics (25DE002) / Cyber Security (25DE003)",
    teacher: "Ms. Priya Mishra / Ms. Surbhi Sharma / Mr. Chirag Jain",
    location: "AB-207/208/209",
    day: "Friday",
    startTime: "09:40",
    endTime: "10:30",
    color: "#f59e0b"
  },
  {
    id: "mca3a-fri-lab1",
    name: "DAA Lab (25CA351)",
    teacher: "SS+AP",
    location: "AB-207",
    day: "Friday",
    startTime: "10:40",
    endTime: "11:30",
    color: "#10b981"
  },
  {
    id: "mca3a-fri-lab2",
    name: "DAA Lab (25CA351)",
    teacher: "SS+AP",
    location: "AB-207",
    day: "Friday",
    startTime: "11:30",
    endTime: "12:20",
    color: "#10b981"
  },
  {
    id: "mca3a-fri-lunch",
    name: "Lunch Break",
    teacher: "",
    location: "",
    day: "Friday",
    startTime: "12:20",
    endTime: "13:10",
    color: "#4b5563"
  },
  {
    id: "mca3a-fri-6",
    name: "Elective-I: AML (25CA304-E1) / Cloud-II (E2)",
    teacher: "Ms. Shilpa Tyagi / Ms. Gunjan Agarwal / Ms. Kalpna Dwivedi",
    location: "AB-207/208/209",
    day: "Friday",
    startTime: "13:10",
    endTime: "14:00",
    color: "#8b5cf6"
  },
  {
    id: "mca3a-fri-7",
    name: "Agile S/w Dev & Testing (25CA302)",
    teacher: "Dr. Rajesh Kr. Maurya-RKM",
    location: "AB-207",
    day: "Friday",
    startTime: "14:00",
    endTime: "14:50",
    color: "#06b6d4"
  },
  {
    id: "mca3a-fri-meeting",
    name: "Mentor Mentee Meeting",
    teacher: "Group A1-KD / Group A2-AL",
    location: "AB-207",
    day: "Friday",
    startTime: "14:50",
    endTime: "16:30",
    color: "#f97316"
  }
];

export const DEFAULT_TIMETABLE_B = [
  // --- MONDAY ---
  {
    id: "mca3b-mon-1",
    name: "Design & Analysis of Algorithm (25CA301)",
    teacher: "Ms. Meghna Gupta-MG",
    location: "AB-208",
    day: "Monday",
    startTime: "08:50",
    endTime: "09:40",
    color: "#6366f1"
  },
  {
    id: "mca3b-mon-2",
    name: "Agile S/w Dev & Testing (25CA302)",
    teacher: "Dr. Rajesh Kr. Maurya-RKM",
    location: "AB-208",
    day: "Monday",
    startTime: "09:40",
    endTime: "10:30",
    color: "#06b6d4"
  },
  {
    id: "mca3b-mon-3",
    name: "Computer Networks (25CA303)",
    teacher: "Dr. Shikha Verma-SV",
    location: "AB-208",
    day: "Monday",
    startTime: "10:40",
    endTime: "11:30",
    color: "#3b82f6"
  },
  {
    id: "mca3b-mon-4",
    name: "Elective-I: AML (25CA304-E1) / Cloud-II (E2)",
    teacher: "Ms. Shilpa Tyagi / Ms. Gunjan Agarwal / Ms. Kalpna Dwivedi",
    location: "AB-207/208/209",
    day: "Monday",
    startTime: "11:30",
    endTime: "12:20",
    color: "#8b5cf6"
  },
  {
    id: "mca3b-mon-lunch",
    name: "Lunch Break",
    teacher: "",
    location: "",
    day: "Monday",
    startTime: "12:20",
    endTime: "13:10",
    color: "#4b5563"
  },
  {
    id: "mca3b-mon-lab1",
    name: "DAA Lab (25CA351)",
    teacher: "SS+AP",
    location: "AB-208",
    day: "Monday",
    startTime: "13:10",
    endTime: "14:00",
    color: "#10b981"
  },
  {
    id: "mca3b-mon-lab2",
    name: "DAA Lab (25CA351)",
    teacher: "SS+AP",
    location: "AB-208",
    day: "Monday",
    startTime: "14:00",
    endTime: "14:50",
    color: "#10b981"
  },
  {
    id: "mca3b-mon-8",
    name: "Elective-II: Data Analytics (25DE002) / Cyber Security (25DE003)",
    teacher: "Ms. Priya Mishra / Ms. Surbhi Sharma / Mr. Chirag Jain",
    location: "AB-207/208/209",
    day: "Monday",
    startTime: "14:50",
    endTime: "15:40",
    color: "#f59e0b"
  },
  {
    id: "mca3b-mon-9",
    name: "Library",
    teacher: "",
    location: "Library",
    day: "Monday",
    startTime: "15:40",
    endTime: "16:30",
    color: "#f43f5e"
  },

  // --- TUESDAY ---
  {
    id: "mca3b-tue-1",
    name: "Elective-II: Data Analytics (25DE002) / Cyber Security (25DE003)",
    teacher: "Ms. Priya Mishra / Ms. Surbhi Sharma / Mr. Chirag Jain",
    location: "AB-207/208/209",
    day: "Tuesday",
    startTime: "08:50",
    endTime: "09:40",
    color: "#f59e0b"
  },
  {
    id: "mca3b-tue-2",
    name: "Agile S/w Dev & Testing (25CA302)",
    teacher: "Dr. Rajesh Kr. Maurya-RKM",
    location: "AB-208",
    day: "Tuesday",
    startTime: "09:40",
    endTime: "10:30",
    color: "#06b6d4"
  },
  {
    id: "mca3b-tue-3",
    name: "Design & Analysis of Algorithm (25CA301)",
    teacher: "Ms. Meghna Gupta-MG",
    location: "AB-208",
    day: "Tuesday",
    startTime: "10:40",
    endTime: "11:30",
    color: "#6366f1"
  },
  {
    id: "mca3b-tue-4",
    name: "Elective-I: AML (25CA304-E1) / Cloud-II (E2)",
    teacher: "Ms. Shilpa Tyagi / Ms. Gunjan Agarwal / Ms. Kalpna Dwivedi",
    location: "AB-207/208/209",
    day: "Tuesday",
    startTime: "11:30",
    endTime: "12:20",
    color: "#8b5cf6"
  },
  {
    id: "mca3b-tue-lunch",
    name: "Lunch Break",
    teacher: "",
    location: "",
    day: "Tuesday",
    startTime: "12:20",
    endTime: "13:10",
    color: "#4b5563"
  },
  {
    id: "mca3b-tue-lab1",
    name: "DAA Lab (25CA351)",
    teacher: "MG+HJ",
    location: "AB-208",
    day: "Tuesday",
    startTime: "13:10",
    endTime: "14:00",
    color: "#10b981"
  },
  {
    id: "mca3b-tue-lab2",
    name: "DAA Lab (25CA351)",
    teacher: "MG+HJ",
    location: "AB-208",
    day: "Tuesday",
    startTime: "14:00",
    endTime: "14:50",
    color: "#10b981"
  },
  {
    id: "mca3b-tue-8",
    name: "Computer Networks (25CA303)",
    teacher: "Dr. Shikha Verma-SV",
    location: "AB-208",
    day: "Tuesday",
    startTime: "14:50",
    endTime: "15:40",
    color: "#3b82f6"
  },
  {
    id: "mca3b-tue-9",
    name: "Library",
    teacher: "",
    location: "Library",
    day: "Tuesday",
    startTime: "15:40",
    endTime: "16:30",
    color: "#f43f5e"
  },

  // --- WEDNESDAY ---
  {
    id: "mca3b-wed-1",
    name: "Computer Networks (25CA303)",
    teacher: "Dr. Shikha Verma-SV",
    location: "AB-208",
    day: "Wednesday",
    startTime: "08:50",
    endTime: "09:40",
    color: "#3b82f6"
  },
  {
    id: "mca3b-wed-2",
    name: "Elective-I: AML (25CA304-E1) / Cloud-II (E2)",
    teacher: "Ms. Shilpa Tyagi / Ms. Gunjan Agarwal / Ms. Kalpna Dwivedi",
    location: "AB-207/208/209",
    day: "Wednesday",
    startTime: "09:40",
    endTime: "10:30",
    color: "#8b5cf6"
  },
  {
    id: "mca3b-wed-3",
    name: "Design & Analysis of Algorithm (25CA301)",
    teacher: "Ms. Meghna Gupta-MG",
    location: "AB-208",
    day: "Wednesday",
    startTime: "10:40",
    endTime: "11:30",
    color: "#6366f1"
  },
  {
    id: "mca3b-wed-4",
    name: "Elective-II: Data Analytics (25DE002) / Cyber Security (25DE003)",
    teacher: "Ms. Priya Mishra / Ms. Surbhi Sharma / Mr. Chirag Jain",
    location: "AB-207/208/209",
    day: "Wednesday",
    startTime: "11:30",
    endTime: "12:20",
    color: "#f59e0b"
  },
  {
    id: "mca3b-wed-lunch",
    name: "Lunch Break",
    teacher: "",
    location: "",
    day: "Wednesday",
    startTime: "12:20",
    endTime: "13:10",
    color: "#4b5563"
  },
  {
    id: "mca3b-wed-6",
    name: "Quantitative Aptitude - QA(N-2)",
    teacher: "Employability Skills (25HM301(T))",
    location: "AB-208",
    day: "Wednesday",
    startTime: "13:10",
    endTime: "14:00",
    color: "#f97316"
  },
  {
    id: "mca3b-wed-7",
    name: "Agile S/w Dev & Testing (25CA302)",
    teacher: "Dr. Rajesh Kr. Maurya-RKM",
    location: "AB-208",
    day: "Wednesday",
    startTime: "14:00",
    endTime: "14:50",
    color: "#06b6d4"
  },
  {
    id: "mca3b-wed-lab1",
    name: "Mini Project Lab (25CA353)",
    teacher: "AK+AL",
    location: "AB-208",
    day: "Wednesday",
    startTime: "14:50",
    endTime: "15:40",
    color: "#10b981"
  },
  {
    id: "mca3b-wed-lab2",
    name: "Mini Project Lab (25CA353)",
    teacher: "AK+AL",
    location: "AB-208",
    day: "Wednesday",
    startTime: "15:40",
    endTime: "16:30",
    color: "#10b981"
  },

  // --- THURSDAY ---
  {
    id: "mca3b-thu-1",
    name: "Elective-I: AML (25CA304-E1) / Cloud-II (E2)",
    teacher: "Ms. Shilpa Tyagi / Ms. Gunjan Agarwal / Ms. Kalpna Dwivedi",
    location: "AB-207/208/209",
    day: "Thursday",
    startTime: "08:50",
    endTime: "09:40",
    color: "#8b5cf6"
  },
  {
    id: "mca3b-thu-lab1",
    name: "Full Stack Lab (25VC352)",
    teacher: "HJ+CJ",
    location: "AB-208",
    day: "Thursday",
    startTime: "09:40",
    endTime: "10:30",
    color: "#10b981"
  },
  {
    id: "mca3b-thu-lab2",
    name: "Full Stack Lab (25VC352)",
    teacher: "HJ+CJ",
    location: "AB-208",
    day: "Thursday",
    startTime: "10:40",
    endTime: "11:30",
    color: "#10b981"
  },
  {
    id: "mca3b-thu-4",
    name: "Agile S/w Dev & Testing (25CA302)",
    teacher: "Dr. Rajesh Kr. Maurya-RKM",
    location: "AB-208",
    day: "Thursday",
    startTime: "11:30",
    endTime: "12:20",
    color: "#06b6d4"
  },
  {
    id: "mca3b-thu-lunch",
    name: "Lunch Break",
    teacher: "",
    location: "",
    day: "Thursday",
    startTime: "12:20",
    endTime: "13:10",
    color: "#4b5563"
  },
  {
    id: "mca3b-thu-6",
    name: "Computer Networks (25CA303)",
    teacher: "Dr. Shikha Verma-SV",
    location: "AB-208",
    day: "Thursday",
    startTime: "13:10",
    endTime: "14:00",
    color: "#3b82f6"
  },
  {
    id: "mca3b-thu-7",
    name: "Design & Analysis of Algorithm (25CA301)",
    teacher: "Ms. Meghna Gupta-MG",
    location: "AB-208",
    day: "Thursday",
    startTime: "14:00",
    endTime: "14:50",
    color: "#6366f1"
  },
  {
    id: "mca3b-thu-8",
    name: "Elective-II: Data Analytics (25DE002) / Cyber Security (25DE003)",
    teacher: "Ms. Priya Mishra / Ms. Surbhi Sharma / Mr. Chirag Jain",
    location: "AB-207/208/209",
    day: "Thursday",
    startTime: "14:50",
    endTime: "15:40",
    color: "#f59e0b"
  },
  {
    id: "mca3b-thu-9",
    name: "Mini Project Lab (25CA353)",
    teacher: "AK+AL",
    location: "AB-208",
    day: "Thursday",
    startTime: "15:40",
    endTime: "16:30",
    color: "#10b981"
  },

  // --- FRIDAY ---
  {
    id: "mca3b-fri-1",
    name: "Design & Analysis of Algorithm (25CA301)",
    teacher: "Ms. Meghna Gupta-MG",
    location: "AB-208",
    day: "Friday",
    startTime: "08:50",
    endTime: "09:40",
    color: "#6366f1"
  },
  {
    id: "mca3b-fri-2",
    name: "Elective-II: Data Analytics (25DE002) / Cyber Security (25DE003)",
    teacher: "Ms. Priya Mishra / Ms. Surbhi Sharma / Mr. Chirag Jain",
    location: "AB-207/208/209",
    day: "Friday",
    startTime: "09:40",
    endTime: "10:30",
    color: "#f59e0b"
  },
  {
    id: "mca3b-fri-3",
    name: "Agile S/w Dev & Testing (25CA302)",
    teacher: "Dr. Rajesh Kr. Maurya-RKM",
    location: "AB-208",
    day: "Friday",
    startTime: "10:40",
    endTime: "11:30",
    color: "#06b6d4"
  },
  {
    id: "mca3b-fri-4",
    name: "Computer Networks (25CA303)",
    teacher: "Dr. Shikha Verma-SV",
    location: "AB-208",
    day: "Friday",
    startTime: "11:30",
    endTime: "12:20",
    color: "#3b82f6"
  },
  {
    id: "mca3b-fri-lunch",
    name: "Lunch Break",
    teacher: "",
    location: "",
    day: "Friday",
    startTime: "12:20",
    endTime: "13:10",
    color: "#4b5563"
  },
  {
    id: "mca3b-fri-6",
    name: "Elective-I: AML (25CA304-E1) / Cloud-II (E2)",
    teacher: "Ms. Shilpa Tyagi / Ms. Gunjan Agarwal / Ms. Kalpna Dwivedi",
    location: "AB-207/208/209",
    day: "Friday",
    startTime: "13:10",
    endTime: "14:00",
    color: "#8b5cf6"
  },
  {
    id: "mca3b-fri-7",
    name: "Soft Skills - SS(N)",
    teacher: "Employability Skills (25HM301(T))",
    location: "AB-208",
    day: "Friday",
    startTime: "14:00",
    endTime: "14:50",
    color: "#f97316"
  },
  {
    id: "mca3b-fri-meeting",
    name: "Mentor Mentee Meeting",
    teacher: "Group B1-GA / Group B2-ST",
    location: "AB-208",
    day: "Friday",
    startTime: "14:50",
    endTime: "16:30",
    color: "#f97316"
  }
];

export const DEFAULT_TIMETABLE_C = [
  // --- MONDAY ---
  {
    id: "mca3c-mon-1",
    name: "Agile S/w Dev & Testing (25CA302)",
    teacher: "Mr. Tarun Kr. Sharma-TKS",
    location: "AB-209",
    day: "Monday",
    startTime: "08:50",
    endTime: "09:40",
    color: "#06b6d4"
  },
  {
    id: "mca3c-mon-lab1",
    name: "Full Stack Lab (25VC352)",
    teacher: "HJ+CJ",
    location: "AB-209",
    day: "Monday",
    startTime: "09:40",
    endTime: "10:30",
    color: "#10b981"
  },
  {
    id: "mca3c-mon-lab2",
    name: "Full Stack Lab (25VC352)",
    teacher: "HJ+CJ",
    location: "AB-209",
    day: "Monday",
    startTime: "10:40",
    endTime: "11:30",
    color: "#10b981"
  },
  {
    id: "mca3c-mon-4",
    name: "Elective-I: AML (25CA304-E1) / Cloud-II (E2)",
    teacher: "Ms. Shilpa Tyagi / Ms. Gunjan Agarwal / Ms. Kalpna Dwivedi",
    location: "AB-207/208/209",
    day: "Monday",
    startTime: "11:30",
    endTime: "12:20",
    color: "#8b5cf6"
  },
  {
    id: "mca3c-mon-lunch",
    name: "Lunch Break",
    teacher: "",
    location: "",
    day: "Monday",
    startTime: "12:20",
    endTime: "13:10",
    color: "#4b5563"
  },
  {
    id: "mca3c-mon-6",
    name: "Computer Networks (25CA303)",
    teacher: "Mr. Ajay Kumar-AK",
    location: "AB-209",
    day: "Monday",
    startTime: "13:10",
    endTime: "14:00",
    color: "#3b82f6"
  },
  {
    id: "mca3c-mon-7",
    name: "Design & Analysis of Algorithm (25CA301)",
    teacher: "Ms. Meghna Gupta-MG",
    location: "AB-209",
    day: "Monday",
    startTime: "14:00",
    endTime: "14:50",
    color: "#6366f1"
  },
  {
    id: "mca3c-mon-8",
    name: "Elective-II: Data Analytics (25DE002) / Cyber Security (25DE003)",
    teacher: "Ms. Priya Mishra / Ms. Surbhi Sharma / Mr. Chirag Jain",
    location: "AB-207/208/209",
    day: "Monday",
    startTime: "14:50",
    endTime: "15:40",
    color: "#f59e0b"
  },
  {
    id: "mca3c-mon-9",
    name: "Library",
    teacher: "",
    location: "Library",
    day: "Monday",
    startTime: "15:40",
    endTime: "16:30",
    color: "#f43f5e"
  },

  // --- TUESDAY ---
  {
    id: "mca3c-tue-1",
    name: "Elective-II: Data Analytics (25DE002) / Cyber Security (25DE003)",
    teacher: "Ms. Priya Mishra / Ms. Surbhi Sharma / Mr. Chirag Jain",
    location: "AB-207/208/209",
    day: "Tuesday",
    startTime: "08:50",
    endTime: "09:40",
    color: "#f59e0b"
  },
  {
    id: "mca3c-tue-lab1",
    name: "DAA Lab (25CA351)",
    teacher: "SS+GA",
    location: "AB-209",
    day: "Tuesday",
    startTime: "09:40",
    endTime: "10:30",
    color: "#10b981"
  },
  {
    id: "mca3c-tue-lab2",
    name: "DAA Lab (25CA351)",
    teacher: "SS+GA",
    location: "AB-209",
    day: "Tuesday",
    startTime: "10:40",
    endTime: "11:30",
    color: "#10b981"
  },
  {
    id: "mca3c-tue-4",
    name: "Elective-I: AML (25CA304-E1) / Cloud-II (E2)",
    teacher: "Ms. Shilpa Tyagi / Ms. Gunjan Agarwal / Ms. Kalpna Dwivedi",
    location: "AB-207/208/209",
    day: "Tuesday",
    startTime: "11:30",
    endTime: "12:20",
    color: "#8b5cf6"
  },
  {
    id: "mca3c-tue-lunch",
    name: "Lunch Break",
    teacher: "",
    location: "",
    day: "Tuesday",
    startTime: "12:20",
    endTime: "13:10",
    color: "#4b5563"
  },
  {
    id: "mca3c-tue-lab3",
    name: "Mini Project Lab (25CA353)",
    teacher: "TKS+AL",
    location: "AB-209",
    day: "Tuesday",
    startTime: "13:10",
    endTime: "14:00",
    color: "#10b981"
  },
  {
    id: "mca3c-tue-7",
    name: "Computer Networks (25CA303)",
    teacher: "Mr. Ajay Kumar-AK",
    location: "AB-209",
    day: "Tuesday",
    startTime: "14:00",
    endTime: "14:50",
    color: "#3b82f6"
  },
  {
    id: "mca3c-tue-8",
    name: "Design & Analysis of Algorithm (25CA301)",
    teacher: "Ms. Meghna Gupta-MG",
    location: "AB-209",
    day: "Tuesday",
    startTime: "14:50",
    endTime: "15:40",
    color: "#6366f1"
  },
  {
    id: "mca3c-tue-9",
    name: "Library",
    teacher: "",
    location: "Library",
    day: "Tuesday",
    startTime: "15:40",
    endTime: "16:30",
    color: "#f43f5e"
  },

  // --- WEDNESDAY ---
  {
    id: "mca3c-wed-1",
    name: "Design & Analysis of Algorithm (25CA301)",
    teacher: "Ms. Meghna Gupta-MG",
    location: "AB-209",
    day: "Wednesday",
    startTime: "08:50",
    endTime: "09:40",
    color: "#6366f1"
  },
  {
    id: "mca3c-wed-2",
    name: "Elective-I: AML (25CA304-E1) / Cloud-II (E2)",
    teacher: "Ms. Shilpa Tyagi / Ms. Gunjan Agarwal / Ms. Kalpna Dwivedi",
    location: "AB-207/208/209",
    day: "Wednesday",
    startTime: "09:40",
    endTime: "10:30",
    color: "#8b5cf6"
  },
  {
    id: "mca3c-wed-3",
    name: "Computer Networks (25CA303)",
    teacher: "Mr. Ajay Kumar-AK",
    location: "AB-209",
    day: "Wednesday",
    startTime: "10:40",
    endTime: "11:30",
    color: "#3b82f6"
  },
  {
    id: "mca3c-wed-4",
    name: "Elective-II: Data Analytics (25DE002) / Cyber Security (25DE003)",
    teacher: "Ms. Priya Mishra / Ms. Surbhi Sharma / Mr. Chirag Jain",
    location: "AB-207/208/209",
    day: "Wednesday",
    startTime: "11:30",
    endTime: "12:20",
    color: "#f59e0b"
  },
  {
    id: "mca3c-wed-lunch",
    name: "Lunch Break",
    teacher: "",
    location: "",
    day: "Wednesday",
    startTime: "12:20",
    endTime: "13:10",
    color: "#4b5563"
  },
  {
    id: "mca3c-wed-lab1",
    name: "DAA Lab (25CA351)",
    teacher: "MG+GA",
    location: "AB-209",
    day: "Wednesday",
    startTime: "13:10",
    endTime: "14:00",
    color: "#10b981"
  },
  {
    id: "mca3c-wed-lab2",
    name: "DAA Lab (25CA351)",
    teacher: "MG+GA",
    location: "AB-209",
    day: "Wednesday",
    startTime: "14:00",
    endTime: "14:50",
    color: "#10b981"
  },
  {
    id: "mca3c-wed-8",
    name: "Design & Analysis of Algorithm (25CA301)",
    teacher: "Ms. Meghna Gupta-MG",
    location: "AB-209",
    day: "Wednesday",
    startTime: "14:50",
    endTime: "15:40",
    color: "#6366f1"
  },
  {
    id: "mca3c-wed-9",
    name: "Quantitative Aptitude - QA(N-2)",
    teacher: "Employability Skills (25HM301(T))",
    location: "AB-209",
    day: "Wednesday",
    startTime: "15:40",
    endTime: "16:30",
    color: "#f97316"
  },

  // --- THURSDAY ---
  {
    id: "mca3c-thu-1",
    name: "Elective-I: AML (25CA304-E1) / Cloud-II (E2)",
    teacher: "Ms. Shilpa Tyagi / Ms. Gunjan Agarwal / Ms. Kalpna Dwivedi",
    location: "AB-207/208/209",
    day: "Thursday",
    startTime: "08:50",
    endTime: "09:40",
    color: "#8b5cf6"
  },
  {
    id: "mca3c-thu-2",
    name: "Computer Networks (25CA303)",
    teacher: "Mr. Ajay Kumar-AK",
    location: "AB-209",
    day: "Thursday",
    startTime: "09:40",
    endTime: "10:30",
    color: "#3b82f6"
  },
  {
    id: "mca3c-thu-3",
    name: "Computer Networks (25CA303)",
    teacher: "Mr. Ajay Kumar-AK",
    location: "AB-209",
    day: "Thursday",
    startTime: "10:40",
    endTime: "11:30",
    color: "#3b82f6"
  },
  {
    id: "mca3c-thu-4",
    name: "Soft Skills - SS(N)",
    teacher: "Employability Skills (25HM301(T))",
    location: "AB-209",
    day: "Thursday",
    startTime: "11:30",
    endTime: "12:20",
    color: "#f97316"
  },
  {
    id: "mca3c-thu-lunch",
    name: "Lunch Break",
    teacher: "",
    location: "",
    day: "Thursday",
    startTime: "12:20",
    endTime: "13:10",
    color: "#4b5563"
  },
  {
    id: "mca3c-thu-lab1",
    name: "Mini Project Lab (25CA353)",
    teacher: "TKS+PM",
    location: "AB-209",
    day: "Thursday",
    startTime: "13:10",
    endTime: "14:00",
    color: "#10b981"
  },
  {
    id: "mca3c-thu-lab2",
    name: "Mini Project Lab (25CA353)",
    teacher: "TKS+PM",
    location: "AB-209",
    day: "Thursday",
    startTime: "14:00",
    endTime: "14:50",
    color: "#10b981"
  },
  {
    id: "mca3c-thu-8",
    name: "Elective-II: Data Analytics (25DE002) / Cyber Security (25DE003)",
    teacher: "Ms. Priya Mishra / Ms. Surbhi Sharma / Mr. Chirag Jain",
    location: "AB-207/208/209",
    day: "Thursday",
    startTime: "14:50",
    endTime: "15:40",
    color: "#f59e0b"
  },
  {
    id: "mca3c-thu-9",
    name: "Design & Analysis of Algorithm (25CA301)",
    teacher: "Ms. Meghna Gupta-MG",
    location: "AB-209",
    day: "Thursday",
    startTime: "15:40",
    endTime: "16:30",
    color: "#6366f1"
  },

  // --- FRIDAY ---
  {
    id: "mca3c-fri-1",
    name: "Computer Networks (25CA303)",
    teacher: "Mr. Ajay Kumar-AK",
    location: "AB-209",
    day: "Friday",
    startTime: "08:50",
    endTime: "09:40",
    color: "#3b82f6"
  },
  {
    id: "mca3c-fri-2",
    name: "Elective-II: Data Analytics (25DE002) / Cyber Security (25DE003)",
    teacher: "Ms. Priya Mishra / Ms. Surbhi Sharma / Mr. Chirag Jain",
    location: "AB-207/208/209",
    day: "Friday",
    startTime: "09:40",
    endTime: "10:30",
    color: "#f59e0b"
  },
  {
    id: "mca3c-fri-3",
    name: "Agile S/w Dev & Testing (25CA302)",
    teacher: "Mr. Tarun Kr. Sharma-TKS",
    location: "AB-209",
    day: "Friday",
    startTime: "10:40",
    endTime: "11:30",
    color: "#06b6d4"
  },
  {
    id: "mca3c-fri-4",
    name: "Agile S/w Dev & Testing (25CA302)",
    teacher: "Mr. Tarun Kr. Sharma-TKS",
    location: "AB-209",
    day: "Friday",
    startTime: "11:30",
    endTime: "12:20",
    color: "#06b6d4"
  },
  {
    id: "mca3c-fri-lunch",
    name: "Lunch Break",
    teacher: "",
    location: "",
    day: "Friday",
    startTime: "12:20",
    endTime: "13:10",
    color: "#4b5563"
  },
  {
    id: "mca3c-fri-6",
    name: "Elective-I: AML (25CA304-E1) / Cloud-II (E2)",
    teacher: "Ms. Shilpa Tyagi / Ms. Gunjan Agarwal / Ms. Kalpna Dwivedi",
    location: "AB-207/208/209",
    day: "Friday",
    startTime: "13:10",
    endTime: "14:00",
    color: "#8b5cf6"
  },
  {
    id: "mca3c-fri-7",
    name: "Design & Analysis of Algorithm (25CA301)",
    teacher: "Ms. Meghna Gupta-MG",
    location: "AB-209",
    day: "Friday",
    startTime: "14:00",
    endTime: "14:50",
    color: "#6366f1"
  },
  {
    id: "mca3c-fri-meeting",
    name: "Mentor Mentee Meeting",
    teacher: "Group C1-SSH / Group C2-CJ",
    location: "AB-209",
    day: "Friday",
    startTime: "14:50",
    endTime: "16:30",
    color: "#f97316"
  }
];

export const DEFAULT_TIMETABLE = DEFAULT_TIMETABLE_B;

/**
 * Load timetable from local storage
 * @returns {Array}
 */
export function loadTimetable() {
  try {
    const versionKey = 'lecalert_timetable_version_v3';
    const currentVersion = localStorage.getItem(versionKey);
    
    // Automatically update to latest July 22, 2026 timetable
    if (currentVersion !== '2026-07-22-v3') {
      const selectedSection = localStorage.getItem('lecalert_selected_section') || 'B';
      let newTable = DEFAULT_TIMETABLE_B;
      if (selectedSection === 'A') newTable = DEFAULT_TIMETABLE_A;
      else if (selectedSection === 'C') newTable = DEFAULT_TIMETABLE_C;

      localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(newTable));
      localStorage.setItem(versionKey, '2026-07-22-v3');
      return newTable;
    }

    const raw = localStorage.getItem(STORAGE_KEYS.TIMETABLE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(DEFAULT_TIMETABLE));
      return DEFAULT_TIMETABLE;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load timetable:', e);
    return DEFAULT_TIMETABLE;
  }
}

/**
 * Save timetable to local storage
 * @param {Array} timetable 
 */
export function saveTimetable(timetable) {
  try {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(timetable));
  } catch (e) {
    console.error('Failed to save timetable:', e);
  }
}

/**
 * Load settings from local storage
 * @returns {Object}
 */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.error('Failed to load settings:', e);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to local storage
 * @param {Object} settings 
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

/**
 * Create a compressed shareable URL for the timetable
 * @param {Array} timetable 
 * @returns {string}
 */
export function generateShareUrl(timetable) {
  if (!timetable || timetable.length === 0) return window.location.origin + window.location.pathname;
  
  try {
    const compact = timetable.map(classToCompactArray);
    const jsonStr = JSON.stringify(compact);
    // Use Unicode-safe btoa encoding
    const bytes = new TextEncoder().encode(jsonStr);
    const binary = String.fromCharCode(...bytes);
    const base64 = btoa(binary);
    // Make URL safe
    const urlSafeBase64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    return `${window.location.origin}${window.location.pathname}#share=${urlSafeBase64}`;
  } catch (e) {
    console.error('Failed to generate share URL:', e);
    return window.location.origin + window.location.pathname;
  }
}

/**
 * Decompress a timetable from a URL hash code
 * @param {string} hashStr 
 * @returns {Array|null}
 */
export function parseShareUrl(hashStr) {
  if (!hashStr) return null;
  
  const match = hashStr.match(/[#&]share=([^&]+)/);
  if (!match) return null;
  
  try {
    let base64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
    // Restore padding
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    const compact = JSON.parse(jsonStr);
    
    if (Array.isArray(compact)) {
      return compact.map(compactArrayToClass);
    }
    return null;
  } catch (e) {
    console.error('Failed to parse share URL:', e);
    return null;
  }
}

/**
 * Exports the timetable as a JSON backup file
 * @param {Array} timetable 
 */
export function exportBackup(timetable) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(timetable, null, 2));
  const link = document.createElement('a');
  link.setAttribute("href", dataStr);
  link.setAttribute("download", "mca_timetable_backup.json");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Load Gemini API key from local storage
 * @returns {string}
 */
export function loadGeminiApiKey() {
  try {
    return localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || '';
  } catch (e) {
    console.error('Failed to load Gemini API key:', e);
    return '';
  }
}

/**
 * Save Gemini API key to local storage
 * @param {string} key 
 */
export function saveGeminiApiKey(key) {
  try {
    if (!key) {
      localStorage.removeItem(STORAGE_KEYS.GEMINI_KEY);
    } else {
      localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, key);
    }
  } catch (e) {
    console.error('Failed to save Gemini API key:', e);
  }
}

/**
 * Formats a 24-hour time string "HH:MM" to 12-hour format "h:mm AM/PM"
 * @param {string} timeStr 
 * @returns {string}
 */
export function formatTimeTo12Hr(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
}

export const DEFAULT_ACADEMIC_EVENTS = [
  // --- ACADEMIC CALENDAR MILESTONES ---
  {
    id: "abes-ac-1",
    title: "Commencement of Classes (3rd Sem)",
    category: "Sem Commencement",
    startDate: "2026-07-16",
    endDate: "2026-07-16",
    details: "Induction and commencement of classes for MCA 3rd Semester.",
    badgeColor: "#10b981"
  },
  {
    id: "abes-ac-2",
    title: "Commencement of Classes (1st Sem)",
    category: "Sem Commencement",
    startDate: "2026-08-17",
    endDate: "2026-08-17",
    details: "Induction and commencement of classes for MCA 1st Semester.",
    badgeColor: "#10b981"
  },
  {
    id: "abes-ac-3",
    title: "Assessment 1 / Project Review-1 (3rd Sem)",
    category: "Assignments & Reviews",
    startDate: "2026-07-25",
    endDate: "2026-07-31",
    details: "Project Review-1 for MCA 3rd Sem (Last week of July).",
    badgeColor: "#8b5cf6"
  },
  {
    id: "abes-ac-4",
    title: "Assessment 2 / Project Review-2 (3rd Sem)",
    category: "Assignments & Reviews",
    startDate: "2026-08-08",
    endDate: "2026-08-14",
    details: "Project Review-2 for MCA 3rd Sem (Second week of August).",
    badgeColor: "#8b5cf6"
  },
  {
    id: "abes-ac-5",
    title: "Practical Assessment-I (In regular labs)",
    category: "Lab & Viva",
    startDate: "2026-09-14",
    endDate: "2026-09-18",
    details: "Practical Assessment-I for MCA 3rd Sem in regular lab periods.",
    badgeColor: "#06b6d4"
  },
  {
    id: "abes-ac-6",
    title: "MT-1 / ST-1 Theory Examination",
    category: "Exams",
    startDate: "2026-09-21",
    endDate: "2026-09-25",
    details: "Mid Term 1 / Sessional Test 1 Theory Examination for MCA 1st & 3rd Sem (Weightage: 15 marks / 1.5 Units).",
    badgeColor: "#ef4444"
  },
  {
    id: "abes-ac-7",
    title: "Evaluation & Answer Sheet Display (MT-1/ST-1)",
    category: "Exams",
    startDate: "2026-09-30",
    endDate: "2026-09-30",
    details: "Evaluation and answer sheet submission for MT-1/ST-1.",
    badgeColor: "#f59e0b"
  },
  {
    id: "abes-ac-8",
    title: "Assessment 3 / Project Review-3 (3rd Sem)",
    category: "Assignments & Reviews",
    startDate: "2026-09-24",
    endDate: "2026-09-30",
    details: "Project Review-3 for MCA 3rd Sem (Last week of September).",
    badgeColor: "#8b5cf6"
  },
  {
    id: "abes-ac-9",
    title: "Assessment 4 / Project Review-4 (3rd Sem)",
    category: "Assignments & Reviews",
    startDate: "2026-10-08",
    endDate: "2026-10-14",
    details: "Project Review-4 for MCA 3rd Sem (Second week of October).",
    badgeColor: "#8b5cf6"
  },
  {
    id: "abes-ac-10",
    title: "MT-2 / ST-2 Theory Examination",
    category: "Exams",
    startDate: "2026-10-29",
    endDate: "2026-11-05",
    details: "Mid Term 2 / Sessional Test 2 Theory Examination for MCA 1st & 3rd Sem (Weightage: 15 marks / 1.5 Units).",
    badgeColor: "#ef4444"
  },
  {
    id: "abes-ac-11",
    title: "Evaluation & Answer Sheet Display (MT-2/ST-2)",
    category: "Exams",
    startDate: "2026-11-18",
    endDate: "2026-11-18",
    details: "Evaluation and answer sheet submission for MT-2/ST-2.",
    badgeColor: "#f59e0b"
  },
  {
    id: "abes-ac-12",
    title: "Practical Assessment-II (In regular labs)",
    category: "Lab & Viva",
    startDate: "2026-11-16",
    endDate: "2026-11-20",
    details: "Practical Assessment-II for MCA 1st & 3rd Sem in regular lab periods.",
    badgeColor: "#06b6d4"
  },
  {
    id: "abes-ac-13",
    title: "Assessment 5",
    category: "Assignments & Reviews",
    startDate: "2026-11-24",
    endDate: "2026-11-30",
    details: "Assessment 5 for MCA 1st & 3rd Sem (Last week of November).",
    badgeColor: "#8b5cf6"
  },
  {
    id: "abes-ac-14",
    title: "Make-up / ST-3 Theory Examination",
    category: "Exams",
    startDate: "2026-12-07",
    endDate: "2026-12-12",
    details: "Make-up / Sessional Test 3 Theory Exam (Weightage: 15 marks / 3 Units).",
    badgeColor: "#ef4444"
  },
  {
    id: "abes-ac-15",
    title: "End Term / End Semester Theory & Viva Exams",
    category: "Exams",
    startDate: "2026-12-21",
    endDate: "2027-01-15",
    details: "End Semester Theory & Practical Viva Examination (Weightage: 40/70 marks).",
    badgeColor: "#dc2626"
  },

  // --- OFFICIAL HOLIDAYS ---
  {
    id: "abes-hol-1",
    title: "Shravan Shivratri",
    category: "Holidays",
    startDate: "2026-08-11",
    endDate: "2026-08-11",
    details: "College Holiday - Shravan Shivratri",
    badgeColor: "#ec4899"
  },
  {
    id: "abes-hol-2",
    title: "Independence Day",
    category: "Holidays",
    startDate: "2026-08-15",
    endDate: "2026-08-15",
    details: "National Holiday - Independence Day",
    badgeColor: "#ec4899"
  },
  {
    id: "abes-hol-3",
    title: "Eid-e-Milad / Milad-un-Nabi",
    category: "Holidays",
    startDate: "2026-08-26",
    endDate: "2026-08-26",
    details: "College Holiday - Milad-un-Nabi",
    badgeColor: "#ec4899"
  },
  {
    id: "abes-hol-4",
    title: "Raksha Bandhan",
    category: "Holidays",
    startDate: "2026-08-28",
    endDate: "2026-08-28",
    details: "College Holiday - Raksha Bandhan",
    badgeColor: "#ec4899"
  },
  {
    id: "abes-hol-5",
    title: "Janmashtami",
    category: "Holidays",
    startDate: "2026-09-04",
    endDate: "2026-09-04",
    details: "College Holiday - Janmashtami",
    badgeColor: "#ec4899"
  },
  {
    id: "abes-hol-6",
    title: "Gandhi Jayanti",
    category: "Holidays",
    startDate: "2026-10-02",
    endDate: "2026-10-02",
    details: "National Holiday - Gandhi Jayanti",
    badgeColor: "#ec4899"
  },
  {
    id: "abes-hol-7",
    title: "Maha Navmi",
    category: "Holidays",
    startDate: "2026-10-19",
    endDate: "2026-10-19",
    details: "College Holiday - Maha Navmi",
    badgeColor: "#ec4899"
  },
  {
    id: "abes-hol-8",
    title: "Dussehra",
    category: "Holidays",
    startDate: "2026-10-20",
    endDate: "2026-10-20",
    details: "College Holiday - Dussehra",
    badgeColor: "#ec4899"
  },
  {
    id: "abes-hol-9",
    title: "Diwali Holidays",
    category: "Holidays",
    startDate: "2026-11-06",
    endDate: "2026-11-13",
    details: "College Vacation - Diwali Festival Holidays (6 Nov - 13 Nov 2026)",
    badgeColor: "#f43f5e"
  },
  {
    id: "abes-hol-10",
    title: "Guru Nanak Jayanti",
    category: "Holidays",
    startDate: "2026-11-24",
    endDate: "2026-11-24",
    details: "College Holiday - Guru Nanak Jayanti",
    badgeColor: "#ec4899"
  },
  {
    id: "abes-hol-11",
    title: "Christmas Day",
    category: "Holidays",
    startDate: "2026-12-25",
    endDate: "2026-12-25",
    details: "College Holiday - Christmas Day",
    badgeColor: "#ec4899"
  },
  {
    id: "abes-hol-12",
    title: "New Year",
    category: "Holidays",
    startDate: "2027-01-01",
    endDate: "2027-01-01",
    details: "College Holiday - New Year 2027",
    badgeColor: "#ec4899"
  },
  {
    id: "abes-hol-13",
    title: "Republic Day",
    category: "Holidays",
    startDate: "2027-01-26",
    endDate: "2027-01-26",
    details: "National Holiday - Republic Day",
    badgeColor: "#ec4899"
  }
];

export function loadAcademicCalendar() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACADEMIC_EVENTS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load academic calendar:', e);
  }
  return DEFAULT_ACADEMIC_EVENTS;
}

export function saveAcademicCalendar(events) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACADEMIC_EVENTS, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save academic calendar:', e);
  }
}

/**
 * Determines whether a timetable slot is an actual academic lecture
 * Excludes Lunch Break, Tea/Mini Break, Mentor-Mentee, and Library
 * @param {Object} cls 
 * @returns {boolean}
 */
export function isActualLecture(cls) {
  if (!cls || !cls.name) return false;
  const nameLower = cls.name.toLowerCase();
  
  if (
    nameLower.includes('lunch') || 
    nameLower.includes('break') || 
    nameLower.includes('mentor') || 
    nameLower.includes('mentee') ||
    nameLower.includes('library')
  ) {
    return false;
  }
  return true;
}

/**
 * Gets all lectures across Section A, B, and C combined
 */
export function getAllMasterLectures() {
  const secA = DEFAULT_TIMETABLE_A.map(cls => ({ ...cls, section: cls.section || 'A' }));
  const secB = DEFAULT_TIMETABLE_B.map(cls => ({ ...cls, section: cls.section || 'B' }));
  const secC = DEFAULT_TIMETABLE_C.map(cls => ({ ...cls, section: cls.section || 'C' }));
  return [...secA, ...secB, ...secC];
}

/**
 * Extracts list of unique teacher names from timetable array
 */
export function extractUniqueTeachers(timetable = []) {
  const teacherSet = new Set();
  const listToScan = (timetable && timetable.length > 0) ? timetable : getAllMasterLectures();

  listToScan.forEach(cls => {
    if (cls.substituteTeacher) {
      teacherSet.add(cls.substituteTeacher.trim());
    }
    if (cls.teacher) {
      // Split multi-teacher entries separated by / or +
      const raw = cls.teacher;
      const parts = raw.split(/[\/+]/).map(t => t.trim()).filter(Boolean);
      parts.forEach(p => teacherSet.add(p));
    }
  });

  return Array.from(teacherSet).sort();
}

/**
 * Returns filtered timetable assigned to a specific teacher (including substitute duties)
 */
export function getTeacherTimetable(timetable = [], teacherName = '') {
  if (!teacherName) return [];
  const listToScan = (timetable && timetable.length > 0) ? timetable : getAllMasterLectures();
  const searchLower = teacherName.toLowerCase().trim();

  return listToScan.filter(cls => {
    if (cls.substituteTeacher && cls.substituteTeacher.toLowerCase().includes(searchLower)) {
      return true;
    }
    if (cls.teacher && cls.teacher.toLowerCase().includes(searchLower)) {
      return true;
    }
    return false;
  });
}


