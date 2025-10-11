// This file configures the initialization of Sentry for edge runtime.
// The config you add here will be used whenever edge runtime routes load.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import './lib/monitoring/sentry'
import { initSentry } from './lib/monitoring/sentry'

initSentry()