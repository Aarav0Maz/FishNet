# Submission answers (paste into the form)

**Project name**
FishNet

**Team members**
Aarav Mazumder (solo)

**One-line description**
A role-playing game for real networking: roll a fictional character, meet other players, quest through the network to reach anyone, and take the mask off only when you both choose to.

**Short description (about 80 words)**
Networking rewards a polished self, and most people never make the first move. FishNet makes the first move cheap. You roll an absurd fictional persona, swipe to meet other characters, and match only when both of you say yes. Your network is a quest map: pick anyone and walk the shortest route through confirmed connections, asking each stop to introduce the next. Chat behind the mask with icebreakers from your shared interests. When you both choose, the mask comes off. The persona was fictional. The connection is real.

**How it fits the theme ("create a product to help you LARP as someone you are not")**
The persona is the product. You play a character, everyone else plays one too, and real identity is an unlock you earn by mutual consent, not something you hand over up front.

**Demo / access instructions**
1. Open https://fishnet-0crx.onrender.com and click **Try the demo** (no signup, a clearly labelled simulation with 24 fictional people).
2. Press the right arrow on the first card (the first like always matches in demo mode).
3. Open **Network**, pick a far target, and press **Start quest**.
4. Open **Matches**, press **Reveal myself**, and turn **Sound on** for the drum roll.
The real app (real accounts, real database) is behind **Join FishNet**.

**Live URL**
https://fishnet-0crx.onrender.com

**Code repository**
https://github.com/Aarav0Maz/FishNet

**Prize track(s)**
Overall, and Render.

**Render track: how it uses Render**
The app is a Render static site that deploys from GitHub on every push. A Render Workflow service (`fishnet-jobs`) runs background jobs: one task per user in parallel with automatic retries, to write personalised suggestion alerts and expire introduction requests nobody answered. The Workflow has six tasks, including a parallel load test of the matching engine (100 tasks scoring about 50 million synthetic candidate pairs, about $0.0002). Supabase provides auth and the database.

**Built with**
React, TypeScript, Vite, Tailwind CSS, Motion, React Flow, Supabase (Auth, Postgres, Row Level Security, Realtime), Render (Static Site and Workflows), WebAudio.

**What is verified, and what is not (say this if asked)**
Verified live with real accounts: sign up and log in, mutual match, network route, introductions, reveal, and chat. Built but not fully verified: party-code filtering with two accounts, sound on every device, and touch swiping on a real phone.

**What's next**
Party rooms for events and communities, report and block, and smarter matching.
