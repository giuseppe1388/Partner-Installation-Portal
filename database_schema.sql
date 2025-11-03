-- Partner Installation Portal Database Schema
-- Compatible with MySQL 8.0+ and Supabase (PostgreSQL)
-- Created: 2025-10-28

-- ============================================================================
-- USERS TABLE - Core user table backing auth flow
-- ============================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openId` VARCHAR(64) NOT NULL UNIQUE COMMENT 'Manus OAuth identifier',
  `name` TEXT,
  `email` VARCHAR(320),
  `loginMethod` VARCHAR(64),
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_openId (openId),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Core user table for authentication and authorization';

-- ============================================================================
-- PARTNERS TABLE - Stores partner information with Salesforce mapping
-- ============================================================================
CREATE TABLE IF NOT EXISTS `partners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `salesforcePartnerId` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Salesforce Partner ID',
  `name` VARCHAR(255) NOT NULL COMMENT 'Partner company name',
  `email` VARCHAR(320) COMMENT 'Partner contact email',
  `phone` VARCHAR(50) COMMENT 'Partner contact phone',
  `startingAddress` TEXT COMMENT 'Starting address for travel time calculation',
  `username` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Username for partner login',
  `passwordHash` TEXT NOT NULL COMMENT 'Hashed password for partner login',
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_salesforcePartnerId (salesforcePartnerId),
  INDEX idx_username (username),
  INDEX idx_isActive (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores partner information with Salesforce integration';

-- ============================================================================
-- TEAMS TABLE - Stores installation teams with Salesforce mapping
-- ============================================================================
CREATE TABLE IF NOT EXISTS `teams` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `salesforceTeamId` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Salesforce Team ID',
  `partnerId` INT NOT NULL COMMENT 'Partner ID that owns this team',
  `name` VARCHAR(255) NOT NULL COMMENT 'Team name',
  `description` TEXT COMMENT 'Team description',
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partnerId) REFERENCES partners(id) ON DELETE CASCADE,
  INDEX idx_salesforceTeamId (salesforceTeamId),
  INDEX idx_partnerId (partnerId),
  INDEX idx_isActive (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores installation teams with Salesforce integration';

-- ============================================================================
-- INSTALLATIONS TABLE - Stores installation records from Salesforce
-- ============================================================================
CREATE TABLE IF NOT EXISTS `installations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `serviceAppointmentId` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Salesforce Service Appointment ID',
  `customerName` VARCHAR(255) NOT NULL COMMENT 'Customer full name',
  `customerSurname` VARCHAR(255) COMMENT 'Customer surname',
  `customerCF` VARCHAR(50) COMMENT 'Customer fiscal code',
  `customerPhone` VARCHAR(50) COMMENT 'Customer phone',
  `customerEmail` VARCHAR(320) COMMENT 'Customer email',
  `customerAddress` TEXT COMMENT 'Customer residential address',
  `installationAddress` TEXT NOT NULL COMMENT 'Installation address (where work will be done)',
  `installationType` VARCHAR(255) COMMENT 'Installation type',
  `technicalNotes` TEXT COMMENT 'Technical notes for installation',
  `installerNotes` TEXT COMMENT 'Installer notes',
  `imagesToView` TEXT COMMENT 'JSON array of image URLs to view',
  `completionLink` TEXT COMMENT 'Link to Salesforce Digital Experience for completion',
  `pdfUrl` TEXT COMMENT 'PDF attachment URL',
  `durationMinutes` INT COMMENT 'Estimated duration in minutes',
  `travelTimeMinutes` INT COMMENT 'Calculated travel time in minutes (from Google Maps)',
  `status` ENUM('pending', 'accepted', 'scheduled', 'in_progress', 'completed', 'cancelled', 'rejected') NOT NULL DEFAULT 'pending',
  `rejectionReason` TEXT COMMENT 'Rejection reason (when partner rejects the installation)',
  `acceptedAt` DATETIME COMMENT 'Date/time when installation was accepted by partner',
  `teamId` INT COMMENT 'Assigned team ID (null if not scheduled)',
  `partnerId` INT COMMENT 'Assigned partner ID (null if not scheduled)',
  `scheduledStart` DATETIME COMMENT 'Scheduled start date/time',
  `scheduledEnd` DATETIME COMMENT 'Scheduled end date/time',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (partnerId) REFERENCES partners(id) ON DELETE SET NULL,
  INDEX idx_serviceAppointmentId (serviceAppointmentId),
  INDEX idx_status (status),
  INDEX idx_partnerId (partnerId),
  INDEX idx_teamId (teamId),
  INDEX idx_customerCF (customerCF),
  INDEX idx_scheduledStart (scheduledStart),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores installation records from Salesforce';

-- ============================================================================
-- API_CONFIG TABLE - Stores API keys and URLs for integrations
-- ============================================================================
CREATE TABLE IF NOT EXISTS `apiConfig` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `configKey` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Configuration key (e.g., google_maps_api_key)',
  `configValue` TEXT NOT NULL COMMENT 'Configuration value (API key or URL)',
  `description` TEXT COMMENT 'Configuration description',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_configKey (configKey)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores API keys and URLs for integrations';

-- ============================================================================
-- TECHNICIANS TABLE - Stores field technicians/installers with login credentials
-- ============================================================================
CREATE TABLE IF NOT EXISTS `technicians` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `teamId` INT NOT NULL COMMENT 'Team ID this technician belongs to',
  `partnerId` INT NOT NULL COMMENT 'Partner ID this technician belongs to',
  `name` VARCHAR(255) NOT NULL COMMENT 'Technician full name',
  `email` VARCHAR(320) COMMENT 'Technician email',
  `phone` VARCHAR(50) COMMENT 'Technician phone',
  `username` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Username for technician login',
  `passwordHash` TEXT NOT NULL COMMENT 'Hashed password for technician login',
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (partnerId) REFERENCES partners(id) ON DELETE CASCADE,
  INDEX idx_teamId (teamId),
  INDEX idx_partnerId (partnerId),
  INDEX idx_username (username),
  INDEX idx_isActive (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores field technicians/installers with login credentials';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
-- Additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_installations_status_partnerId ON installations(status, partnerId);
CREATE INDEX IF NOT EXISTS idx_installations_status_teamId ON installations(status, teamId);
CREATE INDEX IF NOT EXISTS idx_installations_scheduledStart_partnerId ON installations(scheduledStart, partnerId);
CREATE INDEX IF NOT EXISTS idx_teams_partnerId_isActive ON teams(partnerId, isActive);
CREATE INDEX IF NOT EXISTS idx_technicians_teamId_isActive ON technicians(teamId, isActive);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Installations with Partner and Team Info
CREATE OR REPLACE VIEW v_installations_with_details AS
SELECT 
  i.id,
  i.serviceAppointmentId,
  i.customerName,
  i.customerSurname,
  i.customerCF,
  i.customerPhone,
  i.customerEmail,
  i.installationAddress,
  i.installationType,
  i.status,
  i.scheduledStart,
  i.scheduledEnd,
  i.durationMinutes,
  i.travelTimeMinutes,
  p.name as partnerName,
  p.email as partnerEmail,
  t.name as teamName,
  i.createdAt,
  i.updatedAt
FROM installations i
LEFT JOIN partners p ON i.partnerId = p.id
LEFT JOIN teams t ON i.teamId = t.id;

-- View: Partner Dashboard Summary
CREATE OR REPLACE VIEW v_partner_dashboard AS
SELECT 
  p.id,
  p.name,
  p.email,
  COUNT(DISTINCT i.id) as totalInstallations,
  SUM(CASE WHEN i.status = 'pending' THEN 1 ELSE 0 END) as pendingInstallations,
  SUM(CASE WHEN i.status = 'accepted' THEN 1 ELSE 0 END) as acceptedInstallations,
  SUM(CASE WHEN i.status = 'scheduled' THEN 1 ELSE 0 END) as scheduledInstallations,
  SUM(CASE WHEN i.status = 'completed' THEN 1 ELSE 0 END) as completedInstallations,
  COUNT(DISTINCT t.id) as totalTeams
FROM partners p
LEFT JOIN installations i ON p.id = i.partnerId
LEFT JOIN teams t ON p.id = t.partnerId
WHERE p.isActive = TRUE
GROUP BY p.id, p.name, p.email;

-- ============================================================================
-- SAMPLE DATA (Optional - Comment out if not needed)
-- ============================================================================

-- Insert sample admin user
-- INSERT INTO users (openId, name, email, role) 
-- VALUES ('admin-001', 'Admin User', 'admin@example.com', 'admin');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
-- 
-- NOTES FOR SUPABASE MIGRATION:
-- 1. If using Supabase (PostgreSQL), convert ENUM to custom types:
--    CREATE TYPE user_role AS ENUM ('user', 'admin');
--    CREATE TYPE installation_status AS ENUM ('pending', 'accepted', 'scheduled', 'in_progress', 'completed', 'cancelled', 'rejected');
--
-- 2. Replace BOOLEAN with BOOLEAN (PostgreSQL uses BOOLEAN natively)
--
-- 3. Replace DATETIME with TIMESTAMP WITH TIME ZONE
--
-- 4. Replace TIMESTAMP DEFAULT CURRENT_TIMESTAMP with TIMESTAMP DEFAULT NOW()
--
-- 5. Replace AUTO_INCREMENT with SERIAL or BIGSERIAL
--
-- 6. Replace COMMENT syntax with PostgreSQL comments:
--    COMMENT ON TABLE table_name IS 'comment';
--    COMMENT ON COLUMN table_name.column_name IS 'comment';

