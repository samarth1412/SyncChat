<div align="center">

![SyncChat logo](client/public/syncchat_full_logo.svg)

# SyncChat

Real-time, host-controlled chatrooms for events, classrooms, teams, and quick audience feedback.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=111)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=fff)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=fff)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=flat-square&logo=socket.io&logoColor=fff)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=fff)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Uploads-3448C5?style=flat-square&logo=cloudinary&logoColor=fff)

</div>

## Overview

SyncChat lets a host create a temporary chatroom, share a room code or invite link, and collect real-time messages from participants. Rooms can be time-limited, capped by participant count, and optionally configured to allow image uploads.

The project is split into a React/Vite frontend and an Express/Socket.IO backend. MongoDB stores users and rooms, Cloudinary handles uploaded images, and Nodemailer sends OTP and invitation emails.

## Features

- Host-created temporary rooms with custom name, description, duration, participant limit, and image-upload permission.
- Real-time chat powered by Socket.IO rooms.
- Live user presence with online/offline state and last-seen timestamps.
- Typing indicators for active participants in the current room.
- Message delivery states for outgoing messages: sent, delivered, and seen.
- Guest joining by room ID without requiring a full account.
- JWT authentication with secure cookie support.
- Email verification and password reset via OTP.
- Email invitations with shareable room links.
- Participant list, host controls, session countdown, and session close flow.
- Responsive React UI with Tailwind CSS and Framer Motion.

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion, Axios, React Router |
| Realtime | Socket.IO, socket.io-client |
| Backend | Node.js, Express, Cookie Parser, CORS |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Email | Nodemailer, SMTP provider such as Brevo |
| Media | Cloudinary, Multer |
| Deployment | Vercel-ready client/server configs |

## Project Structure

```text
syncchat/
|-- client/
|   |-- public/              # Static images and SyncChat logo assets
|   |-- src/
|   |   |-- components/      # Reusable UI components and modals
|   |   |-- context/         # App-wide auth/backend context
|   |   |-- pages/           # Route-level screens
|   |   |-- App.jsx          # Client routes
|   |   `-- main.jsx         # React entry point
|   |-- package.json
|   `-- vite.config.js
`-- server/
    |-- config/              # MongoDB, Cloudinary, and email config
    |-- controllers/         # API request handlers
    |-- middlewares/         # JWT auth middleware
    |-- models/              # Mongoose schemas
    |-- routes/              # Express route definitions
    |-- socket/              # In-memory realtime room state
    |-- utils/               # Room ID generator
    |-- server.js            # Express and Socket.IO entry point
    `-- package.json
```

## How It Works

1. A host signs up or logs in.
2. The host creates a room and chooses duration, participant limit, and image permissions.
3. SyncChat creates a room ID such as `SYNCCHAT-a1b2c3`.
4. Participants join with the room ID or an invite link.
5. Socket.IO broadcasts messages, participant changes, timers, and session-end events.
6. The session ends when the timer expires or the host closes it.

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm 10 or newer
- MongoDB database connection string
- SMTP credentials for email features
- Cloudinary account for image upload features

### 1. Install Dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Configure Environment Variables

Create `server/.env`:

```env
PORT=4000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_jwt_secret

SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SENDER_EMAIL=your_verified_sender_email

FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Create `client/.env.local`:

```env
VITE_BACKEND_URL=http://localhost:4000
```

### 3. Run Locally

Start the backend:

```bash
cd server
npm start
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Open `http://localhost:5173`.

## Scripts

### Client

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production frontend |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

### Server

| Command | Purpose |
| --- | --- |
| `npm start` | Start the API and Socket.IO server with Nodemon |
| `npm test` | Placeholder script, no automated server tests yet |

## API Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Log in and set auth cookie |
| `POST` | `/api/auth/logout` | Clear auth cookie |
| `POST` | `/api/auth/is-auth` | Check authenticated session |
| `POST` | `/api/auth/send-verify-otp` | Send email verification OTP |
| `POST` | `/api/auth/verify-email` | Verify email with OTP |
| `POST` | `/api/auth/send-reset-otp` | Send password reset OTP |
| `POST` | `/api/auth/reset-password` | Reset password |
| `GET` | `/api/user/data` | Get current user data |
| `POST` | `/api/room/create` | Create a room |
| `GET` | `/api/room/:id` | Get room details |
| `POST` | `/api/room/join` | Join a room by ID |
| `POST` | `/api/room/send-invite/:roomId` | Send an email invite |
| `DELETE` | `/api/room/:id` | Delete or close a room |
| `POST` | `/api/upload/photo` | Upload a chat image |

## Realtime Events

| Event | Direction | Purpose |
| --- | --- | --- |
| `joinRoom` | Client to server | Join a Socket.IO room |
| `leaveRoom` | Client to server | Leave the active room |
| `sendMessage` | Client to server | Send a text or image message |
| `typing:start` | Client to server | Mark the user as actively typing |
| `typing:stop` | Client to server | Clear the user's typing state |
| `messageDelivered` | Client to server | Acknowledge message delivery |
| `messageSeen` | Client to server | Acknowledge that a message was seen |
| `closeSession` | Client to server | Host closes the room |
| `receiveMessage` | Server to client | Broadcast a new message |
| `updateParticipants` | Server to client | Sync participant list |
| `presenceUpdated` | Server to client | Sync online/offline and last-seen state |
| `typing:update` | Server to client | Broadcast active typing users |
| `messageStatusUpdated` | Server to client | Sync sent/delivered/seen state |
| `roomInfo` | Server to client | Send room metadata and upload permissions |
| `sessionTimer` | Server to client | Update remaining session time |
| `sessionEnded` | Server to client | Notify clients that the room is closed |
| `roomFull` | Server to client | Reject joining when the room is full |

## Deployment Notes

- Set `FRONTEND_URL` on the server to the deployed client URL.
- Set `VITE_BACKEND_URL` on the client to the deployed backend URL.
- In production, auth cookies use `secure: true` and `sameSite: "none"`, so both frontend and backend must be served over HTTPS.
- Add the deployed frontend URL to the server CORS allowlist through `FRONTEND_URL`.
- Configure MongoDB, SMTP, and Cloudinary environment variables in the hosting provider dashboard.

## Verification

Useful checks before deploying:

```bash
cd client
npm run lint
npm run build

cd ../server
node --check server.js
```

Current note: the server has a placeholder `npm test` script and does not include automated tests yet.

## Roadmap

- Private direct messages
- Protected socket handshake using verified JWTs
- Refresh tokens and Google OAuth
- Redis Pub/Sub with the Socket.IO Redis adapter for multi-instance scaling
- WebRTC one-to-one audio/video calls
- Drag-and-drop file upload previews and downloads
- Moderator roles and permissions
- Message reactions
- Room transcripts or export
- Redis-backed room state for horizontal scaling
- Automated backend and frontend tests

## Author

Built by Nishmika Ekanayake as a full-stack realtime chatroom project.

## License

This project is currently unlicensed. Add a license before distributing or accepting external contributions.
