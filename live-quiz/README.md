# Cloud Media Live Quiz

Your own Kahoot-style quiz. No player limit, no subscription.

- **Host screen (your laptop on the projector):** `/host`
- **Player page (their phones):** `/` (the QR code opens it with the PIN already filled in)
- **Questions:** `games.json`

The PIN stays the same all day, so people join once in the morning and stay in for all 6 games. If someone leaves to use TikTok, they are back in the game with the same nickname and score as soon as they return to the quiz page.

---

## Part A. Put it online with Render (main plan)

You only do this once. It takes about 10 minutes.

1. Go to **https://render.com** and click **Get Started**. Choose **GitHub** and sign in with the GitHub account that owns `roeybi/kdmr-media`.
2. In Render, click **+ New** (top right), then **Web Service**.
3. Under "Git Provider", find **kdmr-media** and click **Connect**. (If you don't see it, click "Configure account" and give Render access to that repository.)
4. Fill in the form exactly like this:
   - **Name:** `cloudmedia-quiz` (this becomes your web address)
   - **Branch:** `claude/new-session-ock4mv` (or `main` if you have merged the quiz into main)
   - **Root Directory:** `live-quiz`
   - **Runtime / Language:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** **Free**
5. Scroll to **Environment Variables** and click **+ Add Environment Variable**:
   - **Key:** `HOST_PASSWORD`
   - **Value:** a password only you know, for example `gushcloud2026`
6. Click **Deploy Web Service** (or **Create Web Service**). Wait until you see a green **Live** label. The first build takes 2 to 4 minutes.
7. Your address is shown at the top, for example `https://cloudmedia-quiz.onrender.com`.
   - Host screen: `https://cloudmedia-quiz.onrender.com/host` (type your password)
   - Players: they scan the QR code on your host screen

### Important: the free plan goes to sleep

- **Render's free plan puts the server to sleep after 15 minutes with no visitors.** Waking up takes about 1 minute.
- **When it sleeps, the saved scores are wiped.** The free plan has no permanent storage.
- **How to wake it up before class:** 15 minutes before people arrive, open your `/host` address. You may see a loading page for up to a minute. That's normal. Wait until you see the game list.
- **How to keep it awake all day:** leave the host tab open on your laptop the whole day, including over lunch. The host screen checks in with the server every 4 minutes, which keeps it awake. Don't let the laptop go to sleep: plug it in and turn off sleep mode for the day.
- **Don't change anything on GitHub during the workshop.** Every change makes Render restart the server.

---

## Part B. Backup: run it on your laptop (no internet needed)

Use this if the venue internet is bad or Render is down. Phones must be on the **same WiFi** as your laptop.

### One-time setup (do this today)

1. Install **Node.js**: go to https://nodejs.org, click the big **LTS** button, then run the installer and click Next until it finishes.
2. Get the code:
   - On GitHub, open `roeybi/kdmr-media`, switch to the branch `claude/new-session-ock4mv`, click the green **Code** button, then **Download ZIP**.
   - Unzip it. Inside you will find a folder called `live-quiz`.
3. Open a terminal in that folder:
   - **Windows:** open the `live-quiz` folder in File Explorer, click the address bar, type `cmd` and press Enter.
   - **Mac:** open Terminal, type `cd ` (with a space after it), drag the `live-quiz` folder into the Terminal window, and press Enter.
4. Type this and press Enter (you only do this once):
   ```
   npm install
   ```

### Start it

In the same terminal, type:

- **Windows:**
  ```
  set HOST_PASSWORD=yourpassword&& npm start
  ```
- **Mac:**
  ```
  HOST_PASSWORD=yourpassword npm start
  ```

(If you just type `npm start`, the password is `cloudmedia`.)

Then open **http://localhost:3000/host** in Chrome on the laptop.

- The host screen shows your laptop's WiFi address (something like `192.168.1.23:3000`) and a QR code for it. Phones scan that.
- **Windows** may ask "Allow Node.js on networks?". Tick **Private networks** and click **Allow**.
- **Mac** may ask "Accept incoming connections?". Click **Allow**.
- If the address shown looks wrong, the game list screen has a small "Wrong address?" menu where you can pick another one.
- **If phones can't open the address:** some venue and hotel WiFi blocks phones from talking to each other ("guest isolation"). Turn on your phone's **hotspot**, connect the laptop to it, and ask everyone to join that hotspot. (The hotspot works as a local network even without data.)
- To stop the server: click the terminal and press `Ctrl + C`. Scores are saved in `live-quiz/data/state.json`. Start it again and everything comes back.

---

## Running the day

**Host controls** (bottom of the screen):

| Button | What it does |
|---|---|
| **Next** (or Spacebar, or Right arrow) | Moves to the next step: start, reveal, leaderboard, next question |
| **Skip** | Skips this question (no points for anyone) or this task slide |
| **+10 sec** | Adds 10 seconds to the question |
| **+1 min** | Adds a minute to a phone task timer |
| **+ Another pair** | On the Hook A / Hook B vote in Game 3: runs the vote again for the next pair |
| **End game** | Jumps to the podium |
| **Download CSV** | On the podium: every player's answers and points for that game |

At the top: **Games** takes you back to the game list. **Champion** shows the whole-day leaderboard.

On the game list you also have:
- **Reset day totals:** sets everyone's whole-day score to zero. Use it before the real session if you ran a test game.
- **New PIN:** everyone has to join again. Only use this if something has gone badly wrong.
- **CSV:** each game you have already played has a CSV button, so you can download results later.

**Other handy things:**
- The question reveals itself as soon as everyone connected has answered.
- To remove a rude nickname, click it in the lobby.
- If two people try the same nickname, the second one is asked to pick another.
- If you refresh the host page, nothing is lost.
- After Game 6, pressing Next on the podium shows the **Champion of the day**.

## Editing questions

Open `games.json` in any text editor (Notepad or TextEdit is fine). Change the text between the quotes and save. Rules:
- For `quiz`, the `correct` text must be copied exactly from one of the options.
- For `truefalse`, `correct` is `true` or `false` (no quotes).
- For `order`, write the items in the correct order. Phones show them shuffled.
- Quiz answers are shuffled for you. Polls and True/False stay in the order you wrote.

Then restart the server (laptop: `Ctrl + C`, then start it again; Render: saving to GitHub restarts it by itself). If you break the file, the server doesn't start and tells you which game and question is wrong.

## Bot test (for peace of mind)

```
npm run test:bots
```

This simulates 40 players on all 6 games. They answer at random speeds and drop out and rejoin, the host page refreshes, and the server restarts halfway through. It finishes in about 3 minutes and ends with `ALL GOOD`. For 100 players: `BOTS=100 npm run test:bots` on Mac, or `set BOTS=100&& npm run test:bots` on Windows.

---

## Rehearsal checklist for tomorrow morning

**Night before**
- [ ] Render shows **Live**, and `/host` opens with your password
- [ ] Laptop backup works: `npm start`, then open `http://localhost:3000/host`
- [ ] Laptop charger packed; sleep mode turned off for tomorrow

**At the venue, 30 minutes before**
- [ ] Open your Render `/host` address to wake it up. Wait for the game list.
- [ ] Put the host screen on the projector and click **Full screen**
- [ ] Check the PIN and QR code can be read from the back row
- [ ] Join with **your own phone on the venue WiFi**: scan the QR and enter a nickname
- [ ] Join with a second phone (ideally an Android and an iPhone)
- [ ] Start Game 1 and answer the first question on both phones
- [ ] **TikTok test:** on one phone, switch to TikTok for 30 seconds, then come back to the browser. It should show your name and score without asking for the PIN.
- [ ] Refresh the host page once. The game should continue where it was.
- [ ] Press **End game**, go back to **Games**, and click **Reset day totals** so the test scores disappear
- [ ] Keep the host tab open for the rest of the day

**If something goes wrong**
- Phones can't connect to Render: switch to the laptop backup (Part B) and put the new QR code on the projector.
- The laptop backup can't reach phones: use your phone hotspot (see Part B).
- One person is stuck: ask them to refresh the page. If that doesn't help, they rejoin with the **same nickname** and keep their day score.
