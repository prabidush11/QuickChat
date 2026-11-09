# QuickChat — Backend

REST API and real-time server for QuickChat, built with Express 5, MongoDB (Mongoose), Socket.io, JWT and Cloudinary.

## Setup

```bash
cd server
npm install
npm run dev      # nodemon, development
npm start        # node, production
```

Create `server/.env`:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string (the `chat-app` database is appended) |
| `PORT` | Server port (default `5000`) |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `FRONTEND_URL` | Allowed CORS origin, no trailing slash (default `http://localhost:5173`) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image uploads |

## Structure

```
server/
├── server.js          # Entry point: HTTP server, Socket.io, DB connection, listen
└── src/
    ├── app.js         # Express app: middleware, routes, error handler
    ├── controllers/   # Request handlers (users, messages)
    ├── lib/           # db, cloudinary, socket, utils
    ├── middleware/    # protectRoute (JWT auth)
    ├── models/        # User, Message
    └── routes/        # /api/auth, /api/messages
```

## API

Protected routes (🔒) need the header `Authorization: Bearer <token>`.

**Auth: `/api/auth`**

| Method | Route | Description |
|---|---|---|
| POST | `/signup` | Create an account (`fullName`, `email`, `password`, `bio`) and get a token |
| POST | `/login` | Log in (`email`, `password`) and get a token |
| GET | `/check` 🔒 | Get the current user |
| PUT | `/update-profile` 🔒 | Update `fullName`, `bio` and `profilePic` (base64, uploaded to Cloudinary) |

**Messages: `/api/messages`**

| Method | Route | Description |
|---|---|---|
| GET | `/users` 🔒 | All other users, plus unseen-message counts |
| GET | `/:id` 🔒 | Conversation with user `:id`, oldest first; marks their messages as seen |
| POST | `/send/:id` 🔒 | Send `text` and/or `image` (base64) to user `:id` |
| PUT | `/mark/:id` 🔒 | Mark message `:id` as seen |
| PUT | `/edit/:id` 🔒 | Edit your own text message (sets `edited: true`) |
| DELETE | `/:id` 🔒 | Delete your own message |

`GET /api/status` is a health check.

## Real-time events (Socket.io)

Clients connect with `query: { userId }`.

| Event | Sent when |
|---|---|
| `getOnlineUsers` | A user connects or disconnects; sends the array of online user ids to everyone |
| `newMessage` | The receiver gets a new message |
| `messageEdited` | The receiver gets the updated message |
| `messageDeleted` | The receiver gets `{ messageId }` |

## Limitations

- **Socket identity isn't verified.** `userId` is read from the connection query and never checked against the JWT, so a client can claim to be any user.
- **Online status is in memory.** It resets when the server restarts, allows one socket per user (closing one of two tabs shows the user as offline), and has no "last seen".
- **No sockets on Vercel.** Serverless functions can't keep WebSocket connections open, so real-time features need a long-running host (Render, Railway, a VPS).
- **One CORS origin.** `FRONTEND_URL` takes a single URL, so local and production frontends can't both be allowed without a code change.
- **Token in localStorage.** The token is sent in the `Authorization` header, not an httpOnly cookie, so it can be stolen through XSS. Tokens expire after 1 day and can't be revoked, and there's no refresh token.
- **No pagination.** A conversation loads all of its messages at once.
- **No input validation or rate limiting.** There are no email or password rules and no brute-force protection on login. Images are only limited by the 4 MB JSON body size.
- **Deletes are permanent.** Deleted messages are removed from the database, and their images stay in Cloudinary.
- **Only one-to-one chats.** There are no groups, friend requests or blocking, and every user can message every other user.
- **No tests.**
