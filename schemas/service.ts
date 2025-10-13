export default {
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    {name: 'name', title: 'Service Name', type: 'string'},
    {name: 'description', title: 'Description', type: 'text'},
    {name: 'price', title: 'Price (EUR)', type: 'number'},
    {name: 'duration', title: 'Duration (minutes)', type: 'number'},
    {name: 'features', title: 'Features', type: 'array', of: [{type: 'string'}]},
    {name: 'category', title: 'Category', type: 'string'},
    {name: 'image', title: 'Service Image', type: 'image'},
    {name: 'businessTypes', title: 'Business Types', type: 'array', of: [{type: 'string'}]},
    {name: 'bookingRequired', title: 'Booking Required', type: 'boolean'},
  ]
}