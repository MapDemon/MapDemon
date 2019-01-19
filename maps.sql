DROP TABLE IF EXISTS users, maps;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS maps (
    id SERIAL PRIMARY KEY,
    mapname VARCHAR(255),
    mapdata TEXT[][],
    user_id INTEGER NOT NULL REFERENCES users(id)
);


INSERT INTO users (username, password) VALUES (
    'Bilbo',
    'Baggins'
);

INSERT INTO maps (mapname, mapdata, user_id) VALUES (
    'Hobbiton',
    '{{2,2}}',
    '1'
);