export default {
  name: 'vehicle',
  title: 'Vehicle',
  type: 'document',
  fields: [
    {name: 'brand', title: 'Brand', type: 'string'},
    {name: 'model', title: 'Model', type: 'string'},
    {name: 'year', title: 'Year', type: 'number'},
    {name: 'price', title: 'Price (EUR)', type: 'number'},
    {name: 'mileage', title: 'Mileage', type: 'number'},
    {name: 'fuelType', title: 'Fuel Type', type: 'string'},
    {name: 'transmission', title: 'Transmission', type: 'string'},
    {name: 'category', title: 'Category', type: 'string'},
    {name: 'color', title: 'Color', type: 'string'},
    {name: 'engine', title: 'Engine', type: 'string'},
    {name: 'featured', title: 'Featured', type: 'boolean'},
    {name: 'mainImage', title: 'Main Image', type: 'image'},
    {name: 'gallery', title: 'Gallery', type: 'array', of: [{type: 'image'}]},
    {name: 'description', title: 'Description', type: 'text'},
    {name: 'slug', title: 'Slug', type: 'slug', options: {source: 'brand'}},
  ]
}