const studentNames = [
  'Aarav Mehta', 'Maya Singh', 'Rohan Das', 'Isha Kapoor', 'Nikhil Rao',
  'Ananya Shah', 'Kabir Joshi', 'Sara Khan', 'Dev Patel', 'Meera Nair',
  'Arjun Bose', 'Tara Menon', 'Vihaan Roy', 'Zoya Ali', 'Aditya Sen',
  'Naina Gupta', 'Ishaan Verma', 'Diya Thomas', 'Karan Malik', 'Riya Iyer',
]

const departments = ['Computer Science', 'Civil Engineering', 'Nursing', 'Commerce', 'Design']
const requestTypes = ['Medical aid', 'Food support', 'Safe transport', 'Temporary shelter', 'Water supply']
const priorities = ['Critical', 'High', 'Medium']
const requestStatuses = ['Received', 'Assigned', 'En route', 'Resolved']
const areas = ['North Campus', 'River Ward', 'Old Market', 'East Housing', 'Central Station']

const coordinates = [
  [18.5204, 73.8567], [18.5314, 73.8446], [18.5074, 73.8077], [18.5642, 73.7769],
  [18.4889, 73.8542], [18.5679, 73.9143], [18.4529, 73.8662], [18.5913, 73.7389],
  [18.5018, 73.8636], [18.5362, 73.8958], [18.4735, 73.8567], [18.5487, 73.8089],
  [18.5157, 73.9112], [18.5791, 73.8274], [18.4602, 73.8875], [18.5268, 73.7821],
  [18.4971, 73.8234], [18.5551, 73.8746], [18.4756, 73.8013], [18.6032, 73.8564],
]

export const demoStudents = studentNames.map((name, index) => ({
  id: `student-${index + 1}`,
  name,
  department: departments[index % departments.length],
  requestType: requestTypes[index % requestTypes.length],
  priority: priorities[index % priorities.length],
  latitude: coordinates[index][0],
  longitude: coordinates[index][1],
  status: requestStatuses[index % requestStatuses.length],
  timestamp: `${index + 1} min ago`,
  description: `${requestTypes[index % requestTypes.length]} requested near ${areas[index % areas.length]}.`,
}))

const ngoNames = [
  'Asha Relief Collective', 'Harbor Hands Network', 'Sahyog Medical Aid', 'Open Door Foundation',
  'Civic Care Alliance', 'Blue Lantern Response', 'Udaan Community Trust', 'Hope Kitchen Network',
  'Seva Emergency Hub', 'Bridgeway Volunteers', 'Nirmaan Relief Cell', 'Goodwill Transit Aid',
  'Lighthouse Shelter', 'Prerna Health Mission', 'Common Ground NGO', 'Rapid Response Pune',
  'CareLink Outreach', 'Sankalp Support Group', 'Humanity First Desk', 'Safe Horizon Collective',
]

export const demoNgos = ngoNames.map((name, index) => ({
  id: `ngo-${index + 1}`,
  name,
  type: ['Medical', 'Food bank', 'Shelter', 'Transport'][index % 4],
  latitude: coordinates[(index * 3 + 4) % coordinates.length][0] + 0.006,
  longitude: coordinates[(index * 3 + 4) % coordinates.length][1] - 0.004,
  availability: index % 5 === 0 ? 'Limited' : index % 7 === 0 ? 'Dispatched' : 'Available',
  capacity: 12 + ((index * 7) % 38),
  contact: `+91 90000 ${String(10000 + index).slice(-5)}`,
  status: index % 7 === 0 ? 'Responding' : 'Ready',
}))

export const demoRequests = demoStudents.map((student, index) => ({
  id: `request-${index + 1}`,
  studentId: student.id,
  title: `${student.requestType} near ${areas[index % areas.length]}`,
  category: student.requestType,
  location: areas[index % areas.length],
  urgency: student.priority.toUpperCase(),
  priority: student.priority,
  status: student.status,
  latitude: student.latitude,
  longitude: student.longitude,
  createdAt: student.timestamp,
}))

export const demoResources = Array.from({ length: 20 }, (_, index) => ({
  id: `resource-${index + 1}`,
  name: ['Water kits', 'First-aid packs', 'Blankets', 'Meal boxes', 'Power banks'][index % 5],
  hub: areas[index % areas.length],
  quantity: 18 + ((index * 13) % 85),
  status: index % 6 === 0 ? 'Low stock' : 'Available',
}))

export const demoNotifications = Array.from({ length: 20 }, (_, index) => ({
  _id: `demo-notification-${index + 1}`,
  id: `notification-${index + 1}`,
  type: ['REQUEST_UPDATE', 'RESOURCE_ALERT', 'VOLUNTEER_DISPATCH', 'SAFETY_NOTICE'][index % 4],
  title: ['Request update', 'Resource alert', 'Volunteer dispatch', 'Safety notice'][index % 4],
  message: `Demo coordination update ${index + 1} for ${areas[index % areas.length]}.`,
  priority: priorities[index % priorities.length],
  read: index % 3 === 0,
  readAt: index % 3 === 0 ? new Date().toISOString() : null,
  timestamp: `${index + 2} min ago`,
}))

export const demoOpportunities = Array.from({ length: 20 }, (_, index) => ({
  _id: `demo-opportunity-${index + 1}`,
  title: [`Medical camp support`, `Meal distribution`, `Shelter logistics`, `Emergency registration`, `Community outreach`][index % 5],
  description: `Sample field assignment supporting ${areas[index % areas.length]} response operations.`,
  location: areas[index % areas.length],
  category: ['Medical', 'Food', 'Logistics', 'Registration', 'Outreach'][index % 5],
  date: new Date(Date.now() + (index + 1) * 86400000).toISOString(),
  requiredVolunteers: 4 + (index % 8),
  joinedVolunteers: Array.from({ length: index % 4 }, (_, volunteerIndex) => `demo-volunteer-${volunteerIndex}`),
  status: index % 6 === 0 ? 'FULL' : 'OPEN',
}))

export const demoCampaigns = Array.from({ length: 20 }, (_, index) => ({
  id: `campaign-${index + 1}`,
  title: [`Emergency meal kits`, `Mobile medical supplies`, `Family shelter packs`, `Clean water reserve`][index % 4],
  location: areas[index % areas.length],
  target: 100 + index * 25,
  raised: 38 + ((index * 19) % 62),
  donors: 8 + index * 3,
  status: index % 7 === 0 ? 'Urgent' : 'Active',
}))

export const demoMapCenter = [18.5204, 73.8567]
