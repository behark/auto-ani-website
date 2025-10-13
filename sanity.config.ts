import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

// Schema imports
import businessInfo from './schemas/businessInfo'
import teamMember from './schemas/teamMember'
import service from './schemas/service'
import vehicle from './schemas/vehicle'
import testimonial from './schemas/testimonial'

export default defineConfig({
  name: 'default',
  title: 'AUTO ANI Automotive CMS',

  projectId: 'j2t31xge',
  dataset: 'production',

  plugins: [
    structureTool(),
    visionTool(),
  ],

  schema: {
    types: [
      businessInfo,
      teamMember,
      service,
      vehicle,
      testimonial,
    ],
  },
})