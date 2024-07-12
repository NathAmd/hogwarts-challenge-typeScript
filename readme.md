# Harry Potter House Chat Project

This project is a chat application inspired by the Harry Potter universe. Users can sign up, log in, view and post messages in the lobby of their respective house. The houses are based on the four houses of Hogwarts School of Witchcraft and Wizardry in Harry Potter: Gryffindor, Hufflepuff, Ravenclaw, and Slytherin.

## Installation

1. Clone this repository on your local machine.
2. Navigate to the project directory in your terminal.
3. Install the dependencies by running `npm install`.

## Usage

1. Start the server by running `node index.js` in your terminal.
2. Open your browser and go to `http://localhost:5000`.

## Features

- Users can sign up using an email and a password.
- Users can log in using their email and password.
- Users can view messages from their house lobby.
- Users can post messages on their house lobby.
- Users can edit their own messages.
- Administrators can view all messages.
- Administrators can promote or demote users.

## Technologies Used

- Node.js
- Express.js
- Mongoose
- bcrypt
- express-brute

## Code Overview

The project is structured as a standard Express.js application. The entry point of the application is the `index.js` file. It sets up the Express.js server, connects to the MongoDB database using Mongoose, and includes the routes defined in `userRoutes.js`.

The `userRoutes.js` file defines the routes for user registration, login, and message handling. It uses Mongoose to interact with the MongoDB database and bcrypt to hash user passwords. It also uses express-brute for brute force protection.

## Author

- Nathanaël Amand
