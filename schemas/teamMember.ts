export default {
  name: 'teamMember',
  title: 'Team Member',
  type: 'document',
  fields: [
    {name: 'name', title: 'Name', type: 'string'},
    {name: 'role', title: 'Role', type: 'string'},
    {name: 'email', title: 'Email', type: 'string'},
    {name: 'phone', title: 'Phone', type: 'string'},
    {name: 'experience', title: 'Years of Experience', type: 'number'},
    {name: 'languages', title: 'Languages', type: 'array', of: [{type: 'string'}]},
    {name: 'specialties', title: 'Specialties', type: 'array', of: [{type: 'string'}]},
    {name: 'image', title: 'Photo', type: 'image'},
    {name: 'bio', title: 'Bio', type: 'text'},
  ]
}