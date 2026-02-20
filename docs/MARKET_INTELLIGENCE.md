# Market Intelligence

**Project:** Imajin LED Platform
**Status:** Living document — expand as data sources and pipelines are added
**Companion:** [MARKETING_STRATEGY.md](./MARKETING_STRATEGY.md)
**Last Updated:** 2026-02-19

---

## Purpose

A taxonomy of warm lead signals — observable behaviors that indicate purchase intent across B2B and B2C buyer types. Used to identify, prioritize, and route prospects before outreach begins.

This is not a one-time research snapshot. It is an operational framework for ongoing market intelligence: what signals to watch, where to find them, and how to act on them.

---

## Signal Categories

### 1. Competitor Frustration Signals

People actively expressing dissatisfaction with existing products are high-intent — they've already bought into the category and are unhappy.

**What to look for:**
- Reviews or posts complaining about Govee, Nanoleaf, Philips Hue, LIFX (connectivity drops, subscription walls, cheap build quality, limited customization)
- Reddit threads: "alternatives to X", "Govee keeps disconnecting", "Nanoleaf is overpriced"
- Amazon 1–3 star reviews on competitor products — especially mentions of "wanted something more permanent" or "professional"
- Posts about returning LED products and why

**Where to find it:** Reddit, Amazon reviews, YouTube comment sections, Best Buy reviews
**Intent level:** Very High
**Lead type:** B2C and B2B

---

### 2. B2B Trigger Events

Business lifecycle moments where lighting decisions are actively being made.

**What to look for:**
- **New venue openings** — restaurant/bar/hotel announced before doors open (fit-out phase = active purchasing window)
- **Renovations and rebrands** — "we're getting a new look" posts, or commercial building permits (public record in many jurisdictions)
- **Job postings** — a venue hiring an interior designer or lighting technician signals an upcoming project with budget allocated
- **New business registrations** — public registry data filtered by hospitality/retail SIC codes in target cities
- **Franchise expansion announcements** — chains opening new locations need consistent lighting across sites

**Where to find it:** LinkedIn, local press, job boards (Indeed, LinkedIn Jobs), municipal permit databases, company announcement pages
**Intent level:** High
**Lead type:** B2B

---

### 3. Negative Vibe / Indirect Demand Signals

Venue-goers expressing that lighting degraded or could elevate an experience. The venue is the lead, not the commenter.

**What to look for:**
- "The lighting at [venue] gave me a headache"
- "This place would be perfect if they fixed the lighting"
- Hotel reviews mentioning "dated lighting" or "fluorescent overhead"
- Airbnb/VRBO hosts asking for advice on making spaces more photogenic
- Real estate staging posts mentioning lighting as a problem

**Where to find it:** Google Maps reviews, Yelp, TripAdvisor, Reddit local subreddits, Instagram comments
**Intent level:** Medium (venue is a cold lead, needs qualification)
**Lead type:** B2B

---

### 4. Maker / DIY Community Signals

People already in the LED ecosystem — technically capable, self-directed, likely to buy or recommend.

