DROP TABLE IF EXISTS users, maps;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL
    isDM BOOLEAN 
);

CREATE TABLE IF NOT EXISTS maps (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) REFERENCES users (username),
    adventure VARCHAR(255),
    mapdata VARCHAR(1200)
    username VARCHAR(255) REFERENCES users (username)
);
