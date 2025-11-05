-- Partner Installation Portal - Database Schema for Supabase
-- This SQL script creates all necessary tables for the Partner Installation Portal
-- Compatible with PostgreSQL (used by Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for OAuth authentication)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Partners table (stores partner information with Salesforce mapping)
CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  "salesforcePartnerId" VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320),
  phone VARCHAR(50),
  "startingAddress" TEXT,
  username VARCHAR(100) NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Teams table (stores installation teams with Salesforce mapping)
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  "salesforceTeamId" VARCHAR(255) NOT NULL UNIQUE,
  "partnerId" INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Installations table (stores installation records from Salesforce)
CREATE TABLE IF NOT EXISTS installations (
  id SERIAL PRIMARY KEY,
  "serviceAppointmentId" VARCHAR(255) NOT NULL UNIQUE,
  "workOrderId" VARCHAR(255),
  "customerName" VARCHAR(255) NOT NULL,
  "customerSurname" VARCHAR(255),
  "customerCF" VARCHAR(50),
  "customerPhone" VARCHAR(50),
  "customerEmail" VARCHAR(320),
  "customerAddress" TEXT,
  "installationAddress" TEXT NOT NULL,
  "installationType" VARCHAR(255),
  "technicalNotes" TEXT,
  "installerNotes" TEXT,
  "imagesToView" TEXT,
  "completionLink" TEXT,
  "pdfUrl" TEXT,
  "durationMinutes" INTEGER,
  "travelTimeMinutes" INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'scheduled', 'in_progress', 'completed', 'cancelled', 'rejected')),
  "rejectionReason" TEXT,
  "acceptedAt" TIMESTAMP,
  "teamId" INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  "partnerId" INTEGER REFERENCES partners(id) ON DELETE SET NULL,
  "scheduledStart" TIMESTAMP,
  "scheduledEnd" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- API Configuration table (stores API keys and URLs for integrations)
CREATE TABLE IF NOT EXISTS "apiConfig" (
  id SERIAL PRIMARY KEY,
  "configKey" VARCHAR(100) NOT NULL UNIQUE,
  "configValue" TEXT NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Technicians table (stores field technicians/installers with login credentials)
CREATE TABLE IF NOT EXISTS technicians (
  id SERIAL PRIMARY KEY,
  "teamId" INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  "partnerId" INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320),
  phone VARCHAR(50),
  username VARCHAR(100) NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_openId ON users("openId");
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_partners_salesforcePartnerId ON partners("salesforcePartnerId");
CREATE INDEX IF NOT EXISTS idx_partners_username ON partners(username);
CREATE INDEX IF NOT EXISTS idx_teams_salesforceTeamId ON teams("salesforceTeamId");
CREATE INDEX IF NOT EXISTS idx_teams_partnerId ON teams("partnerId");
CREATE INDEX IF NOT EXISTS idx_installations_serviceAppointmentId ON installations("serviceAppointmentId");
CREATE INDEX IF NOT EXISTS idx_installations_workOrderId ON installations("workOrderId");
CREATE INDEX IF NOT EXISTS idx_installations_status ON installations(status);
CREATE INDEX IF NOT EXISTS idx_installations_teamId ON installations("teamId");
CREATE INDEX IF NOT EXISTS idx_installations_partnerId ON installations("partnerId");
CREATE INDEX IF NOT EXISTS idx_installations_scheduledStart ON installations("scheduledStart");
CREATE INDEX IF NOT EXISTS idx_installations_createdAt ON installations("createdAt");
CREATE INDEX IF NOT EXISTS idx_technicians_teamId ON technicians("teamId");
CREATE INDEX IF NOT EXISTS idx_technicians_partnerId ON technicians("partnerId");
CREATE INDEX IF NOT EXISTS idx_technicians_username ON technicians(username);
CREATE INDEX IF NOT EXISTS idx_apiConfig_configKey ON "apiConfig"("configKey");

-- Create function to update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installations_updated_at BEFORE UPDATE ON installations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apiConfig_updated_at BEFORE UPDATE ON "apiConfig"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default configuration entries (optional - customize as needed)
INSERT INTO "apiConfig" ("configKey", "configValue", description)
VALUES 
  ('google_maps_api_key', '', 'Google Maps API Key for travel time calculation'),
  ('salesforce_webhook_url', '', 'Salesforce webhook URL for receiving installation data'),
  ('salesforce_api_key', '', 'Salesforce API Key for integration')
ON CONFLICT ("configKey") DO NOTHING;

