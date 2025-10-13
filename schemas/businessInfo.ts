export default {
  name: 'businessInfo',
  title: 'Business Information',
  type: 'document',
  fields: [
    {name: 'name', title: 'Business Name', type: 'string'},
    {name: 'description', title: 'Description', type: 'text'},
    {name: 'yearEstablished', title: 'Year Established', type: 'number'},
    {name: 'phone', title: 'Phone', type: 'string'},
    {name: 'email', title: 'Email', type: 'string'},
    {
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        {name: 'street', title: 'Street', type: 'string'},
        {name: 'city', title: 'City', type: 'string'},
        {name: 'country', title: 'Country', type: 'string'},
        {name: 'zipCode', title: 'Zip Code', type: 'string'},
      ]
    },
    {name: 'certifications', title: 'Certifications', type: 'array', of: [{type: 'string'}]},
    {name: 'languages', title: 'Languages', type: 'array', of: [{type: 'string'}]},
  ]
}