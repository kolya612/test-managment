CREATE TABLE users (
    id SERIAL primary key,
    name varchar(50) not null,
    email varchar(24) not null,
    sex int
);
