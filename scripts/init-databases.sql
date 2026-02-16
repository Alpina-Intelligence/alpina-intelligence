-- Create project databases
-- Note: The user is created automatically by POSTGRES_USER env var
-- These databases are created on first container startup only

-- Main alpina site (blog, etc.)
CREATE DATABASE alpina;

-- Puck Prophet project
CREATE DATABASE puck_prophet;
