// This file configures the initialization of Sentry for server-side code.
// The config you add here will be used whenever a server route loads.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import './lib/monitoring/sentry'
import { initSentry } from './lib/monitoring/sentry'

initSentry()