**What to look for:**
- WLED project posts (they're in the ecosystem, potentially ready for polished hardware)
- GitHub stars and forks on LED-related repos (WLED, FastLED, WLED-wemos-shield)
- Hackaday and Instructables submissions involving LED matrices or cubes
- Reddit posts asking for upgrade recommendations in r/WLED, r/led, r/homeautomation, r/smarthome
- "Show us your setup" threads in r/battlestations, r/malelivingspace, r/femalelivingspace

**Where to find it:** GitHub API, Reddit API, Hackaday, Instructables
**Intent level:** High
**Lead type:** B2C / Maker

---

### 5. Art and Exhibition Signals

Artists and curators in the market for installation-grade hardware.

**What to look for:**
- Artists posting about upcoming shows or calling for installation proposals
- Gallery accounts announcing new exhibitions — especially immersive or experiential
- Festival production calls (Burning Man, Nuit Blanche, Vivid Sydney, Lux Helsinki) — artists applying need hardware
- Art school graduation show announcements — students need affordable professional-grade gear
- Spike activity on #lightart, #interactiveart, #installationart

**Where to find it:** Instagram, Facebook events, festival websites, art school event pages, Eventbrite
**Intent level:** Medium–High
**Lead type:** B2B / B2C

---

### 6. Commercial Installer / Trade Signals

Professionals who specify or install lighting for clients — a multiplier lead type.

**What to look for:**
- Interior designers posting mood boards that include architectural or ambient lighting
- Lighting designers on LinkedIn announcing new projects or portfolio work
- AV integrators discussing smart home or commercial installs (CEDIA forums, r/hometheater)
- Architects posting renders with dramatic lighting — they specify products for clients
- Stage and event production companies posting pre-event rig setup photos

**Where to find it:** LinkedIn, Instagram, CEDIA community forums, Houzz, Behance
**Intent level:** High (long sales cycle but repeat buyer potential)
**Lead type:** B2B Trade

---

### 7. Aspirational / Early Funnel Signals

People in the research or inspiration phase — not ready to buy, but signaling category interest.

**What to look for:**
- Saving or reposting LED installation content repeatedly
- Pinterest boards titled "dream home lighting", "restaurant interior", "studio setup"
- "How do they do this?" comments on installation videos
- Following both interior design accounts AND maker/tech accounts — dual-interest crossover is a strong qualifier

**Where to find it:** Pinterest API, Instagram saves/reposts (limited API access), YouTube comments
**Intent level:** Low–Medium (TOFU, needs nurture)
**Lead type:** B2C

---

### 8. Event and Seasonal Timing Signals

Purchasing windows tied to events, seasons, or production cycles.

**What to look for:**
- Nightclub/venue booking posts for NYE, Halloween, holiday season — they're planning experiences
- Pop-up shop announcements — short-term retail needs fast, impactful lighting
- Trade show exhibitors posting about upcoming booth builds
- Wedding planners posting about 2026/2027 seasons — ambient lighting is a decision point
- Festival production timelines (Burning Man art project applications open in November)

**Where to find it:** Instagram, LinkedIn, Eventbrite, festival websites, wedding planning communities
**Intent level:** Medium–High (time-sensitive purchasing window)
**Lead type:** B2B

---

### 9. Community Status Signals

High-influence individuals whose public engagement drives purchase decisions in their communities.

**What to look for:**
- People featured in "setups" content (Battlestation, cozy home, studio) with significant engagement — influencers in disguise
- Kickstarter/Indiegogo backers of similar hardware projects — demonstrated willingness to pay early for innovative hardware
- WLED Discord/forum active members posting about wanting "something more finished" or professional-grade
- YouTube creators building LED projects with significant view counts

**Where to find it:** Kickstarter backer lists (public), Reddit top posts, YouTube, Discord servers
**Intent level:** High (they validate and amplify for others)
**Lead type:** B2C / Influencer

---

## Lead Quality Reference

| Signal Type | Intent Level | Lead Type | Programmatic Access |
|---|---|---|---|
| Competitor frustration (reviews, Reddit) | Very High | Both | High |
| "Where can I get this?" comments | Very High | B2C | Low (manual/social listening) |
| Job postings (lighting/interior design) | High | B2B | High (job board APIs) |
| New venue opening / renovation | High | B2B | Medium (LinkedIn, local press) |
| WLED / GitHub community members | High | B2C / Maker | High |
| Commercial installer posting projects | High | B2B Trade | Medium |
| Artist exhibition announcements | Medium–High | B2B | Medium |
| Event / seasonal timing signals | Medium–High | B2B | Medium |
| Kickstarter backers of LED projects | High | B2C | Low |
| Negative venue reviews (Google Maps) | Medium | B2B | High |
| Aspirational / dual-interest crossover | Low–Medium | B2C | Low |

---

## Underutilized Signals Worth Prioritizing

**Job posting monitoring** — a venue actively hiring an interior designer or lighting technician is a named, warm B2B lead with budget already allocated. Job board APIs (Indeed, LinkedIn) are accessible and consistent.

**GitHub stars on WLED / FastLED repos** — technical buyers who self-install and understand architecture. High conversion likelihood for DIY Kit tier. GitHub API is open and easy to query.

**Google Maps / Yelp reviews mentioning lighting** — reviews are accessible programmatically and name the venue directly. A restaurant with multiple reviews mentioning "bad lighting" or "dark ambience" is a cold-to-warm B2B lead with a specific, solvable problem.

---

## Data Sources and MCP Options

### MCP Servers — External Signal Discovery

Servers selected for monitoring public content and external signals — not managing your own accounts. Each server targets a different platform and access pattern: browser-session scrapers (no API key, ToS-gray, throwaway account recommended), official free APIs (stable, rate-limited), and paid aggregators (cross-platform, compliant, production-ready). Test in the sequence below before building any production pipeline. Owned account management servers are documented separately in [MARKETING_STRATEGY.md](./MARKETING_STRATEGY.md).

| Server | Platform | What It Accesses | API Cost | Test Priority |
|---|---|---|---|---|
| `instagram-server-next-mcp` (duhlink) | Instagram | Public posts via Chrome browser session — hashtag search, post metadata, comments. No API key needed. | Free | **1st — throwaway account** |
| `tiktok-mcp` (yap-audio) | TikTok | Video discovery and metadata extraction from public data. No API key needed. | Free | **2nd — throwaway account** |
| `reddit-mcp` (GridfireAI) / `mcp-reddit` (adhikasp) | Reddit | Browse, search subreddits, read posts and comments. Keyword search across communities. | Free (non-commercial) | 3rd |
| `py-mcp-youtube-toolbox` (jikime) | YouTube | Video search, transcript extraction, comment retrieval, trending discovery. | Freemium (10K free units/day) | 4th |
| `mcp-server-reddit` (Hawstein) | Reddit | Subreddit info, frontpage browsing, comment threads via redditwarp. Alternative to above. | Free | 3rd (fallback) |
| `xpoz` (net-service) | Instagram, TikTok, X | 1.5B+ posts indexed. Cross-platform keyword search including public Instagram/TikTok content. | **Paid** | Scale-up path after testing |

**Instagram note:** `instagram-server-next-mcp` uses Chrome's existing login session to access public content — no Meta Graph API required. Test against a throwaway account first to validate data depth and rate limit tolerance before risking a primary account.

**TikTok note:** `tiktok-mcp` (yap-audio) accesses TikTok public data without an API key. TikTok's public web interface has historically been more permissive than Instagram's — likely more stable for programmatic access. Key unknown: whether it surfaces comments or only video-level metadata.

---

### Non-MCP Data Sources

Platforms and data providers where no MCP server exists but data is still accessible via direct API or manual methods. Many are high-value for specific signal types — Google Maps reviews for named B2B venue leads, GitHub for maker community signals, job boards for B2B trigger events. Access requires API key registration and direct integration rather than MCP tooling; these are candidates for custom pipeline work in later phases.

| Source | Signals Served | Access Method | Cost | Status |
|---|---|---|---|---|
| Google Maps / Places API | Negative vibe signals, venue leads | Google Places API v1 (Google Cloud) | Free tier; $0.017/request beyond | Planned |
| Yelp Fusion API | Negative vibe signals, venue reviews | Yelp Fusion API | Free (500 calls/day) | Planned |
| GitHub REST API | Maker community — WLED/FastLED stargazers, forkers | GitHub REST API — no auth needed for public data | Free | Planned |
| Indeed Publisher API | B2B trigger events — job postings | Indeed Publisher API registration (free) | Free | Planned |
| LinkedIn Jobs | B2B trigger events — job postings | LinkedIn API (heavily restricted) or manual | Restricted / Manual | Research needed |
| Municipal permit databases | B2B trigger events — renovations, new builds | Varies by city/province — some public REST APIs | Varies | Research needed |
| Hackaday / Instructables | Maker community projects | RSS feeds + scraping | Free | Planned |
| TripAdvisor | Negative vibe signals | No official public API — scraping only | Free (fragile) | Low priority |
| Kickstarter | Community status signals, backer lists | Manual (backer lists are public) | Free | Manual |
| Eventbrite | Event/seasonal timing signals | Eventbrite API (free tier available) | Free tier | Planned |

---

### Signal → Source Coverage Map

Cross-reference of all 9 signal categories against their best data sources. Use the MCP Available column to identify where intelligence can be collected programmatically today versus where manual research or a paid tool is required. The Gap column flags constraints that a future paid aggregator (xpoz/SocialAPIs) or social listening SaaS would address — use it to prioritise what to solve next as the pipeline matures.

| Signal Category | Best Sources | MCP Available | Gap |
|---|---|---|---|
| Competitor frustration | Reddit, YouTube comments, Amazon reviews | ✅ Reddit MCP, YouTube MCP | Amazon reviews — no MCP |
| B2B trigger events | Indeed, LinkedIn Jobs, permit DBs, local press | ⚠️ Partial — job boards; rest manual | LinkedIn restricted; permit DBs fragmented |
| Negative vibe / venue complaints | Google Maps, Yelp, Reddit local subs | ✅ Reddit MCP; ⚠️ Google/Yelp via API (not MCP) | No MCP for Google Maps or Yelp |
| Maker / DIY community | Reddit (r/WLED, r/led), GitHub, Hackaday | ✅ Reddit MCP; GitHub API (no MCP needed) | Hackaday/Instructables — RSS only |
| Art and exhibition | Instagram, TikTok, Facebook Events | ✅ Instagram MCP (throwaway), TikTok MCP (throwaway) | Eventbrite — API but no MCP |
| Commercial installer / trade | Instagram, LinkedIn, Houzz | ✅ Instagram MCP; LinkedIn manual | LinkedIn heavily restricted |
| Aspirational / early funnel | YouTube, Reddit, Instagram, TikTok | ✅ All have MCP options | Pinterest — no MCP |
| Event / seasonal timing | Instagram, TikTok, Eventbrite | ✅ Instagram/TikTok MCP | Eventbrite — API but no MCP |
| Community status | Reddit, YouTube, GitHub, Kickstarter | ✅ Reddit MCP, YouTube MCP, GitHub API | Kickstarter manual only |

---

### Test Sequence

Ordered validation plan — run each source in sequence before building a production pipeline around it. The goal of each test is to confirm: Is the data accessible? Is it structured enough to qualify leads? What are the rate limits and failure modes? Start with the cheapest and most accessible sources; reserve paid or complex integrations for after signal quality is confirmed.

| # | Source | Server / Method | Approach | What to Validate |
|---|---|---|---|---|
| 1 | Instagram | `instagram-server-next-mcp` | Throwaway account, Chrome session | Hashtag search viability, comment access, rate limit tolerance |
| 2 | TikTok | `tiktok-mcp` (yap-audio) | Throwaway account | Video discovery depth, comment access, metadata quality |
| 3 | Reddit | `reddit-mcp` (GridfireAI) | Register free API app at reddit.com/prefs/apps | Keyword search across subreddits, comment threading, signal density |
| 4 | YouTube | `py-mcp-youtube-toolbox` | Google Cloud project (free quota) | Comment retrieval on relevant videos, hashtag/keyword search |
| 5 | Google Maps | Places API v1 | Google Cloud project | Review keyword filtering, venue name extraction for B2B leads |
| 6 | GitHub | GitHub REST API | No auth required for public data | WLED/FastLED stargazers — user profiles, activity signals |
| 7 | Job boards | Indeed Publisher API | Free app registration at developer.indeed.com | Interior designer / lighting tech postings in target cities |

---

## Related Documents

- [MARKETING_STRATEGY.md](./MARKETING_STRATEGY.md) — Full channel strategy and ranked marketing channels
- [PITCH_FRAMEWORK.md](../../imajin-os/docs/governance/PITCH_FRAMEWORK.md) — Market sizing and GTM phases
