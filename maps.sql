DROP TABLE IF EXISTS users, maps;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS maps (
    id SERIAL PRIMARY KEY,
    mapname VARCHAR(255),
    mapdata VARCHAR(1200)
    user_id INTEGER NOT NULL REFERENCES users(id),
);


INSERT INTO users (username, password) VALUES (
    'Bilbo',
    'Baggins'
);