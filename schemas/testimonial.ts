export default {
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    {name: 'customerName', title: 'Customer Name', type: 'string'},
    {name: 'rating', title: 'Rating (1-5)', type: 'number'},
    {name: 'review', title: 'Review', type: 'text'},
    {name: 'vehiclePurchased', title: 'Vehicle Purchased', type: 'string'},
    {name: 'businessType', title: 'Business Type', type: 'string'},
  ]
}