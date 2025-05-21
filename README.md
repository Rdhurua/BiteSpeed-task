## server link
 - https://bitespeed-task-lsxp.onrender.com
 - it is the server link only.
 - we can go through above link by /identify , and providing {email,phoneNumber} ,we will get the results.



   ## Database set up(for confirming)
   - **Neon PostgreSQL** as the hosted database solution is used.
   - a table named `contacts` was created using the schema below in sql

    CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    phoneNumber VARCHAR,
    email VARCHAR,
    linkedId INTEGER REFERENCES contacts(id),
    linkPrecedence VARCHAR CHECK (linkPrecedence IN ('primary', 'secondary')) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP
);
