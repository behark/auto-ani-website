// Vehicle data extracted from folder structure
// This data will be used to add vehicles to Sanity CMS

const vehicleData = [
  {
    folder: "audi-q5-2020",
    title: "2020 Audi Q5",
    brand: "Audi",
    model: "Q5",
    year: 2020,
    category: "SUV",
    slug: "2020-audi-q5",
    featured: true,
    description: "Luxury SUV with premium features and excellent performance.",
    fuelType: "Gasoline",
    transmission: "Automatic",
    // Images will be uploaded manually via Sanity Studio
    imageCount: 15
  },
  {
    folder: "golf-7-gtd-2017",
    title: "2017 Volkswagen Golf 7 GTD",
    brand: "Volkswagen",
    model: "Golf GTD",
    year: 2017,
    category: "Hatchback",
    slug: "2017-vw-golf-7-gtd",
    featured: false,
    description: "Sporty diesel hatchback with excellent fuel economy and performance.",
    fuelType: "Diesel",
    transmission: "Manual",
    imageCount: 14
  },
  {
    folder: "peugeot-3008-premium-2018",
    title: "2018 Peugeot 3008 Premium",
    brand: "Peugeot",
    model: "3008 Premium",
    year: 2018,
    category: "SUV",
    slug: "2018-peugeot-3008-premium",
    featured: true,
    description: "Modern SUV with premium trim and advanced technology features.",
    fuelType: "Gasoline",
    transmission: "Automatic"
  },
  {
    folder: "skoda-superb-2018",
    title: "2018 Škoda Superb",
    brand: "Škoda",
    model: "Superb",
    year: 2018,
    category: "Sedan",
    slug: "2018-skoda-superb",
    featured: false,
    description: "Spacious and comfortable sedan with excellent value for money.",
    fuelType: "Gasoline",
    transmission: "Automatic"
  },
  {
    folder: "skoda-superb-2020",
    title: "2020 Škoda Superb",
    brand: "Škoda",
    model: "Superb",
    year: 2020,
    category: "Sedan",
    slug: "2020-skoda-superb",
    featured: true,
    description: "Latest generation Superb with updated design and technology.",
    fuelType: "Gasoline",
    transmission: "Automatic"
  },
  {
    folder: "skoda-superb-2020-pro",
    title: "2020 Škoda Superb Pro",
    brand: "Škoda",
    model: "Superb Pro",
    year: 2020,
    category: "Sedan",
    slug: "2020-skoda-superb-pro",
    featured: true,
    description: "Premium trim Superb with additional luxury features and equipment.",
    fuelType: "Gasoline",
    transmission: "Automatic"
  },
  {
    folder: "vw-passat-b8-2016",
    title: "2016 Volkswagen Passat B8",
    brand: "Volkswagen",
    model: "Passat B8",
    year: 2016,
    category: "Sedan",
    slug: "2016-vw-passat-b8",
    featured: false,
    description: "Reliable and comfortable sedan from Volkswagen's B8 generation.",
    fuelType: "Diesel",
    transmission: "Automatic"
  }
];

module.exports = vehicleData;