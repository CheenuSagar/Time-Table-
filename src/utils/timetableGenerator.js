/**
 * Algorithmic Conflict-Free Automatic Timetable Generator
 * Solves section, teacher, and room constraints to generate a complete timetable.
 */

export const WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const DEFAULT_TIME_SLOTS = [
  { id: 1, startTime: '08:50', endTime: '09:40', label: 'Slot 1' },
  { id: 2, startTime: '09:40', endTime: '10:30', label: 'Slot 2' },
  { id: 3, startTime: '10:40', endTime: '11:30', label: 'Slot 3' },
  { id: 4, startTime: '11:30', endTime: '12:20', label: 'Slot 4' },
  // Lunch 12:20 - 13:10
  { id: 5, startTime: '13:10', endTime: '14:00', label: 'Slot 5' },
  { id: 6, startTime: '14:00', endTime: '14:50', label: 'Slot 6' },
  { id: 7, startTime: '14:50', endTime: '15:40', label: 'Slot 7' }
];

export const DEFAULT_TEACHER_INPUTS = [
  { id: '1', teacher: 'Dr. Shikha Verma-SV', subject: 'Computer Networks (25CA303)', section: 'A', hoursPerWeek: 4, location: 'AB-207', color: '#3b82f6' },
  { id: '2', teacher: 'Ms. Savita Singh-SS', subject: 'Design & Analysis of Algorithm (25CA301)', section: 'A', hoursPerWeek: 4, location: 'AB-207', color: '#6366f1' },
  { id: '3', teacher: 'Dr. Rajesh Kr. Maurya-RKM', subject: 'Agile S/w Dev & Testing (25CA302)', section: 'A', hoursPerWeek: 4, location: 'AB-207', color: '#06b6d4' },
  { id: '4', teacher: 'Ms. Shilpa Tyagi / Ms. Gunjan Agarwal', subject: 'Elective-I: AML / Cloud-II', section: 'A', hoursPerWeek: 3, location: 'AB-207', color: '#8b5cf6' },
  { id: '5', teacher: 'Ms. Priya Mishra / Mr. Chirag Jain', subject: 'Elective-II: Data Analytics / Cyber Security', section: 'A', hoursPerWeek: 3, location: 'AB-207', color: '#f59e0b' },
  { id: '6', teacher: 'SSH+ST', subject: 'Mini Project Lab (25CA353)', section: 'A', hoursPerWeek: 2, location: 'Lab-3', color: '#10b981' },

  { id: '7', teacher: 'Ms. Savita Singh-SS', subject: 'Design & Analysis of Algorithm (25CA301)', section: 'B', hoursPerWeek: 4, location: 'AB-208', color: '#6366f1' },
  { id: '8', teacher: 'Dr. Shikha Verma-SV', subject: 'Computer Networks (25CA303)', section: 'B', hoursPerWeek: 4, location: 'AB-208', color: '#3b82f6' },
  { id: '9', teacher: 'Dr. Rajesh Kr. Maurya-RKM', subject: 'Agile S/w Dev & Testing (25CA302)', section: 'B', hoursPerWeek: 4, location: 'AB-208', color: '#06b6d4' },
  { id: '10', teacher: 'Ms. Priya Mishra / Ms. Surbhi Sharma', subject: 'Elective-II: Data Analytics / Cyber Security', section: 'B', hoursPerWeek: 3, location: 'AB-208', color: '#f59e0b' },
  { id: '11', teacher: 'RKM+SV', subject: 'Mini Project Lab (25CA353)', section: 'B', hoursPerWeek: 2, location: 'Lab-2', color: '#10b981' },

  { id: '12', teacher: 'Dr. Rajesh Kr. Maurya-RKM', subject: 'Agile S/w Dev & Testing (25CA302)', section: 'C', hoursPerWeek: 4, location: 'AB-209', color: '#06b6d4' },
  { id: '13', teacher: 'Ms. Savita Singh-SS', subject: 'Design & Analysis of Algorithm (25CA301)', section: 'C', hoursPerWeek: 4, location: 'AB-209', color: '#6366f1' },
  { id: '14', teacher: 'Dr. Shikha Verma-SV', subject: 'Computer Networks (25CA303)', section: 'C', hoursPerWeek: 4, location: 'AB-209', color: '#3b82f6' },
  { id: '15', teacher: 'Mr. Chirag Jain / Ms. Surbhi Sharma', subject: 'Elective-II: Data Analytics / Cyber Security', section: 'C', hoursPerWeek: 3, location: 'AB-209', color: '#f59e0b' },
  { id: '16', teacher: 'SS+PM', subject: 'Mini Project Lab (25CA353)', section: 'C', hoursPerWeek: 2, location: 'Lab-1', color: '#10b981' },
];

