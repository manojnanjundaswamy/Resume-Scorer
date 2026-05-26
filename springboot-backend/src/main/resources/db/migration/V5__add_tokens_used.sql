-- V5: Add tokens_used column to analyses table
-- Tracks AI token consumption for billing/analytics

ALTER TABLE analyses ADD COLUMN tokens_used INT;