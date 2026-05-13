-- Idempotent database bootstrap.
-- Mounted by Postgres at /docker-entrypoint-initdb.d/init.sql for first-time
-- volume init, AND re-run by each deploy workflow against existing clusters.
-- Safe to run any number of times.

SELECT 'CREATE DATABASE alpina'       WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'alpina')\gexec
SELECT 'CREATE DATABASE puck_prophet' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'puck_prophet')\gexec
SELECT 'CREATE DATABASE mlflow'       WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mlflow')\gexec
SELECT 'CREATE DATABASE underscore'   WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'underscore')\gexec
