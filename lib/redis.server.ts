// Server-only Redis wrapper
// This file ensures Redis is only imported on the server side
import 'server-only';

export { redis } from './redis';