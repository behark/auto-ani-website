// Hardcoded vehicle data - Migrated from Sanity CMS with COMPLETE data
// Total vehicles: 13
// Total features: 327
// Migration date: 2025-10-31T15:59:10.909Z

export interface HardcodedVehicle {
  _id: string;
  slug: {
    current: string;
  };
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  originalPrice?: number | null;
  mileage?: number | null;
  fuelType?: 'diesel' | 'petrol' | 'hybrid' | 'electric' | 'lpg' | 'cng' | null;
  transmission?: 'manual' | 'automatic' | 'semi-automatic' | 'cvt' | null;
  category?: 'sedan' | 'hatchback' | 'suv' | 'wagon' | 'coupe' | 'convertible' | 'van' | 'pickup' | 'crossover' | null;
  color?: string | null;
  engine?: string | null;
  drivetrain?: string | null;
  status?: 'available' | 'reserved' | 'sold' | 'coming_soon';
  condition?: 'new' | 'used_excellent' | 'used_good' | 'used_fair' | 'certified';
  featured?: boolean;
  description?: string;
  features?: string[];
  specifications?: {
    doors?: number;
    seats?: number;
    engineSize?: number;
    power?: number;
    torque?: number;
    acceleration?: number;
    topSpeed?: number;
    fuelConsumption?: number;
    co2Emissions?: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    wheelbase?: number;
    trunkCapacity?: number;
  };
  financing?: {
    available?: boolean;
    downPayment?: number;
    monthlyPayment?: number;
    loanTerm?: number;
    interestRate?: number;
    tradeInAccepted?: boolean;
  };
  mainImage?: string;
  gallery?: string[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  dateAdded?: string;
  lastUpdated?: string;
  _createdAt?: string;
  _updatedAt?: string;
}

// Your actual vehicles from Sanity CMS with COMPLETE data
export const VEHICLES_DATABASE: HardcodedVehicle[] = [
  {
    "_id": "9CrsOcDKH4N5DBydEDW6ap",
    "slug": {
      "current": "bmw-x4-30d-xdrive-m-sport-2022"
    },
    "title": "BMW X4 30d xDrive M-Sport 2022",
    "brand": "bmw",
    "model": "X4 30d xDrive M-Sport",
    "year": 2022,
    "price": 36999,
    "originalPrice": null,
    "mileage": 180000,
    "fuelType": "diesel",
    "transmission": "automatic",
    "category": "suv",
    "color": "blue",
    "engine": "3.0L TDI",
    "drivetrain": null,
    "status": "available",
    "condition": "used_excellent",
    "featured": true,
    "description": "BMW X4 30d xDrive M-Sport Facelift 2022 në gjendje të shkëlqyer. Import evropian, gatshëm për eksport. Ngjyrë Phytonic Blue Metallic, paketë M-Sport komplekte.",
    "features": [
      "abs",
      "airbags",
      "esc",
      "ac",
      "climate_control",
      "heated_seats",
      "leather_seats",
      "gps",
      "bluetooth",
      "carplay",
      "premium_sound",
      "alloy_wheels",
      "led_headlights",
      "electric_windows",
      "keyless_entry",
      "push_start",
      "cruise_control",
      "awd"
    ],
    "specifications": {
      "acceleration": null,
      "co2Emissions": 179,
      "doors": 5,
      "engineSize": 3,
      "fuelConsumption": 6.8,
      "height": null,
      "length": null,
      "power": 286,
      "seats": 5,
      "topSpeed": null,
      "torque": 650,
      "trunkCapacity": null,
      "weight": null,
      "wheelbase": null,
      "width": null
    },
    "financing": {
      "available": true,
      "downPayment": 20,
      "interestRate": 3.9,
      "loanTerm": 84,
      "monthlyPayment": 485,
      "tradeInAccepted": true
    },
    "seo": {
      "keywords": [
        "BMW",
        "X4 30d xDrive M-Sport",
        "2022",
        "diesel",
        "Kosovo",
        "Mitrovica",
        "AUTO ANI",
        "vetura",
        "makina"
      ],
      "metaDescription": "BMW X4 30d xDrive M-Sport 2022 në shitje në AUTO ANI. Çmimi: €36,999. 180,000 km. Kontaktoni për më shumë detaje.",
      "metaTitle": "BMW X4 30d xDrive M-Sport 2022 - €36,999 | AUTO ANI"
    },
    "dateAdded": "2025-10-17T13:58:54.933Z",
    "lastUpdated": "2025-10-17T14:53:49.105Z",
    "_createdAt": "2025-10-17T13:58:54Z",
    "_updatedAt": "2025-10-30T19:31:18Z",
    "mainImage": "/images/optimized/vehicles/bmw-x4-30d-xdrive-m-sport-2022/1-original.webp",
    "gallery": [
      "/images/optimized/vehicles/bmw-x4-30d-xdrive-m-sport-2022/1-original.webp",
      "/images/optimized/vehicles/bmw-x4-30d-xdrive-m-sport-2022/2-original.webp",
      "/images/optimized/vehicles/bmw-x4-30d-xdrive-m-sport-2022/3-original.webp",
      "/images/optimized/vehicles/bmw-x4-30d-xdrive-m-sport-2022/4-original.webp",
      "/images/optimized/vehicles/bmw-x4-30d-xdrive-m-sport-2022/5-original.webp",
      "/images/optimized/vehicles/bmw-x4-30d-xdrive-m-sport-2022/6-original.webp",
      "/images/optimized/vehicles/bmw-x4-30d-xdrive-m-sport-2022/7-original.webp",
      "/images/optimized/vehicles/bmw-x4-30d-xdrive-m-sport-2022/8-original.webp",
      "/images/optimized/vehicles/bmw-x4-30d-xdrive-m-sport-2022/9-original.webp",
      "/images/optimized/vehicles/bmw-x4-30d-xdrive-m-sport-2022/10-original.webp",
      "/images/optimized/vehicles/bmw-x4-30d-xdrive-m-sport-2022/11-original.webp",
      "/images/optimized/vehicles/bmw-x4-30d-xdrive-m-sport-2022/12-original.webp",
      "/images/optimized/vehicles/bmw-x4-30d-xdrive-m-sport-2022/13-original.webp"
    ]
  },
  {
    "_id": "AcQWTFyPpUhT6qIMCxaHtK",
    "slug": {
      "current": "audi-q5-business-sport-(finnish)-2020"
    },
    "title": "Audi Q5 Business Sport (Finnish) 2020",
    "brand": "audi",
    "model": "Q5 Business Sport (Finnish)",
    "year": 2020,
    "price": 17999,
    "originalPrice": null,
    "mileage": 220000,
    "fuelType": "petrol",
    "transmission": "automatic",
    "category": "suv",
    "color": "Glacier White Metallic",
    "engine": "2.0L TFSI Quattro",
    "drivetrain": null,
    "status": "available",
    "condition": "used_excellent",
    "featured": true,
    "description": "Audi Q5 Business Sport 2020 import finlandez në gjendje të shkëlqyer. Motor 2.0 TFSI me 163 PS, Quattro AWD. Distance Control, Lane Assist, kamera, 3 çelësa dhe Webasto.",
    "features": [
      "abs",
      "airbags",
      "esc",
      "traction_control",
      "blind_spot",
      "lane_departure",
      "parking_sensors",
      "backup_camera",
      "ac",
      "climate_control",
      "heated_seats",
      "leather_seats",
      "memory_seats",
      "gps",
      "bluetooth",
      "usb",
      "wireless_charging",
      "android_auto",
      "carplay",
      "premium_sound",
      "led_headlights",
      "electric_windows",
      "electric_mirrors",
      "keyless_entry",
      "push_start",
      "sport_mode",
      "cruise_control",
      "adaptive_cruise",
      "awd",
      "alloy_wheels"
    ],
    "specifications": {
      "acceleration": 8.6,
      "co2Emissions": 154,
      "doors": 5,
      "engineSize": 2,
      "fuelConsumption": 6.8,
      "height": null,
      "length": null,
      "power": 163,
      "seats": 5,
      "topSpeed": 215,
      "torque": 320,
      "trunkCapacity": 550,
      "weight": null,
      "wheelbase": null,
      "width": null
    },
    "financing": {
      "available": true,
      "downPayment": 20,
      "interestRate": 3.9,
      "loanTerm": 84,
      "monthlyPayment": 245,
      "tradeInAccepted": true
    },
    "seo": {
      "keywords": [
        "Audi",
        "Q5 Business Sport (Finnish)",
        "2020",
        "petrol",
        "Kosovo",
        "Mitrovica",
        "AUTO ANI",
        "vetura",
        "makina"
      ],
      "metaDescription": "Audi Q5 Business Sport (Finnish) 2020 në shitje në AUTO ANI. Çmimi: €17,999. 220,000 km. Kontaktoni për më shumë detaje.",
      "metaTitle": "Audi Q5 Business Sport (Finnish) 2020 - €17,999 | AUTO ANI"
    },
    "dateAdded": "2025-10-17T14:26:26.004Z",
    "lastUpdated": "2025-10-17T15:50:35.152Z",
    "_createdAt": "2025-10-17T14:26:26Z",
    "_updatedAt": "2025-10-17T15:50:35Z",
    "mainImage": "/images/optimized/vehicles/audi-q5-2020/1-original.webp",
    "gallery": [
      "/images/optimized/vehicles/audi-q5-2020/1-original.webp",
      "/images/optimized/vehicles/audi-q5-2020/2-original.webp",
      "/images/optimized/vehicles/audi-q5-2020/3-original.webp",
      "/images/optimized/vehicles/audi-q5-2020/4-original.webp",
      "/images/optimized/vehicles/audi-q5-2020/5-original.webp",
      "/images/optimized/vehicles/audi-q5-2020/6-original.webp",
      "/images/optimized/vehicles/audi-q5-2020/7-original.webp",
      "/images/optimized/vehicles/audi-q5-2020/8-original.webp",
      "/images/optimized/vehicles/audi-q5-2020/9-original.webp",
      "/images/optimized/vehicles/audi-q5-2020/10-original.webp",
      "/images/optimized/vehicles/audi-q5-2020/11-original.webp",
      "/images/optimized/vehicles/audi-q5-2020/12-original.webp",
      "/images/optimized/vehicles/audi-q5-2020/13-original.webp",
      "/images/optimized/vehicles/audi-q5-2020/14-original.webp"
    ]
  },
  {
    "_id": "OCM7WvHNujFjet6BiNQot6",
    "slug": {
      "current": "bmw-318-m-sport-(f30)-2017"
    },
    "title": "BMW 318 M-Sport (F30) 2017",
    "brand": "bmw",
    "model": "318 M-Sport (F30)",
    "year": 2017,
    "price": 15400,
    "originalPrice": null,
    "mileage": 220000,
    "fuelType": "diesel",
    "transmission": "automatic",
    "category": "sedan",
    "color": "Storm Bay",
    "engine": "2.0L TwinPower Turbo",
    "drivetrain": null,
    "status": "reserved",
    "condition": "used_good",
    "featured": false,
    "description": "BMW 318 F30 M-Sport 2017 me paketë të plotë M-Sport. Pa doganë, import evropian. Motor 2.0 TwinPower Turbo, automatik. Shërbyer rregullisht në BMW.",
    "features": [
      "abs",
      "airbags",
      "esc",
      "ac",
      "climate_control",
      "heated_seats",
      "leather_seats",
      "led_headlights",
      "bluetooth",
      "electric_windows",
      "keyless_entry",
      "push_start",
      "cruise_control",
      "sport_mode"
    ],
    "specifications": {
      "acceleration": 8.9,
      "co2Emissions": 149,
      "doors": 4,
      "engineSize": 2,
      "fuelConsumption": 6.4,
      "height": null,
      "length": null,
      "power": 150,
      "seats": 5,
      "topSpeed": 210,
      "torque": 220,
      "trunkCapacity": null,
      "weight": null,
      "wheelbase": null,
      "width": null
    },
    "financing": {
      "available": true,
      "downPayment": 15,
      "interestRate": 4.2,
      "loanTerm": 84,
      "monthlyPayment": 210,
      "tradeInAccepted": true
    },
    "seo": {
      "keywords": [
        "BMW",
        "318 M-Sport (F30)",
        "2017",
        "petrol",
        "Kosovo",
        "Mitrovica",
        "AUTO ANI",
        "vetura",
        "makina"
      ],
      "metaDescription": "BMW 318 M-Sport (F30) 2017 në shitje në AUTO ANI. Çmimi: €15,400. 220,000 km. Kontaktoni për më shumë detaje.",
      "metaTitle": "BMW 318 M-Sport (F30) 2017 - €15,400 | AUTO ANI"
    },
    "dateAdded": "2025-10-17T14:02:25.785Z",
    "lastUpdated": "2025-10-17T14:53:51.086Z",
    "_createdAt": "2025-10-17T14:02:25Z",
    "_updatedAt": "2025-10-30T19:28:18Z",
    "mainImage": "/images/optimized/vehicles/bmw-318-m-sport-(f30)-2017/1-original.webp",
    "gallery": [
      "/images/optimized/vehicles/bmw-318-m-sport-(f30)-2017/1-original.webp",
      "/images/optimized/vehicles/bmw-318-m-sport-(f30)-2017/2-original.webp",
      "/images/optimized/vehicles/bmw-318-m-sport-(f30)-2017/3-original.webp",
      "/images/optimized/vehicles/bmw-318-m-sport-(f30)-2017/4-original.webp",
      "/images/optimized/vehicles/bmw-318-m-sport-(f30)-2017/5-original.webp"
    ]
  },
  {
    "_id": "OCM7WvHNujFjet6BiNUCBU",
    "slug": {
      "current": "mercedes-benz-c220-bluetec-2015"
    },
    "title": "Mercedes-Benz C220 BlueTec 2015",
    "brand": "Mercedes-Benz",
    "model": "C220 BlueTec",
    "year": 2015,
    "price": 14000,
    "originalPrice": null,
    "mileage": 225000,
    "fuelType": "diesel",
    "transmission": "automatic",
    "category": "sedan",
    "color": "Obsidian Black Metallic",
    "engine": "2.2L BlueTec Diesel",
    "drivetrain": null,
    "status": "available",
    "condition": "used_excellent",
    "featured": false,
    "description": "Mercedes-Benz C220 BlueTec 2015 me teknologji të avancuar. Pa doganë, import evropian. Multi Beam LED, automatik 7-shpejtësi, 5 mënyra të ngasjes. Kamera 360°, auto-frenim, ulëse me ngrohje.",
    "features": [
      "abs",
      "airbags",
      "esc",
      "traction_control",
      "blind_spot",
      "lane_departure",
      "parking_sensors",
      "backup_camera",
      "camera_360",
      "ac",
      "climate_control",
      "heated_seats",
      "memory_seats",
      "leather_seats",
      "gps",
      "bluetooth",
      "premium_sound",
      "led_headlights",
      "electric_windows",
      "electric_mirrors",
      "keyless_entry",
      "push_start",
      "sport_mode",
      "cruise_control",
      "adaptive_cruise"
    ],
    "specifications": {
      "acceleration": 8.1,
      "co2Emissions": 127,
      "doors": 4,
      "engineSize": 2.2,
      "fuelConsumption": 4.8,
      "height": null,
      "length": null,
      "power": 170,
      "seats": 5,
      "topSpeed": 230,
      "torque": 400,
      "trunkCapacity": null,
      "weight": null,
      "wheelbase": null,
      "width": null
    },
    "financing": {
      "available": true,
      "downPayment": 20,
      "interestRate": 4.3,
      "loanTerm": 84,
      "monthlyPayment": 195,
      "tradeInAccepted": true
    },
    "seo": {
      "keywords": [
        "Mercedes-Benz",
        "C220 BlueTec",
        "2015",
        "diesel",
        "Kosovo",
        "Mitrovica",
        "AUTO ANI",
        "vetura",
        "makina"
      ],
      "metaDescription": "Mercedes-Benz C220 BlueTec 2015 në shitje në AUTO ANI. Çmimi: €14,000. 225,000 km. Kontaktoni për më shumë detaje.",
      "metaTitle": "Mercedes-Benz C220 BlueTec 2015 - €14,000 | AUTO ANI"
    },
    "dateAdded": "2025-10-17T14:09:54.818Z",
    "lastUpdated": "2025-10-17T15:35:58.573Z",
    "_createdAt": "2025-10-17T14:09:54Z",
    "_updatedAt": "2025-10-17T15:35:58Z",
    "mainImage": "/images/optimized/vehicles/mercedes-benz-c220-bluetec-2015/1-original.webp",
    "gallery": [
      "/images/optimized/vehicles/mercedes-benz-c220-bluetec-2015/1-original.webp",
      "/images/optimized/vehicles/mercedes-benz-c220-bluetec-2015/2-original.webp",
      "/images/optimized/vehicles/mercedes-benz-c220-bluetec-2015/3-original.webp",
      "/images/optimized/vehicles/mercedes-benz-c220-bluetec-2015/4-original.webp",
      "/images/optimized/vehicles/mercedes-benz-c220-bluetec-2015/5-original.webp",
      "/images/optimized/vehicles/mercedes-benz-c220-bluetec-2015/6-original.webp",
      "/images/optimized/vehicles/mercedes-benz-c220-bluetec-2015/7-original.webp",
      "/images/optimized/vehicles/mercedes-benz-c220-bluetec-2015/8-original.webp",
      "/images/optimized/vehicles/mercedes-benz-c220-bluetec-2015/9-original.webp",
      "/images/optimized/vehicles/mercedes-benz-c220-bluetec-2015/10-original.webp",
      "/images/optimized/vehicles/mercedes-benz-c220-bluetec-2015/11-original.webp",
      "/images/optimized/vehicles/mercedes-benz-c220-bluetec-2015/12-original.webp"
    ]
  },
  {
    "_id": "OCM7WvHNujFjet6BiNVlPK",
    "slug": {
      "current": "skoda-superb-style-business-line-2018"
    },
    "title": "Skoda Superb Style Business Line 2018",
    "brand": "Skoda",
    "model": "Superb Style Business Line",
    "year": 2018,
    "price": 16500,
    "originalPrice": null,
    "mileage": 270,
    "fuelType": "diesel",
    "transmission": "automatic",
    "category": "sedan",
    "color": "Meteor Gray Metallic",
    "engine": "2.0L TDI DSG",
    "drivetrain": null,
    "status": "available",
    "condition": "used_excellent",
    "featured": false,
    "description": "Skoda Superb Style Business Line 2018 në gjendje të përsosur. Vetëm 270 km, rrip i ndërruar dhe shërbim i kryer. Teknologji luksoze: Alcantara, Canton, LED ambient 10-ngjyra, Line Assist, Distance Control.",
    "features": [
      "abs",
      "airbags",
      "esc",
      "traction_control",
      "blind_spot",
      "lane_departure",
      "parking_sensors",
      "backup_camera",
      "camera_360",
      "ac",
      "climate_control",
      "heated_seats",
      "cooled_seats",
      "memory_seats",
      "leather_seats",
      "gps",
      "bluetooth",
      "usb",
      "wireless_charging",
      "android_auto",
      "carplay",
      "premium_sound",
      "led_headlights",
      "electric_windows",
      "electric_mirrors",
      "keyless_entry",
      "push_start",
      "sport_mode",
      "cruise_control",
      "adaptive_cruise",
      "alloy_wheels"
    ],
    "specifications": {
      "acceleration": 8.4,
      "co2Emissions": 123,
      "doors": 4,
      "engineSize": 2,
      "fuelConsumption": 4.7,
      "height": null,
      "length": null,
      "power": 150,
      "seats": 5,
      "topSpeed": 220,
      "torque": 340,
      "trunkCapacity": 625,
      "weight": null,
      "wheelbase": null,
      "width": null
    },
    "financing": {
      "available": true,
      "downPayment": 20,
      "interestRate": 4.1,
      "loanTerm": 84,
      "monthlyPayment": 225,
      "tradeInAccepted": true
    },
    "seo": {
      "keywords": [
        "Skoda",
        "Superb Style Business Line",
        "2018",
        "diesel",
        "Kosovo",
        "Mitrovica",
        "AUTO ANI",
        "vetura",
        "makina"
      ],
      "metaDescription": "Skoda Superb Style Business Line 2018 në shitje në AUTO ANI. Çmimi: €16,500. 270 km. Kontaktoni për më shumë detaje.",
      "metaTitle": "Skoda Superb Style Business Line 2018 - €16,500 | AUTO ANI"
    },
    "dateAdded": "2025-10-17T14:15:57.266Z",
    "lastUpdated": "2025-10-17T15:48:13.197Z",
    "_createdAt": "2025-10-17T14:15:57Z",
    "_updatedAt": "2025-10-17T15:48:13Z",
    "mainImage": "/images/optimized/vehicles/skoda-superb-style-business-line-2018/1-original.webp",
    "gallery": [
      "/images/optimized/vehicles/skoda-superb-style-business-line-2018/1-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-line-2018/2-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-line-2018/3-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-line-2018/4-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-line-2018/5-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-line-2018/6-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-line-2018/7-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-line-2018/8-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-line-2018/9-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-line-2018/10-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-line-2018/11-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-line-2018/12-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-line-2018/13-original.webp"
    ]
  },
  {
    "_id": "OCM7WvHNujFjet6BiNW3kA",
    "slug": {
      "current": "audi-a4-s-line-quattro-2015"
    },
    "title": "Audi A4 S-Line Quattro 2015",
    "brand": "audi",
    "model": "A4 S-Line Quattro",
    "year": 2015,
    "price": 11600,
    "originalPrice": null,
    "mileage": 250000,
    "fuelType": "diesel",
    "transmission": "automatic",
    "category": "sedan",
    "color": "Glacier White Metallic",
    "engine": "2.0L TDI Quattro",
    "drivetrain": null,
    "status": "available",
    "condition": "used_excellent",
    "featured": false,
    "description": "Audi A4 S-Line Quattro 2015 me teknologji të avancuar. Pa doganë, import evropian. Motor 2.0 TDI me 190 PS, Quattro AWD. Histori shërbimi në Audi, Drive Select, ulëse Alcantara.",
    "features": [
      "abs",
      "airbags",
      "esc",
      "traction_control",
      "parking_sensors",
      "ac",
      "climate_control",
      "heated_seats",
      "leather_seats",
      "gps",
      "bluetooth",
      "usb",
      "premium_sound",
      "led_headlights",
      "fog_lights",
      "electric_windows",
      "electric_mirrors",
      "keyless_entry",
      "push_start",
      "sport_mode",
      "cruise_control",
      "awd",
      "alloy_wheels"
    ],
    "specifications": {
      "acceleration": 7.9,
      "co2Emissions": 134,
      "doors": 4,
      "engineSize": 2,
      "fuelConsumption": 5.1,
      "height": null,
      "length": null,
      "power": 190,
      "seats": 5,
      "topSpeed": 235,
      "torque": 400,
      "trunkCapacity": null,
      "weight": null,
      "wheelbase": null,
      "width": null
    },
    "financing": {
      "available": true,
      "downPayment": 15,
      "interestRate": 4.6,
      "loanTerm": 84,
      "monthlyPayment": 160,
      "tradeInAccepted": true
    },
    "seo": {
      "keywords": [
        "Audi",
        "A4 S-Line Quattro",
        "2015",
        "diesel",
        "Kosovo",
        "Mitrovica",
        "AUTO ANI",
        "vetura",
        "makina"
      ],
      "metaDescription": "Audi A4 S-Line Quattro 2015 në shitje në AUTO ANI. Çmimi: €11,600. 250,000 km. Kontaktoni për më shumë detaje.",
      "metaTitle": "Audi A4 S-Line Quattro 2015 - €11,600 | AUTO ANI"
    },
    "dateAdded": "2025-10-17T14:18:21.866Z",
    "lastUpdated": "2025-10-17T15:41:00.393Z",
    "_createdAt": "2025-10-17T14:18:21Z",
    "_updatedAt": "2025-10-17T15:54:01Z",
    "mainImage": "/images/optimized/vehicles/audi-a4-s-line-2015/1-original.webp",
    "gallery": [
      "/images/optimized/vehicles/audi-a4-s-line-2015/1-original.webp",
      "/images/optimized/vehicles/audi-a4-s-line-2015/2-original.webp",
      "/images/optimized/vehicles/audi-a4-s-line-2015/3-original.webp",
      "/images/optimized/vehicles/audi-a4-s-line-2015/4-original.webp",
      "/images/optimized/vehicles/audi-a4-s-line-2015/5-original.webp",
      "/images/optimized/vehicles/audi-a4-s-line-2015/6-original.webp",
      "/images/optimized/vehicles/audi-a4-s-line-2015/7-original.webp",
      "/images/optimized/vehicles/audi-a4-s-line-2015/8-original.webp",
      "/images/optimized/vehicles/audi-a4-s-line-2015/9-original.webp"
    ]
  },
  {
    "_id": "OCM7WvHNujFjet6BiNWYAy",
    "slug": {
      "current": "skoda-superb-style-business-matrix-2020"
    },
    "title": "Skoda Superb Style Business Matrix 2020",
    "brand": "skoda",
    "model": "Superb Style Business Matrix",
    "year": 2020,
    "price": 14499,
    "originalPrice": null,
    "mileage": 300,
    "fuelType": "diesel",
    "transmission": "automatic",
    "category": "sedan",
    "color": "Business Gray Metallic",
    "engine": "2.0L TDI DSG Matrix",
    "drivetrain": null,
    "status": "available",
    "condition": "used_excellent",
    "featured": false,
    "description": "Skoda Superb Style Business Matrix 2020 në gjendje të përsosur. Vetëm 300 km, rrip i ndërruar. Teknologji Matrix LED, kokpit digjital, Canton, LED ambient 10-ngjyra, Line Assist, Distance Control.",
    "features": [
      "abs",
      "airbags",
      "esc",
      "traction_control",
      "blind_spot",
      "lane_departure",
      "parking_sensors",
      "backup_camera",
      "camera_360",
      "ac",
      "climate_control",
      "heated_seats",
      "cooled_seats",
      "memory_seats",
      "leather_seats",
      "gps",
      "bluetooth",
      "usb",
      "wireless_charging",
      "android_auto",
      "carplay",
      "premium_sound",
      "led_headlights",
      "electric_windows",
      "electric_mirrors",
      "keyless_entry",
      "push_start",
      "sport_mode",
      "cruise_control",
      "adaptive_cruise",
      "alloy_wheels"
    ],
    "specifications": {
      "acceleration": 7.8,
      "co2Emissions": 118,
      "doors": 4,
      "engineSize": 2,
      "fuelConsumption": 4.5,
      "height": null,
      "length": null,
      "power": 190,
      "seats": 5,
      "topSpeed": 235,
      "torque": 400,
      "trunkCapacity": 625,
      "weight": null,
      "wheelbase": null,
      "width": null
    },
    "financing": {
      "available": true,
      "downPayment": 25,
      "interestRate": 3.8,
      "loanTerm": 84,
      "monthlyPayment": 200,
      "tradeInAccepted": true
    },
    "seo": {
      "keywords": [
        "Skoda",
        "Superb Style Business Matrix",
        "2020",
        "diesel",
        "Kosovo",
        "Mitrovica",
        "AUTO ANI",
        "vetura",
        "makina"
      ],
      "metaDescription": "Skoda Superb Style Business Matrix 2020 në shitje në AUTO ANI. Çmimi: €14,499. 300 km. Kontaktoni për më shumë detaje.",
      "metaTitle": "Skoda Superb Style Business Matrix 2020 - €14,499 | AUTO ANI"
    },
    "dateAdded": "2025-10-17T14:21:08.725Z",
    "lastUpdated": "2025-10-17T15:45:12.277Z",
    "_createdAt": "2025-10-17T14:21:08Z",
    "_updatedAt": "2025-10-17T15:46:31Z",
    "mainImage": "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/1-original.webp",
    "gallery": [
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/1-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/2-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/3-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/4-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/5-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/6-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/7-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/8-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/9-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/10-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/11-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/12-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/13-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/14-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/15-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/16-original.webp",
      "/images/optimized/vehicles/skoda-superb-style-business-matrix-2020/17-original.webp"
    ]
  },
  {
    "_id": "OCM7WvHNujFjet6BiNYQdq",
    "slug": {
      "current": "skoda-octavia-style-crystal-lights-2022"
    },
    "title": "Skoda Octavia Style Crystal Lights 2022",
    "brand": "Skoda",
    "model": "Octavia Style Crystal Lights",
    "year": 2022,
    "price": 21400,
    "originalPrice": null,
    "mileage": 220000,
    "fuelType": "petrol",
    "transmission": "automatic",
    "category": "hatchback",
    "color": "Brilliant Silver Metallic",
    "engine": "1.5L TSI DSG",
    "drivetrain": null,
    "status": "available",
    "condition": "used_excellent",
    "featured": false,
    "description": "Skoda Octavia Style 2022 me teknologji Crystal Lights në gjendje të përsosur. Shërbim në Skoda, ulëse me kujtesë dhe ngrohje, timon me ngrohje, Lane/Side Assist, 360° kamera.",
    "features": [
      "abs",
      "airbags",
      "esc",
      "traction_control",
      "blind_spot",
      "lane_departure",
      "parking_sensors",
      "backup_camera",
      "camera_360",
      "ac",
      "climate_control",
      "heated_seats",
      "memory_seats",
      "leather_seats",
      "gps",
      "bluetooth",
      "usb",
      "wireless_charging",
      "android_auto",
      "carplay",
      "premium_sound",
      "led_headlights",
      "electric_windows",
      "electric_mirrors",
      "keyless_entry",
      "push_start",
      "sport_mode",
      "cruise_control",
      "adaptive_cruise",
      "alloy_wheels"
    ],
    "specifications": {
      "acceleration": 8.5,
      "co2Emissions": 132,
      "doors": 5,
      "engineSize": 1.5,
      "fuelConsumption": 5.8,
      "height": null,
      "length": null,
      "power": 150,
      "seats": 5,
      "topSpeed": 220,
      "torque": 250,
      "trunkCapacity": 590,
      "weight": null,
      "wheelbase": null,
      "width": null
    },
    "financing": {
      "available": true,
      "downPayment": 20,
      "interestRate": 3.9,
      "loanTerm": 84,
      "monthlyPayment": 290,
      "tradeInAccepted": true
    },
    "seo": {
      "keywords": [
        "Skoda",
        "Octavia Style Crystal Lights",
        "2022",
        "petrol",
        "Kosovo",
        "Mitrovica",
        "AUTO ANI",
        "vetura",
        "makina"
      ],
      "metaDescription": "Skoda Octavia Style Crystal Lights 2022 në shitje në AUTO ANI. Çmimi: €21,400. 220,000 km. Kontaktoni për më shumë detaje.",
      "metaTitle": "Skoda Octavia Style Crystal Lights 2022 - €21,400 | AUTO ANI"
    },
    "dateAdded": "2025-10-17T14:28:54.674Z",
    "lastUpdated": "2025-10-17T15:52:15.479Z",
    "_createdAt": "2025-10-17T14:28:54Z",
    "_updatedAt": "2025-10-17T15:52:15Z",
    "mainImage": "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/1-original.webp",
    "gallery": [
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/1-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/2-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/3-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/4-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/5-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/6-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/7-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/8-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/9-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/10-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/11-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/12-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/13-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/14-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/15-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/16-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/17-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/18-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/19-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/20-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/21-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/22-original.webp",
      "/images/optimized/vehicles/skoda-octavia-style-crystal-lights-2022/23-original.webp"
    ]
  },
  {
    "_id": "PMVE4U8bitoxgOw7TxEgQ0",
    "slug": {
      "current": "seat-leon-fr-dsg-2018"
    },
    "title": "Seat Leon FR DSG 2018",
    "brand": "Seat",
    "model": "Leon FR DSG",
    "year": 2018,
    "price": 9900,
    "originalPrice": null,
    "mileage": 190000,
    "fuelType": "petrol",
    "transmission": "automatic",
    "category": "hatchback",
    "color": "Midnight Black",
    "engine": "1.4L TSI DSG",
    "drivetrain": null,
    "status": "available",
    "condition": "used_good",
    "featured": false,
    "description": "SEAT Leon FR DSG 2018 me performancë sportive. Pa doganë, import evropian. Motor 1.4 TSI me 184 PS, DSG automatik. Panoramë, LED, paketë FR sportive.",
    "features": [
      "abs",
      "airbags",
      "esc",
      "ac",
      "climate_control",
      "heated_seats",
      "panoramic_roof",
      "gps",
      "bluetooth",
      "usb",
      "premium_sound",
      "led_headlights",
      "fog_lights",
      "electric_windows",
      "electric_mirrors",
      "keyless_entry",
      "push_start",
      "sport_mode",
      "cruise_control",
      "alloy_wheels"
    ],
    "specifications": {
      "acceleration": 7.2,
      "co2Emissions": 142,
      "doors": 5,
      "engineSize": 1.4,
      "fuelConsumption": 6.2,
      "height": null,
      "length": null,
      "power": 184,
      "seats": 5,
      "topSpeed": 220,
      "torque": 250,
      "trunkCapacity": null,
      "weight": null,
      "wheelbase": null,
      "width": null
    },
    "financing": {
      "available": true,
      "downPayment": 10,
      "interestRate": 4.8,
      "loanTerm": 84,
      "monthlyPayment": 135,
      "tradeInAccepted": true
    },
    "seo": {
      "keywords": [
        "Seat",
        "Leon FR DSG",
        "2018",
        "petrol",
        "Kosovo",
        "Mitrovica",
        "AUTO ANI",
        "vetura",
        "makina"
      ],
      "metaDescription": "Seat Leon FR DSG 2018 në shitje në AUTO ANI. Çmimi: €9,900. 190,000 km. Kontaktoni për më shumë detaje.",
      "metaTitle": "Seat Leon FR DSG 2018 - €9,900 | AUTO ANI"
    },
    "dateAdded": "2025-10-17T14:12:02.339Z",
    "lastUpdated": "2025-10-17T15:37:07.111Z",
    "_createdAt": "2025-10-17T14:12:02Z",
    "_updatedAt": "2025-10-17T15:37:07Z",
    "mainImage": "/images/optimized/vehicles/seat-leon-fr-dsg-2018/1-original.webp",
    "gallery": [
      "/images/optimized/vehicles/seat-leon-fr-dsg-2018/1-original.webp",
      "/images/optimized/vehicles/seat-leon-fr-dsg-2018/2-original.webp",
      "/images/optimized/vehicles/seat-leon-fr-dsg-2018/3-original.webp",
      "/images/optimized/vehicles/seat-leon-fr-dsg-2018/4-original.webp",
      "/images/optimized/vehicles/seat-leon-fr-dsg-2018/5-original.webp",
      "/images/optimized/vehicles/seat-leon-fr-dsg-2018/6-original.webp",
      "/images/optimized/vehicles/seat-leon-fr-dsg-2018/7-original.webp",
      "/images/optimized/vehicles/seat-leon-fr-dsg-2018/8-original.webp",
      "/images/optimized/vehicles/seat-leon-fr-dsg-2018/9-original.webp"
    ]
  },
  {
    "_id": "gDQJPpKf7NEbh39oUiWhg6",
    "slug": {
      "current": "volkswagen-passat-b8-highline-2015"
    },
    "title": "Volkswagen Passat B8 Highline 2015",
    "brand": "Volkswagen",
    "model": "Passat B8 Highline",
    "year": 2015,
    "price": 13000,
    "originalPrice": null,
    "mileage": 270000,
    "fuelType": "petrol",
    "transmission": "automatic",
    "category": "sedan",
    "color": "Platinum Gray Metallic",
    "engine": "2.0L DSG",
    "drivetrain": null,
    "status": "available",
    "condition": "used_good",
    "featured": false,
    "description": "Volkswagen Passat B8 Highline 2015 me paketë të plotë premium. Pa doganë, import evropian. Teknologji e avancuar me Drive Select, Distance Control, Auto Parking. Ulëse Alcantara me ngrohje, klima 3-zonale.",
    "features": [
      "abs",
      "airbags",
      "esc",
      "traction_control",
      "parking_sensors",
      "backup_camera",
      "ac",
      "climate_control",
      "heated_seats",
      "electric_seats",
      "gps",
      "bluetooth",
      "premium_sound",
      "led_headlights",
      "electric_windows",
      "electric_mirrors",
      "keyless_entry",
      "push_start",
      "sport_mode",
      "cruise_control",
      "adaptive_cruise"
    ],
    "specifications": {
      "acceleration": 9.1,
      "co2Emissions": 155,
      "doors": 4,
      "engineSize": 2,
      "fuelConsumption": 6.8,
      "height": null,
      "length": null,
      "power": 150,
      "seats": 5,
      "topSpeed": 210,
      "torque": 250,
      "trunkCapacity": null,
      "weight": null,
      "wheelbase": null,
      "width": null
    },
    "financing": {
      "available": true,
      "downPayment": 15,
      "interestRate": 4.5,
      "loanTerm": 84,
      "monthlyPayment": 180,
      "tradeInAccepted": true
    },
    "seo": {
      "keywords": [
        "Volkswagen",
        "Passat B8 Highline",
        "2015",
        "petrol",
        "Kosovo",
        "Mitrovica",
        "AUTO ANI",
        "vetura",
        "makina"
      ],
      "metaDescription": "Volkswagen Passat B8 Highline 2015 në shitje në AUTO ANI. Çmimi: €13,000. 270,000 km. Kontaktoni për më shumë detaje.",
      "metaTitle": "Volkswagen Passat B8 Highline 2015 - €13,000 | AUTO ANI"
    },
    "dateAdded": "2025-10-17T14:07:35.901Z",
    "lastUpdated": "2025-10-17T15:34:42.714Z",
    "_createdAt": "2025-10-17T14:07:35Z",
    "_updatedAt": "2025-10-17T15:34:42Z",
    "mainImage": "/images/optimized/vehicles/vw-passat-b8-2016/1-original.webp",
    "gallery": [
      "/images/optimized/vehicles/vw-passat-b8-2016/1-original.webp",
      "/images/optimized/vehicles/vw-passat-b8-2016/2-original.webp",
      "/images/optimized/vehicles/vw-passat-b8-2016/3-original.webp",
      "/images/optimized/vehicles/vw-passat-b8-2016/4-original.webp",
      "/images/optimized/vehicles/vw-passat-b8-2016/5-original.webp",
      "/images/optimized/vehicles/vw-passat-b8-2016/6-original.webp",
      "/images/optimized/vehicles/vw-passat-b8-2016/7-original.webp",
      "/images/optimized/vehicles/vw-passat-b8-2016/8-original.webp",
      "/images/optimized/vehicles/vw-passat-b8-2016/9-original.webp",
      "/images/optimized/vehicles/vw-passat-b8-2016/10-original.webp"
    ]
  },
  {
    "_id": "gDQJPpKf7NEbh39oUiYH9q",
    "slug": {
      "current": "volkswagen-golf-7-gtd-facelift-2017"
    },
    "title": "Volkswagen Golf 7 GTD Facelift 2017",
    "brand": "Volkswagen",
    "model": "Golf 7 GTD Facelift",
    "year": 2017,
    "price": 13800,
    "originalPrice": null,
    "mileage": 255000,
    "fuelType": "diesel",
    "transmission": "automatic",
    "category": "hatchback",
    "color": "Carbon Steel Gray Metallic",
    "engine": "2.0L TDI DSG GTD",
    "drivetrain": null,
    "status": "available",
    "condition": "used_good",
    "featured": false,
    "description": "Volkswagen Golf 7 GTD Facelift 2017 sportiv dhe efikas. RKS të regjistruara, gati për përdorim. Motor 2.0 TDI me 184 PS, DSG automatik. Panoramë, kokpit digjital, paketë GTD sportive.",
    "features": [
      "abs",
      "airbags",
      "esc",
      "traction_control",
      "parking_sensors",
      "ac",
      "climate_control",
      "heated_seats",
      "panoramic_roof",
      "gps",
      "bluetooth",
      "usb",
      "android_auto",
      "carplay",
      "premium_sound",
      "led_headlights",
      "fog_lights",
      "electric_windows",
      "electric_mirrors",
      "keyless_entry",
      "push_start",
      "sport_mode",
      "cruise_control",
      "alloy_wheels"
    ],
    "specifications": {
      "acceleration": 7.4,
      "co2Emissions": 127,
      "doors": 5,
      "engineSize": 2,
      "fuelConsumption": 4.9,
      "height": null,
      "length": null,
      "power": 184,
      "seats": 5,
      "topSpeed": 230,
      "torque": 380,
      "trunkCapacity": null,
      "weight": null,
      "wheelbase": null,
      "width": null
    },
    "financing": {
      "available": true,
      "downPayment": 15,
      "interestRate": 4.4,
      "loanTerm": 84,
      "monthlyPayment": 190,
      "tradeInAccepted": true
    },
    "seo": {
      "keywords": [
        "Volkswagen",
        "Golf 7 GTD Facelift",
        "2017",
        "diesel",
        "Kosovo",
        "Mitrovica",
        "AUTO ANI",
        "vetura",
        "makina"
      ],
      "metaDescription": "Volkswagen Golf 7 GTD Facelift 2017 në shitje në AUTO ANI. Çmimi: €13,800. 255,000 km. Kontaktoni për më shumë detaje.",
      "metaTitle": "Volkswagen Golf 7 GTD Facelift 2017 - €13,800 | AUTO ANI"
    },
    "dateAdded": "2025-10-17T14:14:25.326Z",
    "lastUpdated": "2025-10-17T15:38:23.276Z",
    "_createdAt": "2025-10-17T14:14:25Z",
    "_updatedAt": "2025-10-17T15:38:23Z",
    "mainImage": "/images/optimized/vehicles/golf-7-gtd-2017/1-original.webp",
    "gallery": [
      "/images/optimized/vehicles/golf-7-gtd-2017/1-original.webp",
      "/images/optimized/vehicles/golf-7-gtd-2017/2-original.webp",
      "/images/optimized/vehicles/golf-7-gtd-2017/3-original.webp",
      "/images/optimized/vehicles/golf-7-gtd-2017/4-original.webp",
      "/images/optimized/vehicles/golf-7-gtd-2017/5-original.webp",
      "/images/optimized/vehicles/golf-7-gtd-2017/6-original.webp",
      "/images/optimized/vehicles/golf-7-gtd-2017/7-original.webp",
      "/images/optimized/vehicles/golf-7-gtd-2017/8-original.webp",
      "/images/optimized/vehicles/golf-7-gtd-2017/9-original.webp",
      "/images/optimized/vehicles/golf-7-gtd-2017/10-original.webp",
      "/images/optimized/vehicles/golf-7-gtd-2017/11-original.webp",
      "/images/optimized/vehicles/golf-7-gtd-2017/12-original.webp",
      "/images/optimized/vehicles/golf-7-gtd-2017/13-original.webp"
    ]
  },
  {
    "_id": "gDQJPpKf7NEbh39oUiZn5q",
    "slug": {
      "current": "seat-tarraco-xcellence-4drive-2019"
    },
    "title": "Seat Tarraco Xcellence 4Drive 2019",
    "brand": "seat",
    "model": "Tarraco Xcellence 4Drive",
    "year": 2019,
    "price": 21999,
    "originalPrice": null,
    "mileage": 215000,
    "fuelType": "petrol",
    "transmission": "automatic",
    "category": "suv",
    "color": "Pearl White",
    "engine": "2.0L TSI DSG",
    "drivetrain": null,
    "status": "available",
    "condition": "used_excellent",
    "featured": true,
    "description": "SEAT Tarraco Xcellence 4Drive 2019 në gjendje të shkëlqyer. SUV familjar 7-vendësh me AWD. Digital cockpit, panoramë, Park Assist, Lane Assist. Rrip i ndërruar dhe shërbim i kryer.",
    "features": [
      "abs",
      "airbags",
      "esc",
      "traction_control",
      "blind_spot",
      "lane_departure",
      "parking_sensors",
      "backup_camera",
      "panoramic_roof",
      "ac",
      "climate_control",
      "heated_seats",
      "leather_seats",
      "gps",
      "bluetooth",
      "usb",
      "android_auto",
      "carplay",
      "premium_sound",
      "led_headlights",
      "electric_windows",
      "electric_mirrors",
      "keyless_entry",
      "push_start",
      "sport_mode",
      "cruise_control",
      "adaptive_cruise",
      "awd",
      "alloy_wheels"
    ],
    "specifications": {
      "acceleration": 9.8,
      "co2Emissions": 164,
      "doors": 5,
      "engineSize": 2,
      "fuelConsumption": 7.2,
      "height": null,
      "length": null,
      "power": 150,
      "seats": 7,
      "topSpeed": 200,
      "torque": 250,
      "trunkCapacity": 700,
      "weight": null,
      "wheelbase": null,
      "width": null
    },
    "financing": {
      "available": true,
      "downPayment": 20,
      "interestRate": 4,
      "loanTerm": 84,
      "monthlyPayment": 295,
      "tradeInAccepted": true
    },
    "seo": {
      "keywords": [
        "Seat",
        "Tarraco Xcellence 4Drive",
        "2019",
        "petrol",
        "Kosovo",
        "Mitrovica",
        "AUTO ANI",
        "vetura",
        "makina"
      ],
      "metaDescription": "Seat Tarraco Xcellence 4Drive 2019 në shitje në AUTO ANI. Çmimi: €21,999. 215,000 km. Kontaktoni për më shumë detaje.",
      "metaTitle": "Seat Tarraco Xcellence 4Drive 2019 - €21,999 | AUTO ANI"
    },
    "dateAdded": "2025-10-17T14:23:47.330Z",
    "lastUpdated": "2025-10-17T14:54:01.194Z",
    "_createdAt": "2025-10-17T14:23:47Z",
    "_updatedAt": "2025-10-17T15:55:34Z",
    "mainImage": "/images/listings/seat/1.jpg",
    "gallery": [
      "/images/listings/seat/1.jpg",
      "/images/listings/seat/2.jpg",
      "/images/listings/seat/3.jpg",
      "/images/listings/seat/4.jpg",
      "/images/listings/seat/5.jpg",
      "/images/listings/seat/6.jpg",
      "/images/listings/seat/7.jpg",
      "/images/listings/seat/8.jpg",
      "/images/listings/seat/9.jpg",
      "/images/listings/seat/10.jpg",
      "/images/listings/seat/11.jpg",
      "/images/listings/seat/12.jpg",
      "/images/listings/seat/13.jpg",
      "/images/listings/seat/14.jpg",
      "/images/listings/seat/15.jpg",
      "/images/listings/seat/16.jpg",
      "/images/listings/seat/17.jpg",
      "/images/listings/seat/18.jpg",
      "/images/listings/seat/19.jpg"
    ]
  },
  {
    "_id": "gDQJPpKf7NEbh39oUic3Ju",
    "slug": {
      "current": "bmw-520d-xdrive-sport-line-2019"
    },
    "title": "BMW 520d xDrive Sport Line 2019",
    "brand": "bmw",
    "model": "520d xDrive Sport Line",
    "year": 2019,
    "price": 14900,
    "originalPrice": null,
    "mileage": 188000,
    "fuelType": "diesel",
    "transmission": "automatic",
    "category": "sedan",
    "color": "Alpine White",
    "engine": "2.0L TwinPower Turbo xDrive",
    "drivetrain": null,
    "status": "available",
    "condition": "used_excellent",
    "featured": true,
    "description": "BMW 520d xDrive Sport Line 2019 executive sedan në gjendje të shkëlqyer. xDrive AWD, 190 PS TwinPower Turbo. Shërbim në BMW, Park Assist, Auto Brake, Intelligent Safety, Attention Assist.",
    "features": [
      "abs",
      "airbags",
      "esc",
      "traction_control",
      "blind_spot",
      "lane_departure",
      "parking_sensors",
      "backup_camera",
      "camera_360",
      "ac",
      "climate_control",
      "heated_seats",
      "memory_seats",
      "leather_seats",
      "gps",
      "bluetooth",
      "usb",
      "wireless_charging",
      "android_auto",
      "carplay",
      "premium_sound",
      "led_headlights",
      "electric_windows",
      "electric_mirrors",
      "keyless_entry",
      "push_start",
      "sport_mode",
      "cruise_control",
      "adaptive_cruise",
      "awd",
      "alloy_wheels"
    ],
    "specifications": {
      "acceleration": 7,
      "co2Emissions": 137,
      "doors": 4,
      "engineSize": 2,
      "fuelConsumption": 5.2,
      "height": null,
      "length": null,
      "power": 190,
      "seats": 5,
      "topSpeed": 240,
      "torque": 400,
      "trunkCapacity": null,
      "weight": null,
      "wheelbase": null,
      "width": null
    },
    "financing": {
      "available": true,
      "downPayment": 15,
      "interestRate": 4.2,
      "loanTerm": 84,
      "monthlyPayment": 205,
      "tradeInAccepted": true
    },
    "seo": {
      "keywords": [
        "BMW",
        "520d xDrive Sport Line",
        "2019",
        "diesel",
        "Kosovo",
        "Mitrovica",
        "AUTO ANI",
        "vetura",
        "makina"
      ],
      "metaDescription": "BMW 520d xDrive Sport Line 2019 në shitje në AUTO ANI. Çmimi: €14,900. 188,000 km. Kontaktoni për më shumë detaje.",
      "metaTitle": "BMW 520d xDrive Sport Line 2019 - €14,900 | AUTO ANI"
    },
    "dateAdded": "2025-10-17T14:38:43.970Z",
    "lastUpdated": "2025-10-17T15:55:45.919Z",
    "_createdAt": "2025-10-17T14:38:44Z",
    "_updatedAt": "2025-10-30T19:29:59Z",
    "mainImage": "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/1-original.webp",
    "gallery": [
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/1-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/2-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/3-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/4-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/5-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/6-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/7-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/8-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/9-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/10-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/11-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/12-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/13-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/14-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/15-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/16-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/17-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/18-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/19-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/20-original.webp",
      "/images/optimized/vehicles/bmw-520d-xdrive-sport-line-2019/21-original.webp"
    ]
  },
  {
    "_id": "seat-tarraco-xperience-7-ulse-2022",
    "slug": {
      "current": "seat-tarraco-xperience-7-ulse-2022"
    },
    "title": "Seat Tarraco Xperience 7 Ulse 2022",
    "brand": "seat",
    "model": "Tarraco Xperience 7 Ulse",
    "year": 2022,
    "price": 19800,
    "originalPrice": null,
    "mileage": 180000,
    "fuelType": "diesel",
    "transmission": "automatic",
    "category": "suv",
    "color": "white",
    "engine": "2.0 TDI 150PS",
    "drivetrain": "front",
    "status": "available",
    "condition": "used_excellent",
    "featured": true,
    "description": "Seat Tarraco Xperience 7 Ulse 2022 - Premium Family SUV. Perfect for export. No accidents, guaranteed mileage. Packed with features including digital cockpit, LED lights, 7 seats with heating, keyless entry, auto parking.",
    "features": [
      "digital_cockpit",
      "distance_control",
      "led_camera",
      "led_lights",
      "heated_seats",
      "keyless_entry",
      "webasto",
      "powered_trunk",
      "electronic_hitch",
      "led_ambient",
      "drive_select",
      "lane_assist",
      "park_assist",
      "brake_assist",
      "dual_alloys",
      "ac",
      "climate_control",
      "bluetooth",
      "gps",
      "abs",
      "esc",
      "airbags"
    ],
    "specifications": {
      "doors": 5,
      "seats": 7,
      "engineSize": 2.0,
      "power": 150,
      "torque": 360,
      "acceleration": null,
      "topSpeed": null,
      "fuelConsumption": 6.2,
      "co2Emissions": null,
      "weight": 1730,
      "length": 4735,
      "width": 1840,
      "height": 1620,
      "wheelbase": 2840,
      "trunkCapacity": 710
    },
    "financing": {
      "available": true,
      "downPayment": 1980,
      "monthlyPayment": 330,
      "loanTerm": 60,
      "interestRate": 0,
      "tradeInAccepted": true
    },
    "seo": {
      "keywords": [
        "Seat",
        "Tarraco",
        "Xperience",
        "2022",
        "diesel",
        "7-seater",
        "Kosovo",
        "AUTO ANI",
        "vetura",
        "SUV",
        "export"
      ],
      "metaDescription": "Seat Tarraco Xperience 7 Ulse 2022 në shitje në AUTO ANI. Çmimi: €19,800. 180,000 km. Premium 7-seater SUV me të gjitha features. Kontaktoni për më shumë detaje.",
      "metaTitle": "Seat Tarraco Xperience 7 Ulse 2022 - €19,800 | AUTO ANI"
    },
    "dateAdded": "2025-12-29T21:00:00.000Z",
    "lastUpdated": "2025-12-29T21:00:00.000Z",
    "_createdAt": "2025-12-29T21:00:00Z",
    "_updatedAt": "2025-12-29T21:00:00Z",
    "mainImage": "/images/listings/seat-tarraco-2022/1.jpg",
    "gallery": [
      "/images/listings/seat-tarraco-2022/1.jpg",
      "/images/listings/seat-tarraco-2022/2.jpg",
      "/images/listings/seat-tarraco-2022/3.jpg",
      "/images/listings/seat-tarraco-2022/4.jpg",
      "/images/listings/seat-tarraco-2022/5.jpg",
      "/images/listings/seat-tarraco-2022/6.jpg",
      "/images/listings/seat-tarraco-2022/7.jpg",
      "/images/listings/seat-tarraco-2022/8.jpg",
      "/images/listings/seat-tarraco-2022/9.jpg",
      "/images/listings/seat-tarraco-2022/10.jpg",
      "/images/listings/seat-tarraco-2022/11.jpg",
      "/images/listings/seat-tarraco-2022/12.jpg"
    ]
  },
  {
    "_id": "skoda-kodiaq-sport-line-2019",
    "slug": {
      "current": "skoda-kodiaq-sport-line-2019"
    },
    "title": "Skoda Kodiaq Sport Line 2019",
    "brand": "skoda",
    "model": "Kodiaq Sport Line",
    "year": 2019,
    "price": 24500,
    "originalPrice": null,
    "mileage": 255000,
    "fuelType": "diesel",
    "transmission": "automatic",
    "category": "suv",
    "color": "grey",
    "engine": "2.0 TSI 190PS",
    "drivetrain": "4x4",
    "status": "available",
    "condition": "used_excellent",
    "featured": true,
    "description": "Skoda Kodiaq Sport Line 2019 - Premium 7-seater SUV with 4x4 Drivetrain. Perfect for export. No accidents, genuine mileage. Packed with features including navigation, leather seats, heated seats, 4x4 all-terrain capability, cruise control, and more.",
    "features": [
      "navigation",
      "leather_seats",
      "heated_seats",
      "climate_control",
      "cruise_control",
      "adaptive_cruise",
      "lane_assist",
      "park_assist",
      "backup_camera",
      "parking_sensors",
      "bluetooth",
      "gps",
      "usb",
      "android_auto",
      "carplay",
      "electric_windows",
      "electric_mirrors",
      "keyless_entry",
      "push_start",
      "alloy_wheels",
      "roof_rails",
      "tow_hitch",
      "abs",
      "esc",
      "airbags"
    ],
    "specifications": {
      "doors": 5,
      "seats": 7,
      "engineSize": 2.0,
      "power": 190,
      "torque": 320,
      "acceleration": null,
      "topSpeed": null,
      "fuelConsumption": 7.2,
      "co2Emissions": null,
      "weight": 1875,
      "length": 4697,
      "width": 1882,
      "height": 1676,
      "wheelbase": 2791,
      "trunkCapacity": 720
    },
    "financing": {
      "available": true,
      "downPayment": 2450,
      "monthlyPayment": 410,
      "loanTerm": 60,
      "interestRate": 0,
      "tradeInAccepted": true
    },
    "seo": {
      "keywords": [
        "Skoda",
        "Kodiaq",
        "Sport Line",
        "2019",
        "diesel",
        "4x4",
        "7-seater",
        "Kosovo",
        "AUTO ANI",
        "vetura",
        "SUV",
        "export"
      ],
      "metaDescription": "Skoda Kodiaq Sport Line 2019 në shitje në AUTO ANI. Çmimi: €24,500. 255,000 km. Premium 7-seater SUV 4x4 me të gjitha features. Kontaktoni për më shumë detaje.",
      "metaTitle": "Skoda Kodiaq Sport Line 2019 - €24,500 | AUTO ANI"
    },
    "dateAdded": "2025-12-29T23:30:00.000Z",
    "lastUpdated": "2025-12-29T23:30:00.000Z",
    "_createdAt": "2025-12-29T23:30:00Z",
    "_updatedAt": "2025-12-29T23:30:00Z",
    "mainImage": "/images/listings/skoda/1.jpg",
    "gallery": [
      "/images/listings/skoda/1.jpg",
      "/images/listings/skoda/2.jpg",
      "/images/listings/skoda/3.jpg",
      "/images/listings/skoda/4.jpg",
      "/images/listings/skoda/5.jpg",
      "/images/listings/skoda/6.jpg",
      "/images/listings/skoda/7.jpg",
      "/images/listings/skoda/8.jpg",
      "/images/listings/skoda/9.jpg",
      "/images/listings/skoda/10.jpg",
      "/images/listings/skoda/11.jpg",
      "/images/listings/skoda/12.jpg"
    ]
  }
];

// Helper functions for data access
export const vehicleHelpers = {
  // Get all vehicles
  getAll: () => VEHICLES_DATABASE,

  // Get all available vehicles (not sold)
  getAvailable: () =>
    VEHICLES_DATABASE.filter(v => v.status !== 'sold'),

  // Get featured vehicles
  getFeatured: (limit = 6) =>
    VEHICLES_DATABASE
      .filter(v => v.featured && v.status !== 'sold')
      .slice(0, limit),

  // Get by slug
  getBySlug: (slug: string) =>
    VEHICLES_DATABASE.find(v => v.slug.current === slug),

  // Get by ID
  getById: (id: string) =>
    VEHICLES_DATABASE.find(v => v._id === id),

  // Get by category
  getByCategory: (category: string) =>
    VEHICLES_DATABASE.filter(v => v.category === category),

  // Get by brand
  getByBrand: (brand: string) =>
    VEHICLES_DATABASE.filter(v => v.brand === brand),

  // Advanced filtering
  filter: (filters: {
    brand?: string;
    model?: string;
    minYear?: number;
    maxYear?: number;
    minPrice?: number;
    maxPrice?: number;
    fuelType?: string;
    transmission?: string;
    category?: string;
    minMileage?: number;
    maxMileage?: number;
    condition?: string;
    features?: string[];
  }) => {
    return VEHICLES_DATABASE.filter(vehicle => {
      if (filters.brand && vehicle.brand !== filters.brand) return false;
      if (filters.model && !vehicle.model.toLowerCase().includes(filters.model.toLowerCase())) return false;
      if (filters.minYear && vehicle.year < filters.minYear) return false;
      if (filters.maxYear && vehicle.year > filters.maxYear) return false;
      if (filters.minPrice && vehicle.price < filters.minPrice) return false;
      if (filters.maxPrice && vehicle.price > filters.maxPrice) return false;
      if (filters.fuelType && vehicle.fuelType !== filters.fuelType) return false;
      if (filters.transmission && vehicle.transmission !== filters.transmission) return false;
      if (filters.category && vehicle.category !== filters.category) return false;
      if (filters.minMileage && vehicle.mileage && vehicle.mileage < filters.minMileage) return false;
      if (filters.maxMileage && vehicle.mileage && vehicle.mileage > filters.maxMileage) return false;
      if (filters.condition && vehicle.condition !== filters.condition) return false;
      if (filters.features && filters.features.length > 0) {
        const vehicleFeatures = vehicle.features || [];
        const hasAllFeatures = filters.features.every(f => vehicleFeatures.includes(f));
        if (!hasAllFeatures) return false;
      }
      return true;
    });
  },

  // Search vehicles
  search: (query: string) => {
    const lowerQuery = query.toLowerCase();
    return VEHICLES_DATABASE.filter(v =>
      v.brand.toLowerCase().includes(lowerQuery) ||
      v.model.toLowerCase().includes(lowerQuery) ||
      v.title.toLowerCase().includes(lowerQuery) ||
      v.description?.toLowerCase().includes(lowerQuery) ||
      v.engine?.toLowerCase().includes(lowerQuery)
    );
  },

  // Sort vehicles
  sort: (vehicles: HardcodedVehicle[], sortBy: 'price_asc' | 'price_desc' | 'year_desc' | 'mileage_asc' | 'date_desc') => {
    const sorted = [...vehicles];
    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'year_desc':
        return sorted.sort((a, b) => b.year - a.year);
      case 'mileage_asc':
        return sorted.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
      case 'date_desc':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.dateAdded || a._createdAt || '');
          const dateB = new Date(b.dateAdded || b._createdAt || '');
          return dateB.getTime() - dateA.getTime();
        });
      default:
        return sorted;
    }
  },

  // Get unique values for filters
  getFilterOptions: () => ({
    brands: [...new Set(VEHICLES_DATABASE.map(v => v.brand))].sort(),
    categories: [...new Set(VEHICLES_DATABASE.filter(v => v.category).map(v => v.category!))].sort(),
    fuelTypes: [...new Set(VEHICLES_DATABASE.filter(v => v.fuelType).map(v => v.fuelType!))].sort(),
    transmissions: [...new Set(VEHICLES_DATABASE.filter(v => v.transmission).map(v => v.transmission!))].sort(),
    conditions: [...new Set(VEHICLES_DATABASE.filter(v => v.condition).map(v => v.condition!))].sort(),
    colors: [...new Set(VEHICLES_DATABASE.filter(v => v.color).map(v => v.color!))].sort(),
    years: [...new Set(VEHICLES_DATABASE.map(v => v.year))].sort((a, b) => b - a),
    priceRange: {
      min: Math.min(...VEHICLES_DATABASE.map(v => v.price)),
      max: Math.max(...VEHICLES_DATABASE.map(v => v.price))
    },
    mileageRange: {
      min: Math.min(...VEHICLES_DATABASE.filter(v => v.mileage).map(v => v.mileage!)),
      max: Math.max(...VEHICLES_DATABASE.filter(v => v.mileage).map(v => v.mileage!))
    }
  }),

  // Get statistics
  getStats: () => ({
    total: VEHICLES_DATABASE.length,
    available: VEHICLES_DATABASE.filter(v => v.status === 'available').length,
    sold: VEHICLES_DATABASE.filter(v => v.status === 'sold').length,
    reserved: VEHICLES_DATABASE.filter(v => v.status === 'reserved').length,
    featured: VEHICLES_DATABASE.filter(v => v.featured).length,
    averagePrice: Math.round(VEHICLES_DATABASE.reduce((acc, v) => acc + v.price, 0) / VEHICLES_DATABASE.length),
    byBrand: VEHICLES_DATABASE.reduce((acc, v) => {
      acc[v.brand] = (acc[v.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  })
};