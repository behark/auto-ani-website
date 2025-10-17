export default {
  name: 'vehicle',
  title: 'Vehicle',
  type: 'document',
  fields: [
    {
      name: 'brand',
      title: 'Brand',
      type: 'string',
      options: {
        list: [
          {title: 'BMW', value: 'bmw'},
          {title: 'Mercedes-Benz', value: 'mercedes'},
          {title: 'Audi', value: 'audi'},
          {title: 'Volkswagen', value: 'volkswagen'},
          {title: 'Toyota', value: 'toyota'},
          {title: 'Honda', value: 'honda'},
          {title: 'Ford', value: 'ford'},
          {title: 'Peugeot', value: 'peugeot'},
          {title: 'Renault', value: 'renault'},
          {title: 'Fiat', value: 'fiat'},
          {title: 'Opel', value: 'opel'},
          {title: 'Skoda', value: 'skoda'},
          {title: 'Seat', value: 'seat'},
          {title: 'Hyundai', value: 'hyundai'},
          {title: 'Kia', value: 'kia'},
          {title: 'Mazda', value: 'mazda'},
          {title: 'Nissan', value: 'nissan'},
          {title: 'Other', value: 'other'}
        ]
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'model',
      title: 'Model',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Auto-generated from brand, model, and year',
      initialValue: (document: any) => {
        const { brand, model, year } = document;
        if (brand && model && year) {
          return `${brand} ${model} ${year}`;
        }
        return '';
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (Rule: any) => Rule.required().min(1990).max(new Date().getFullYear() + 1)
    },
    {
      name: 'price',
      title: 'Price (EUR)',
      type: 'number',
      validation: (Rule: any) => Rule.required().min(0)
    },
    {
      name: 'originalPrice',
      title: 'Original Price (EUR)',
      type: 'number',
      description: 'Used to show discounts',
    },
    {
      name: 'mileage',
      title: 'Mileage (km)',
      type: 'number',
      validation: (Rule: any) => Rule.min(0)
    },
    {
      name: 'fuelType',
      title: 'Fuel Type',
      type: 'string',
      options: {
        list: [
          {title: 'Diesel', value: 'diesel'},
          {title: 'Petrol/Gasoline', value: 'petrol'},
          {title: 'Hybrid', value: 'hybrid'},
          {title: 'Electric', value: 'electric'},
          {title: 'LPG', value: 'lpg'},
          {title: 'CNG', value: 'cng'}
        ]
      }
    },
    {
      name: 'transmission',
      title: 'Transmission',
      type: 'string',
      options: {
        list: [
          {title: 'Manual', value: 'manual'},
          {title: 'Automatic', value: 'automatic'},
          {title: 'Semi-Automatic', value: 'semi-automatic'},
          {title: 'CVT', value: 'cvt'}
        ]
      }
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Sedan', value: 'sedan'},
          {title: 'Hatchback', value: 'hatchback'},
          {title: 'SUV', value: 'suv'},
          {title: 'Wagon/Estate', value: 'wagon'},
          {title: 'Coupe', value: 'coupe'},
          {title: 'Convertible', value: 'convertible'},
          {title: 'Van', value: 'van'},
          {title: 'Pickup', value: 'pickup'},
          {title: 'Crossover', value: 'crossover'}
        ]
      }
    },
    {
      name: 'color',
      title: 'Color',
      type: 'string',
      options: {
        list: [
          {title: 'Black', value: 'black'},
          {title: 'White', value: 'white'},
          {title: 'Silver', value: 'silver'},
          {title: 'Gray', value: 'gray'},
          {title: 'Blue', value: 'blue'},
          {title: 'Red', value: 'red'},
          {title: 'Green', value: 'green'},
          {title: 'Brown', value: 'brown'},
          {title: 'Yellow', value: 'yellow'},
          {title: 'Orange', value: 'orange'},
          {title: 'Purple', value: 'purple'},
          {title: 'Gold', value: 'gold'},
          {title: 'Beige', value: 'beige'},
          {title: 'Other', value: 'other'}
        ]
      }
    },
    {
      name: 'engine',
      title: 'Engine',
      type: 'string',
      description: 'e.g., 2.0L TDI, 1.8T, V6'
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Available', value: 'available'},
          {title: 'Reserved', value: 'reserved'},
          {title: 'Sold', value: 'sold'},
          {title: 'Coming Soon', value: 'coming_soon'}
        ]
      },
      initialValue: 'available',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'condition',
      title: 'Condition',
      type: 'string',
      options: {
        list: [
          {title: 'New', value: 'new'},
          {title: 'Used - Excellent', value: 'used_excellent'},
          {title: 'Used - Good', value: 'used_good'},
          {title: 'Used - Fair', value: 'used_fair'},
          {title: 'Certified Pre-Owned', value: 'certified'}
        ]
      },
      initialValue: 'used_good',
    },
    {
      name: 'featured',
      title: 'Featured Vehicle',
      type: 'boolean',
      description: 'Show this vehicle on homepage and featured sections'
    },
    {
      name: 'features',
      title: 'Features & Equipment',
      type: 'array',
      of: [
        {
          type: 'string',
          options: {
            list: [
              // Safety Features
              {title: 'ABS Brakes', value: 'abs'},
              {title: 'Airbags', value: 'airbags'},
              {title: 'Electronic Stability Control', value: 'esc'},
              {title: 'Traction Control', value: 'traction_control'},
              {title: 'Blind Spot Monitoring', value: 'blind_spot'},
              {title: 'Lane Departure Warning', value: 'lane_departure'},
              {title: 'Parking Sensors', value: 'parking_sensors'},
              {title: 'Backup Camera', value: 'backup_camera'},
              {title: '360° Camera', value: 'camera_360'},
              // Comfort Features
              {title: 'Air Conditioning', value: 'ac'},
              {title: 'Climate Control', value: 'climate_control'},
              {title: 'Heated Seats', value: 'heated_seats'},
              {title: 'Cooled Seats', value: 'cooled_seats'},
              {title: 'Electric Seats', value: 'electric_seats'},
              {title: 'Memory Seats', value: 'memory_seats'},
              {title: 'Leather Seats', value: 'leather_seats'},
              {title: 'Sunroof', value: 'sunroof'},
              {title: 'Panoramic Roof', value: 'panoramic_roof'},
              // Technology
              {title: 'GPS Navigation', value: 'gps'},
              {title: 'Bluetooth', value: 'bluetooth'},
              {title: 'USB Ports', value: 'usb'},
              {title: 'Wireless Charging', value: 'wireless_charging'},
              {title: 'Apple CarPlay', value: 'carplay'},
              {title: 'Android Auto', value: 'android_auto'},
              {title: 'Premium Sound System', value: 'premium_sound'},
              {title: 'Touchscreen Display', value: 'touchscreen'},
              // Exterior
              {title: 'Alloy Wheels', value: 'alloy_wheels'},
              {title: 'LED Headlights', value: 'led_headlights'},
              {title: 'Fog Lights', value: 'fog_lights'},
              {title: 'Electric Windows', value: 'electric_windows'},
              {title: 'Electric Mirrors', value: 'electric_mirrors'},
              {title: 'Keyless Entry', value: 'keyless_entry'},
              {title: 'Push Button Start', value: 'push_start'},
              // Performance
              {title: 'Sport Mode', value: 'sport_mode'},
              {title: 'Cruise Control', value: 'cruise_control'},
              {title: 'Adaptive Cruise Control', value: 'adaptive_cruise'},
              {title: 'All-Wheel Drive', value: 'awd'},
              {title: '4WD', value: '4wd'}
            ]
          }
        }
      ],
      options: {
        layout: 'tags'
      }
    },
    {
      name: 'specifications',
      title: 'Technical Specifications',
      type: 'object',
      fields: [
        {name: 'doors', title: 'Doors', type: 'number'},
        {name: 'seats', title: 'Seats', type: 'number'},
        {name: 'engineSize', title: 'Engine Size (L)', type: 'number'},
        {name: 'power', title: 'Power (HP)', type: 'number'},
        {name: 'torque', title: 'Torque (Nm)', type: 'number'},
        {name: 'acceleration', title: '0-100 km/h (seconds)', type: 'number'},
        {name: 'topSpeed', title: 'Top Speed (km/h)', type: 'number'},
        {name: 'fuelConsumption', title: 'Fuel Consumption (L/100km)', type: 'number'},
        {name: 'co2Emissions', title: 'CO2 Emissions (g/km)', type: 'number'},
        {name: 'weight', title: 'Weight (kg)', type: 'number'},
        {name: 'length', title: 'Length (mm)', type: 'number'},
        {name: 'width', title: 'Width (mm)', type: 'number'},
        {name: 'height', title: 'Height (mm)', type: 'number'},
        {name: 'wheelbase', title: 'Wheelbase (mm)', type: 'number'},
        {name: 'trunkCapacity', title: 'Trunk Capacity (L)', type: 'number'}
      ],
      options: {
        collapsible: true,
        collapsed: false
      }
    },
    {
      name: 'financing',
      title: 'Financing Options',
      type: 'object',
      fields: [
        {name: 'available', title: 'Financing Available', type: 'boolean'},
        {name: 'downPayment', title: 'Min Down Payment (%)', type: 'number'},
        {name: 'monthlyPayment', title: 'Est. Monthly Payment (EUR)', type: 'number'},
        {name: 'loanTerm', title: 'Max Loan Term (months)', type: 'number'},
        {name: 'interestRate', title: 'Interest Rate (%)', type: 'number'},
        {name: 'tradeInAccepted', title: 'Trade-in Accepted', type: 'boolean'}
      ],
      options: {
        collapsible: true,
        collapsed: true
      }
    },
    {
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Important for SEO and accessibility',
        }
      ]
    },
    {
      name: 'gallery',
      title: 'Gallery Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
              description: 'Important for SEO and accessibility',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
              description: 'Optional caption for the image',
            }
          ]
        }
      ],
      options: {
        layout: 'grid',
      },
      validation: (Rule: any) => Rule.max(20).warning('Consider limiting to 20 images for better performance'),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (Rule: any) => Rule.max(500).warning('Keep description under 500 characters for better SEO')
    },
    {
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      fields: [
        {
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
          description: 'Custom title for search engines (auto-generated if empty)',
          validation: (Rule: any) => Rule.max(60).warning('Keep under 60 characters for optimal display')
        },
        {
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          description: 'Description for search results (auto-generated if empty)',
          validation: (Rule: any) => Rule.max(160).warning('Keep under 160 characters for optimal display')
        },
        {
          name: 'keywords',
          title: 'Keywords',
          type: 'array',
          of: [{type: 'string'}],
          description: 'SEO keywords for this vehicle',
          options: {
            layout: 'tags'
          }
        }
      ],
      options: {
        collapsible: true,
        collapsed: true
      }
    },
    {
      name: 'dateAdded',
      title: 'Date Added',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true
    },
    {
      name: 'lastUpdated',
      title: 'Last Updated',
      type: 'datetime',
      readOnly: true
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: (doc: any) => `${doc.brand} ${doc.model} ${doc.year}`,
        maxLength: 96,
        slugify: (input: string) =>
          input
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '')
      },
      validation: (Rule: any) => Rule.required().error('Slug is required for SEO'),
    },
  ],
  preview: {
    select: {
      title: 'title',
      brand: 'brand',
      model: 'model',
      year: 'year',
      price: 'price',
      status: 'status',
      media: 'mainImage',
      featured: 'featured'
    },
    prepare(selection: any) {
      const { title, brand, model, year, price, status, media, featured } = selection;

      // Create a rich title
      const displayTitle = title || `${brand} ${model} ${year}`;

      // Create subtitle with price and status
      const priceText = price ? `€${price.toLocaleString()}` : 'Price TBD';
      const statusIcon = status === 'available' ? '✅' : status === 'sold' ? '❌' : status === 'reserved' ? '⏳' : '🔜';
      const featuredIcon = featured ? '⭐' : '';

      return {
        title: `${featuredIcon}${displayTitle}`,
        subtitle: `${priceText} ${statusIcon} ${status}`,
        media: media
      }
    }
  },
  orderings: [
    {
      title: 'Date Added (newest first)',
      name: 'dateAddedDesc',
      by: [
        {field: 'dateAdded', direction: 'desc'}
      ]
    },
    {
      title: 'Price (low to high)',
      name: 'priceAsc',
      by: [
        {field: 'price', direction: 'asc'}
      ]
    },
    {
      title: 'Price (high to low)',
      name: 'priceDesc',
      by: [
        {field: 'price', direction: 'desc'}
      ]
    },
    {
      title: 'Year (newest first)',
      name: 'yearDesc',
      by: [
        {field: 'year', direction: 'desc'}
      ]
    },
    {
      title: 'Brand A-Z',
      name: 'brandAsc',
      by: [
        {field: 'brand', direction: 'asc'}
      ]
    },
    {
      title: 'Featured first',
      name: 'featuredFirst',
      by: [
        {field: 'featured', direction: 'desc'},
        {field: 'dateAdded', direction: 'desc'}
      ]
    }
  ]
}