# FishNet: demo guide (2 minutes + 2 minutes Q&A)

**One-line pitch:** FishNet is a role-playing game for real networking. Roll a character, meet other players, quest through the network, and take the mask off only when you both choose to.

**Closing line:** "The persona was fictional. The connection is real."

---

## 0. Before you go on (5 minutes)

**Open three browser tabs, in this order**
1. **Demo tab:** https://fishnet-0crx.onrender.com (landing page). You will click **Try the demo**.
2. **Live tab:** https://fishnet-0crx.onrender.com/app/matches, signed in as account A. Check it shows a revealed real name on a match.
3. **Render tab:** the Workflow's **Runs** page, with the succeeded `runNightlyJobs` run visible.
   https://dashboard.render.com/wf/wfl-dbjpu77lk1mc739vtjf0/runs

**Settings**
- Turn **Sound on** (sidebar on desktop, speaker icon on phones). Click it once so the browser allows audio, then test one click.
- Full-screen the browser. Close other tabs and turn off notifications.
- Zoom so text is readable on a projector (100% to 125%).
- Do not reload the demo tab mid-demo. The demo is in memory and resets on reload.

**Know these facts**
- In demo mode, **the first right swipe always matches**. Later matches are deterministic.
- The reveal sequence takes about 6 seconds (drum roll, burst, card). Do not talk over the drum roll.
- Demo introductions answer themselves: the middle person agrees after about 2.5 seconds and the target accepts after about 5.5 seconds.
- Demo replies in chat are simulated and labelled.

---

## 1. The 2-minute run

| Time | Screen | Click | Say |
|---|---|---|---|
| **0:00** | Landing page | (nothing) | "Walking up to a stranger is hard. FishNet is a role-playing game for real networking: start as a character, end with a real connection." |
| **0:12** | Click **Try the demo** | Lands on Encounters. Optional: **Edit persona** in Settings to show Re-roll, only if you have the time. | "You roll a fictional character. Name, company, valuation, always labelled fictional." |
| **0:25** | **Encounters** | Press the **→** arrow once | "Swipe right. A match only forms when you both like each other. That's enforced in the database." Let the match overlay play. |
| **0:40** | Click **View network** | Pick a far target in the dropdown, press **Start quest** | "Your network is the quest map. The route is built only from confirmed connections." |
| **0:55** | Quest panel | **Next step**, then **Ask … to introduce you** | "Every step needs the person before them to vouch for you. That's how you reach anyone." |
| **1:10** | **Matches** | Click the message icon on a card, tap a starter, send | "Masked chat, with icebreakers from your shared interests." |
| **1:25** | Back to **Matches** | **Reveal myself**. Stay quiet during the drum roll. | "When you both choose, the mask comes off." |
| **1:40** | Real-identity card shown | Click **Nice to meet you** | "The persona was fictional..." (pause) |
| **1:45** | **Tab 2: live app** | Show a match with a revealed real name | "That was the simulation. This is the real app: real accounts, a real database, a real reveal." |
| **1:55** | **Tab 3: Render** | Show the succeeded run | "Live on Render: the app is a static site, and a Render Workflow runs our background jobs." |
| **2:00** | Stop | | "...The connection is real." |

**If you are running long, cut in this order:** the chat step first, then Re-roll, then the Render sentence.

---

## 2. The Render sentence (pick one)

- **Short:** "FishNet runs on Render: the app is a static site, and a Render Workflow runs background jobs."
- **Longer:** "The front end is a Render static site that deploys on every push. A Render Workflow runs background jobs, one task per user in parallel with automatic retries, to write personalised suggestions and expire stale introductions."

Show the Runs page while you say it. Keep it accurate: say "background jobs", not "the whole backend". Supabase handles auth and the database.

---

## 3. Q&A answers (2 minutes)

- **Is this real or mocked?** "The first part is a labelled simulation. The second tab is the real app with real accounts." Switch to tab 2.
- **How is real identity protected?** "Database row-level security. Real name, role, bio and LinkedIn only return after both people consent. Either person can hide it again."
- **Where do users come from? What about the empty room?** "Same as any social product: invites and word of mouth. There's an invite button, and party codes so an event or community only meets each other. The persona is what makes people willing to start."
- **How does matching work?** "A transparent score: shared interests count most, then skills that fit someone's interests, then shared goals. No AI, and the same score every time. Similar tags are merged, so 'ML' and 'machine learning' count as the same."
- **Why not just use LinkedIn?** "LinkedIn rewards a polished self. FishNet lets you start as a bold character, so the first move costs less. Your real LinkedIn only appears after a mutual reveal."
- **What's next?** "Party rooms for events, report and block, and better matching."
- **What did you not verify?** Be honest: "Sounds and swiping on a real phone are the parts I haven't been able to test everywhere." Say it plainly, don't hide it.

---

## 4. If something goes wrong

| Problem | Do this |
|---|---|
| The demo tab freezes or resets | Reload `/demo`. It restarts in about 3 seconds. Say "the demo restarts clean". |
| No sound | Say nothing about sound. The animation still works. |
| Live tab shows an error | Skip it and say "the simulation shows the same flow." Don't debug on stage. |
| Match overlay doesn't appear | Press → again. The first like always matches. |
| Reveal doesn't start | Check that the card says "waiting", wait 3 seconds, then continue. |
| You lose your place | Return to Matches and press **Reveal myself**. It is the strongest moment. |

---

## 5. Do not

- Don't claim anything you haven't verified: sound, phone swiping, party filtering live.
- Don't mention features you won't show: tag taxonomy, settings, alerts routing.
- Don't improvise a new feature on stage.
- Don't apologise early. Start on the product.

---

## 6. Submission checklist (by 6:00 PM, aim for 5:30)

- **Project name:** FishNet
- **Team:** solo (add your name)
- **Short description:** FishNet is a role-playing game for real networking. Roll a fictional persona, swipe to meet people, quest through your network to reach anyone, and unmask only when you both choose to.
- **Demo / access:** https://fishnet-0crx.onrender.com, click **Try the demo** (no signup needed)
- **Repo:** https://github.com/Aarav0Maz/FishNet
- **Tracks:** Overall and **Render**
- **Built with:** React, TypeScript, Vite, Tailwind, Motion, React Flow, Supabase, PostgreSQL, Render (static site and Workflows)
- The submission link and required uploads are still unconfirmed. Check them early.

---

## 7. Mindset

Start on the product in the first five seconds. One story, not ten features. Let the drum roll breathe. End on the line.

> The persona was fictional. The connection is real.
