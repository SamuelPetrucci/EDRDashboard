// Jamaica's 14 Parishes with Equipment and Personnel Data Structure

export const jamaicaParishes = [
  {
    id: 'kingston',
    name: 'Kingston',
    region: 'Southeast',
    population: 937700,
    area: '22.66 km²',
    equipment: {
      emergencyVehicles: 45,
      generators: 120,
      waterTrucks: 15,
      medicalSupplies: 850,
      communicationEquipment: 200,
      searchAndRescue: 30,
      heavyMachinery: 25
    },
    personnel: {
      emergencyResponders: 180,
      medicalStaff: 250,
      engineers: 45,
      logisticsStaff: 60,
      communicationSpecialists: 35,
      volunteers: 500,
      coordinators: 12
    },
    scorecard: {
      overallScore: 0,
      domains: {}
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'st-andrew',
    name: 'St. Andrew',
    region: 'Southeast',
    population: 573369,
    area: '430.7 km²',
    equipment: {
      emergencyVehicles: 35,
      generators: 95,
      waterTrucks: 12,
      medicalSupplies: 650,
      communicationEquipment: 150,
      searchAndRescue: 25,
      heavyMachinery: 20
    },
    personnel: {
      emergencyResponders: 140,
      medicalStaff: 180,
      engineers: 35,
      logisticsStaff: 45,
      communicationSpecialists: 25,
      volunteers: 400,
      coordinators: 10
    },
    scorecard: {
      overallScore: 0,
      domains: {}
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'st-catherine',
    name: 'St. Catherine',
    region: 'Southeast',
    population: 516218,
    area: '1,192.4 km²',
    equipment: {
      emergencyVehicles: 30,
      generators: 80,
      waterTrucks: 10,
      medicalSupplies: 550,
      communicationEquipment: 120,
      searchAndRescue: 20,
      heavyMachinery: 18
    },
    personnel: {
      emergencyResponders: 120,
      medicalStaff: 150,
      engineers: 30,
      logisticsStaff: 40,
      communicationSpecialists: 20,
      volunteers: 350,
      coordinators: 8
    },
    scorecard: {
      overallScore: 0,
      domains: {}
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'clarendon',
    name: 'Clarendon',
    region: 'Central',
    population: 245103,
    area: '1,196.3 km²',
    equipment: {
      emergencyVehicles: 22,
      generators: 65,
      waterTrucks: 8,
      medicalSupplies: 450,
      communicationEquipment: 100,
      searchAndRescue: 18,
      heavyMachinery: 15
    },
    personnel: {
      emergencyResponders: 90,
      medicalStaff: 120,
      engineers: 25,
      logisticsStaff: 35,
      communicationSpecialists: 18,
      volunteers: 300,
      coordinators: 7
    },
    scorecard: {
      overallScore: 0,
      domains: {}
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'manchester',
    name: 'Manchester',
    region: 'Central',
    population: 189797,
    area: '830.1 km²',
    equipment: {
      emergencyVehicles: 18,
      generators: 55,
      waterTrucks: 7,
      medicalSupplies: 400,
      communicationEquipment: 90,
      searchAndRescue: 15,
      heavyMachinery: 12
    },
    personnel: {
      emergencyResponders: 75,
      medicalStaff: 100,
      engineers: 20,
      logisticsStaff: 30,
      communicationSpecialists: 15,
      volunteers: 250,
      coordinators: 6
    },
    scorecard: {
      overallScore: 0,
      domains: {}
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'st-ann',
    name: 'St. Ann',
    region: 'North',
    population: 173232,
    area: '1,212.6 km²',
    equipment: {
      emergencyVehicles: 20,
      generators: 60,
      waterTrucks: 8,
      medicalSupplies: 420,
      communicationEquipment: 95,
      searchAndRescue: 16,
      heavyMachinery: 13
    },
    personnel: {
      emergencyResponders: 80,
      medicalStaff: 110,
      engineers: 22,
      logisticsStaff: 32,
      communicationSpecialists: 16,
      volunteers: 280,
      coordinators: 6
    },
    scorecard: {
      overallScore: 0,
      domains: {}
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'st-mary',
    name: 'St. Mary',
    region: 'Northeast',
    population: 114227,
    area: '610.5 km²',
    equipment: {
      emergencyVehicles: 15,
      generators: 50,
      waterTrucks: 6,
      medicalSupplies: 350,
      communicationEquipment: 80,
      searchAndRescue: 14,
      heavyMachinery: 11
    },
    personnel: {
      emergencyResponders: 65,
      medicalStaff: 85,
      engineers: 18,
      logisticsStaff: 28,
      communicationSpecialists: 14,
      volunteers: 220,
      coordinators: 5
    },
    scorecard: {
      overallScore: 0,
      domains: {}
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'portland',
    name: 'Portland',
    region: 'Northeast',
    population: 81381,
    area: '814.0 km²',
    equipment: {
      emergencyVehicles: 16,
      generators: 52,
      waterTrucks: 6,
      medicalSupplies: 360,
      communicationEquipment: 82,
      searchAndRescue: 14,
      heavyMachinery: 11
    },
    personnel: {
      emergencyResponders: 68,
      medicalStaff: 88,
      engineers: 19,
      logisticsStaff: 29,
      communicationSpecialists: 14,
      volunteers: 230,
      coordinators: 5
    },
    scorecard: {
      overallScore: 0,
      domains: {}
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'st-thomas',
    name: 'St. Thomas',
    region: 'East',
    population: 93802,
    area: '742.8 km²',
    equipment: {
      emergencyVehicles: 12,
      generators: 45,
      waterTrucks: 5,
      medicalSupplies: 320,
      communicationEquipment: 75,
      searchAndRescue: 12,
      heavyMachinery: 10
    },
    personnel: {
      emergencyResponders: 55,
      medicalStaff: 75,
      engineers: 16,
      logisticsStaff: 25,
      communicationSpecialists: 12,
      volunteers: 200,
      coordinators: 4
    },
    scorecard: {
      overallScore: 0,
      domains: {}
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'st-elizabeth',
    name: 'St. Elizabeth',
    region: 'Southwest',
    population: 150205,
    area: '1,212.4 km²',
    equipment: {
      emergencyVehicles: 17,
      generators: 58,
      waterTrucks: 7,
      medicalSupplies: 380,
      communicationEquipment: 88,
      searchAndRescue: 15,
      heavyMachinery: 12
    },
    personnel: {
      emergencyResponders: 72,
      medicalStaff: 95,
      engineers: 21,
      logisticsStaff: 31,
      communicationSpecialists: 15,
      volunteers: 260,
      coordinators: 6
    },
    scorecard: {
      overallScore: 0,
      domains: {}
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'westmoreland',
    name: 'Westmoreland',
    region: 'West',
    population: 144103,
    area: '807.0 km²',
    equipment: {
      emergencyVehicles: 16,
      generators: 54,
      waterTrucks: 7,
      medicalSupplies: 370,
      communicationEquipment: 85,
      searchAndRescue: 14,
      heavyMachinery: 12
    },
    personnel: {
      emergencyResponders: 70,
      medicalStaff: 92,
      engineers: 20,
      logisticsStaff: 30,
      communicationSpecialists: 14,
      volunteers: 240,
      coordinators: 5
    },
    scorecard: {
      overallScore: 0,
      domains: {}
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'hanover',
    name: 'Hanover',
    region: 'West',
    population: 69983,
    area: '450.4 km²',
    equipment: {
      emergencyVehicles: 13,
      generators: 48,
      waterTrucks: 6,
      medicalSupplies: 340,
      communicationEquipment: 78,
      searchAndRescue: 13,
      heavyMachinery: 10
    },
    personnel: {
      emergencyResponders: 60,
      medicalStaff: 80,
      engineers: 17,
      logisticsStaff: 27,
      communicationSpecialists: 13,
      volunteers: 210,
      coordinators: 5
    },
    scorecard: {
      overallScore: 0,
      domains: {}
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'trelawny',
    name: 'Trelawny',
    region: 'Northwest',
    population: 75558,
    area: '874.6 km²',
    equipment: {
      emergencyVehicles: 14,
      generators: 50,
      waterTrucks: 6,
      medicalSupplies: 350,
      communicationEquipment: 80,
      searchAndRescue: 13,
      heavyMachinery: 11
    },
    personnel: {
      emergencyResponders: 62,
      medicalStaff: 82,
      engineers: 18,
      logisticsStaff: 28,
      communicationSpecialists: 13,
      volunteers: 215,
      coordinators: 5
    },
    scorecard: {
      overallScore: 0,
      domains: {}
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'st-james',
    name: 'St. James',
    region: 'Northwest',
    population: 184662,
    area: '594.9 km²',
    equipment: {
      emergencyVehicles: 19,
      generators: 62,
      waterTrucks: 8,
      medicalSupplies: 410,
      communicationEquipment: 92,
      searchAndRescue: 17,
      heavyMachinery: 14
    },
    personnel: {
      emergencyResponders: 78,
      medicalStaff: 105,
      engineers: 23,
      logisticsStaff: 33,
      communicationSpecialists: 17,
      volunteers: 270,
      coordinators: 6
    },
    scorecard: {
      overallScore: 0,
      domains: {}
    },
    lastUpdated: new Date().toISOString()
  }
]

// Helper function to get parish by ID
export const getParishById = (id) => {
  return jamaicaParishes.find(parish => parish.id === id)
}

// Helper function to get all parishes
export const getAllParishes = () => {
  return jamaicaParishes
}

