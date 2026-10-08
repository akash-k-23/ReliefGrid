const priorities = ['Critical', 'High', 'Medium']
const areas = ['North Campus', 'River Ward', 'Old Market', 'East Housing', 'Central Station']

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
