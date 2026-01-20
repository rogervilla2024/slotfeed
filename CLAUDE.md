# SlotFeed Project Memory

## Project Overview
SlotFeed is a streaming analytics platform for slot streamers. It tracks live sessions, statistics, leaderboards, and big wins.

## Tech Stack
- **Frontend:** Next.js (React), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** FastAPI (Python), SQLAlchemy, PostgreSQL
- **Other:** Docker, Nginx, OCR module

## Directory Structure
```
/opt/slotfeed/
├── frontend/          # Next.js frontend
├── backend/           # FastAPI backend
├── database/          # Database configs
├── deploy/            # Deployment configs
├── docker/            # Docker files
├── nginx/             # Nginx config
├── ocr/               # OCR module
├── scripts/           # Utility scripts
├── data/              # Data files (leaderboard.json, etc.)
└── docker-compose.yml
```

## Key Files

### Frontend
- `frontend/src/app/leaderboard/page.tsx` - Leaderboard page
- `frontend/src/app/streamers/page.tsx` - Streamers list page
- `frontend/src/app/streamer/[username]/page.tsx` - Streamer profile page
- `frontend/src/components/streamer/streamer-header.tsx` - Streamer header component
- `frontend/src/types/index.ts` - TypeScript type definitions

### Backend
- `backend/app/api/v1/streamers.py` - Streamers API endpoints
- `backend/app/scripts/seed_database.py` - Database seeder
- `backend/app/models/` - SQLAlchemy models

## Important Notes

### Streamer Data
- Streamers are seeded via `backend/app/scripts/seed_database.py`
- 18 streamers in seed: Roshtein, Trainwreckstv, ClassyBeef, Xposed, DeuceAce, Mellstroy, Ayezee, Bidule, VonDice, CasinoDaddy, SlotBox, Chipmonkz, MrLowRoller, FruitySlots, SpinTwix, Jarttu84, NickSlots, Prodigy
- Username format: lowercase (e.g., "deuceace" not "deucace")

### Platform URLs
- API returns `socialLinks` object with actual platform URLs (kick, twitch, youtube, twitter, discord)
- Frontend should use `socialLinks` first, fallback to constructing URL from username
- Pattern: `https://kick.com/{username}`, `https://twitch.tv/{username}`, `https://youtube.com/@{username}`

### Streamer Type (TypeScript)
```typescript
interface StreamerSocialLinks {
  kick?: string;
  twitch?: string;
  youtube?: string;
  twitter?: string;
  discord?: string;
}

interface Streamer {
  id: string;
  username: string;
  displayName: string;
  platform: 'kick' | 'twitch' | 'youtube';
  platformId: string;
  avatarUrl?: string;
  bio?: string;
  followerCount: number;
  isLive: boolean;
  lifetimeStats: StreamerLifetimeStats;
  socialLinks?: StreamerSocialLinks;
  createdAt: Date;
  updatedAt: Date;
}
```

## Recent Changes (2026-01-20)

### Leaderboard Page Fix
- Fixed invalid HTML: `<Link>` was wrapping `<tr>` causing layout issues
- Changed to use `onClick` with `useRouter` for table rows
- Improved table styling with better headers, borders, and responsive tabs

### Streamer 404 Fixes
- Added 13 new streamers to seed script
- Fixed typo: "deucace" → "deuceace"

### Platform URL Fixes
- Updated `Streamer` type to include `socialLinks`
- Modified `streamer-header.tsx` to use `socialLinks` from API
- Fixed hardcoded URLs in:
  - `streamer/[username]/page.tsx`
  - `streamer/[username]/sessions/[sessionId]/page.tsx`
  - `session-detail-content.tsx`

### Slots Page Fix
- Fixed `setIsLoading(false)` not being called when API returns data
- Page was stuck in infinite loading state
- File: `frontend/src/app/slots/page.tsx`

## Claude Code Agents

### backend-architect
**Location:** `.claude/agents/backend-architect.md`
**Model:** Sonnet
**Use for:** RESTful APIs, microservice boundaries, database schemas, scalability planning, performance optimization

**Focus Areas:**
- RESTful API design (versioning, error handling)
- Service boundary definition
- Database schema design (normalization, indexes, sharding)
- Caching strategies
- Security patterns (auth, rate limiting)

**Output Format:**
- API endpoint definitions with example requests/responses
- Service architecture diagrams (mermaid/ASCII)
- Database schema with relationships
- Technology recommendations
- Bottlenecks and scaling considerations

## Commands

### Seed Database
```bash
cd /opt/slotfeed/backend
python -m app.scripts.seed_database
```

### Run Frontend Dev
```bash
cd /opt/slotfeed/frontend
npm run dev
```

### Run Backend Dev
```bash
cd /opt/slotfeed/backend
uvicorn app.main:app --reload
```

### Install Claude Code Templates
```bash
npx claude-code-templates@latest --agent=development-team/backend-architect --yes
```