/**
 * Generate a conflict-free timetable algorithmically.
 */
export function generateConflictFreeTimetable(teacherWorkloads = DEFAULT_TEACHER_INPUTS) {
  const generatedTimetable = [];

  // Bookings registry to track occupancy:
  // Key format: `${day}-${slotId}`
  const teacherBookings = new Set(); // `${teacherName}-${day}-${slotId}`
  const sectionBookings = new Set(); // `${section}-${day}-${slotId}`
  const roomBookings = new Set();    // `${location}-${day}-${slotId}`

  // Always add Lunch Break for all sections
  WORKING_DAYS.forEach((day) => {
    ['A', 'B', 'C'].forEach((sec) => {
      generatedTimetable.push({
        id: `auto-${sec}-${day.toLowerCase()}-lunch`,
        name: 'Lunch Break',
        teacher: '',
        location: '',
        day: day,
        startTime: '12:20',
        endTime: '13:10',
        color: '#4b5563',
        section: sec
      });
    });
  });

  // Process each teacher workload item
  teacherWorkloads.forEach((item) => {
    let assignedCount = 0;
    const targetHours = Number(item.hoursPerWeek) || 3;
    const teacherName = (item.teacher || '').trim();
    const section = item.section || 'A';
    const location = item.location || `AB-${section === 'A' ? '207' : section === 'B' ? '208' : '209'}`;

    // Shuffle days & slots for balanced distribution
    const shuffledDays = [...WORKING_DAYS].sort(() => Math.random() - 0.5);
    
    for (const day of shuffledDays) {
      if (assignedCount >= targetHours) break;

      const shuffledSlots = [...DEFAULT_TIME_SLOTS].sort(() => Math.random() - 0.5);

      for (const slot of shuffledSlots) {
        if (assignedCount >= targetHours) break;

        const teacherKey = `${teacherName}-${day}-${slot.id}`;
        const sectionKey = `${section}-${day}-${slot.id}`;
        const roomKey = `${location}-${day}-${slot.id}`;

        // Check if all constraints are clear
        const isTeacherFree = !teacherName || !teacherBookings.has(teacherKey);
        const isSectionFree = !sectionBookings.has(sectionKey);
        const isRoomFree = !location || !roomBookings.has(roomKey);

        if (isTeacherFree && isSectionFree && isRoomFree) {
          // Assign slot
          if (teacherName) teacherBookings.add(teacherKey);
          sectionBookings.add(sectionKey);
          if (location) roomBookings.add(roomKey);

          generatedTimetable.push({
            id: `auto-${section}-${day.toLowerCase()}-${slot.id}-${Math.random().toString(36).substr(2, 5)}`,
            name: item.subject,
            teacher: item.teacher,
            location: location,
            day: day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            color: item.color || '#6366f1',
            section: section
          });

          assignedCount++;
        }
      }
    }
  });

  // Sort generated timetable chronologically by day and startTime
  const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
  generatedTimetable.sort((a, b) => {
    if (dayOrder[a.day] !== dayOrder[b.day]) {
      return dayOrder[a.day] - dayOrder[b.day];
    }
    return a.startTime.localeCompare(b.startTime);
  });

  return generatedTimetable;
}
