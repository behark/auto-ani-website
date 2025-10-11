-- Create appointments table for AUTO ANI
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "vehicleId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    type TEXT NOT NULL,
    "scheduledDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    duration INTEGER DEFAULT 60,
    status TEXT DEFAULT 'SCHEDULED',
    notes TEXT,
    "reminderMethod" TEXT,
    "reminderSent" BOOLEAN DEFAULT false,
    "confirmationSent" BOOLEAN DEFAULT false,
    location TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "appointments_vehicleId_status_idx" ON appointments("vehicleId", status);
CREATE INDEX IF NOT EXISTS "appointments_scheduledDate_status_idx" ON appointments("scheduledDate", status);
CREATE INDEX IF NOT EXISTS "appointments_customerEmail_idx" ON appointments("customerEmail");
CREATE INDEX IF NOT EXISTS "appointments_scheduledDate_scheduledTime_idx" ON appointments("scheduledDate", "scheduledTime");

-- Add a trigger to automatically update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO appointments (
    "vehicleId",
    "customerName",
    "customerEmail",
    "customerPhone",
    type,
    "scheduledDate",
    "scheduledTime",
    duration,
    status,
    notes
) VALUES
(
    NULL,
    'Test Customer',
    'test@example.com',
    '+38349123456',
    'TEST_DRIVE',
    '2025-10-03',
    '14:00',
    60,
    'SCHEDULED',
    'Test appointment for contact form testing'
) ON CONFLICT DO NOTHING;