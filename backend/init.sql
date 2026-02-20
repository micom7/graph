-- Run once to initialise the database:
-- psql -U postgres -d graph_db -f init.sql

-- ── Types ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS device_types (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(50)  NOT NULL UNIQUE,
    label     VARCHAR(100),
    color     VARCHAR(7),
    icon      VARCHAR(50)
);

-- ── Devices ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devices (
    id          SERIAL PRIMARY KEY,
    type_id     INT REFERENCES device_types(id),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    pos_x       FLOAT DEFAULT 0,
    pos_y       FLOAT DEFAULT 0
);

-- ── Ports ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ports (
    id          SERIAL PRIMARY KEY,
    device_id   INT REFERENCES devices(id) ON DELETE CASCADE,
    direction   VARCHAR(3) NOT NULL CHECK (direction IN ('in', 'out')),
    name        VARCHAR(100) NOT NULL,
    port_order  INT DEFAULT 0
);

-- ── Connections ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS connections (
    id          SERIAL PRIMARY KEY,
    source_port INT REFERENCES ports(id) ON DELETE CASCADE,
    target_port INT REFERENCES ports(id) ON DELETE CASCADE,
    UNIQUE(source_port, target_port)
);

-- ── Seed device types ─────────────────────────────────────────────────────────
INSERT INTO device_types (name, label, color, icon) VALUES
    ('zasuvka',     'Засувка',      '#4A90D9', 'zasuvka'),
    ('noria',       'Норія',        '#E67E22', 'noria'),
    ('transporter', 'Транспортер',  '#27AE60', 'transporter'),
    ('redler',      'Редлер',       '#8E44AD', 'redler'),
    ('bunker',      'Бункер',       '#C0392B', 'bunker'),
    ('sylos',       'Силос',        '#16A085', 'sylos')
ON CONFLICT (name) DO NOTHING;
