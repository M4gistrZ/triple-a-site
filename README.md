# Triple-A Site

Internal organization portal for a small gaming community (~15 members). Features project management, social feed, image gallery, member profiles, and a real-time messenger.

## Stack

| Layer        | Technology                          |
|-------------|-------------------------------------|
| Framework   | Next.js 15 (App Router)             |
| Language    | TypeScript                          |
| Styling     | Tailwind CSS v4                     |
| Database    | PostgreSQL (hosted on Neon)         |
| ORM         | Prisma                              |
| Auth        | JWT in httpOnly cookie + bcrypt     |
| Real-time   | Server-Sent Events (SSE)            |
| File upload | Cloudinary                          |
| Hosting     | Render                              |
| Icons       | Lucide React                        |

## Features

### Authentication
- Registration and login with hashed passwords (bcrypt)
- JWT stored in httpOnly cookie, 7-day expiration
- All API routes protected by session check
- Password length and format validation

### Dashboard
- Recent projects grid with cover images
- Activity feed tracking all user actions
- Quick navigation to all sections

### Projects
- Full CRUD (create, read, update, delete)
- Status tracking: Planning, In Progress, Completed, Paused
- Cover image and multi-image gallery per project
- Fallback: if no cover set, first gallery image is used
- Filter by status

### Posts
- Create posts with up to 5000 characters
- Emoji reactions (toggle by clicking)
- Nested comments (1000 char limit)
- Character counter on inputs

### Gallery
- Global masonry grid of all images from all projects
- Click-to-expand fullscreen viewer with zoom and drag

### Members
- List of all registered users with registration dates

### Profiles
- Editable bio (1000 char limit)
- Avatar upload (circular display) and skin image
- View all posts by a specific user

### Messenger
- Personal 1-on-1 and group conversations
- Real-time updates via SSE (no WebSocket overhead)
- Image messages via URL
- Unread message indicators
- Collapsible chat list sidebar
- Auto-reconnect on connection loss
- Typing timestamps and message ordering

### Image Upload
- Upload from PC (stored on Cloudinary CDN)
- Paste direct image URL
- 5 MB file size limit
- Used in: profiles, projects, messenger

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL database (local or cloud — Neon recommended)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/M4gistrZ/triple-a-site.git
cd triple-a-site
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your values (see below)

# 3. Push database schema
npx prisma generate
npx prisma db push

# 4. Start dev server
npm run dev
```

Server runs at `http://localhost:3000` with Turbopack for fast rebuilds.

### Environment Variables

```env
DATABASE_URL="postgresql://..."       # Your PostgreSQL connection string
JWT_SECRET="your-random-secret-key"   # Used for signing JWT tokens
ADMIN_PASSWORD="your-admin-password"  # Password to get admin rights (set this!)
CLOUDINARY_CLOUD_NAME="..."           # From Cloudinary dashboard
CLOUDINARY_API_KEY="..."              # From Cloudinary dashboard
CLOUDINARY_API_SECRET="..."           # From Cloudinary dashboard
```

### Available Scripts

| Command             | Description                              |
|---------------------|------------------------------------------|
| `npm run dev`       | Start dev server with Turbopack          |
| `npm run build`     | Production build                         |
| `npm run start`     | Start production server                  |
| `npm run lint`      | Run ESLint                               |
| `npm run db:push`   | Sync schema to database                  |
| `npm run db:studio` | Open Prisma Studio (visual DB browser)   |
| `npm run db:generate` | Regenerate Prisma Client              |

## Project Structure

