# Database Schema

## Tables

### users
- id (uuid, PK)
- email (text, unique)
- name (text)
- role (text)
- created_at (timestamp)

### calls
- id (uuid, PK)
- user_id (uuid, FK → users)
- contact_id (uuid, FK → contacts)
- status (text)
- duration (integer)
- started_at (timestamp)
- ended_at (timestamp)

### contacts
- id (uuid, PK)
- user_id (uuid, FK → users)
- name (text)
- phone (text)
- email (text)
- company (text)
- created_at (timestamp)

### transcriptions
- id (uuid, PK)
- call_id (uuid, FK → calls)
- text (text)
- confidence (real)
- created_at (timestamp)

## Indexes
- calls(user_id, started_at)
- contacts(user_id, created_at)
- transcriptions(call_id)
