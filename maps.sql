DROP TABLE IF EXISTS maps;

CREATE TABLE maps(
    id SERIAL PRIMARY KEY,
    userName VARCHAR(255),
    adventure VARCHAR(255),
    mapData VARCHAR(1200)
)