```
├── prisma/
│   └── schema.prisma          # Database models (User, Project, Post, Message...)
├── public/
│   └── uploads/               # (local dev only — not used in production)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx # Login / Registration page
│   │   ├── api/
│   │   │   ├── auth/          # login, register, logout, me
│   │   │   ├── projects/      # CRUD for projects
│   │   │   ├── posts/         # Posts, comments, reactions
│   │   │   ├── conversations/ # Messenger conversations
│   │   │   ├── messages/stream # SSE endpoint for real-time updates
│   │   │   ├── profile/       # User profile data
│   │   │   ├── upload/        # Cloudinary file upload
│   │   │   ├── users/         # List all users
│   │   │   ├── activity/      # Activity feed
│   │   │   ├── comments/      # Comment deletion
│   │   │   └── gallery/       # Aggregated images from all projects
│   │   ├── dashboard/         # Main page
│   │   ├── projects/          # Projects list + detail + create
│   │   ├── posts/             # Social feed
│   │   ├── gallery/           # Global image gallery
│   │   ├── members/           # User list
│   │   ├── messenger/         # Real-time messenger
│   │   ├── profile/[id]/      # User profile page
│   │   └── settings/          # User settings
│   ├── components/
│   │   ├── AuthProvider.tsx   # Client-side auth context
│   │   ├── ClientLayout.tsx   # App shell (sidebar + main content)
│   │   ├── FileUpload.tsx     # File upload / URL input component
│   │   ├── ImageViewer.tsx    # Fullscreen image viewer with zoom/pan
│   │   ├── Sidebar.tsx        # Collapsible navigation sidebar
│   │   └── SidebarProvider.tsx# Sidebar state management
│   └── lib/
│       ├── auth.ts            # JWT creation, session management, bcrypt
│       ├── chatEvents.ts      # In-memory event emitter for SSE
│       ├── db.ts              # Prisma singleton (prevents multiple connections)
│       └── cache.ts           # Simple in-memory caching
├── .env                       # Environment variables (not committed)
├── package.json
└── next.config.ts
```

## Database Schema

Core models:

- **User** — authentication, nickname, role
- **Profile** — bio, avatar, skin image (1:1 with User)
- **Project** — title, description, status, cover image, image gallery
- **Post** — user-created posts with content
- **Comment** — comments on posts
- **Reaction** — emoji reactions on posts (unique per user/post/emoji)
- **Activity** — global activity log
- **Conversation** — personal or group chats
- **ConversationParticipant** — chat membership, last-read tracking
- **Message** — text/image messages with timestamps

## Real-Time Architecture

The messenger uses Server-Sent Events (SSE) instead of WebSockets:

1. Client opens a persistent GET connection to `/api/messages/stream`
2. Server keeps the connection alive with periodic keepalive pings
3. When a message is sent, `emit()` is called in `chatEvents.ts`
4. The SSE stream pushes the event to all connected clients
5. Client automatically reconnects after 3 seconds if the connection drops

This approach is lightweight (HTTP/1.1), doesn't require WebSocket support on the server, and works well with serverless deployments.

## Deployment

### Render (production)

1. Push code to GitHub
2. Create a PostgreSQL database on Render (free tier)
3. Create a Web Service connected to the repo:
   - **Build Command:** `npm install && npx prisma generate && npx prisma db push --accept-data-loss && npm run build`
   - **Start Command:** `npm start`
4. Add environment variables in Render dashboard:
   - `DATABASE_URL` — from Render PostgreSQL
   - `JWT_SECRET` — cryptographically random string
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — from Cloudinary

### Cloudinary (file storage)

Files are uploaded to Cloudinary CDN, not stored on the server. This is required because Render (and all serverless platforms) have ephemeral filesystems.

Free tier: 25 GB storage, 25 GB bandwidth/month — enough for a small community.

## Design System

| Token          | Value         | Usage                          |
|---------------|---------------|--------------------------------|
| Background     | `bg-white`    | Primary surfaces               |
| Secondary BG   | `bg-stone-50` | Cards, sidebar, inputs         |
| Border         | `border-stone-200` | Dividers, input borders   |
| Text           | `text-stone-700` | Body text                    |
| Muted text     | `text-stone-400` | Placeholders, timestamps    |
| Accent pink    | `text-pink-600` / `bg-pink-600` | Links, active states |
| Accent green   | `bg-green-600` | Primary buttons, success     |
| Gradient overlay | `from-black/80 via-black/30 to-transparent` | Project covers only |

No gradients except project cover overlays. No emojis in UI (except post reactions). Clean, minimal, nature-themed.

## Security Notes

- Passwords hashed with bcrypt (salt rounds: 12)
- JWT tokens in httpOnly, sameSite=lax cookies
- All API routes check session before processing
- Input limits enforced: posts 5000 chars, comments 1000, bio 1000
- File upload size limited to 5 MB
- CSRF protection via sameSite cookie + httpOnly
- Cloudinary API secrets never exposed to client
