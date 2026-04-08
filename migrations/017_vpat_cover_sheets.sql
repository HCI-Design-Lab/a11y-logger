-- Migration 017: vpat_cover_sheets table
-- Stores cover sheet metadata for each VPAT (product info, vendor, dates, etc.)

CREATE TABLE vpat_cover_sheets (
  id TEXT PRIMARY KEY,
  vpat_id TEXT NOT NULL REFERENCES vpats(id) ON DELETE CASCADE UNIQUE,
  -- Product information
  product_name TEXT,
  product_version TEXT,
  product_description TEXT,
  -- Vendor / contact
  vendor_company TEXT,
  vendor_contact_name TEXT,
  vendor_contact_email TEXT,
  vendor_contact_phone TEXT,
  vendor_website TEXT,
  -- Dates
  report_date TEXT,
  -- Notes
  evaluation_methods TEXT,
  notes TEXT,
  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
