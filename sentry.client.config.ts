// This file configures the initialization of Sentry for client-side code.
// The config you add here will be used whenever a client route loads.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import './lib/monitoring/sentry'
import { initSentry } from './lib/monitoring/sentry'

initSentry()