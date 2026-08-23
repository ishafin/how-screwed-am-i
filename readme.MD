# How Screwed Am I? 💀

A funny little quiz that calculates a "Screwed Score™" (0–100) based on your sleep,
screen time, pending work, deadlines, money, and procrastination habits.

Built with plain HTML, CSS, and JavaScript — no frameworks, no build step.

## Live Demo

(https://how-screwed-am-i-gray.vercel.app/)

## How It Works

1. **Landing screen** — click "Calculate My Damage" to start.
2. **Quiz** — answer 12 questions, one at a time (6 number inputs, 6 multiple choice).
3. **Result** — see your Screwed Score, a funny category (from 🟢 Touching Grass to
   ☠️ It's Actually Over), a personalized roast, and a breakdown of which category
   hurt you the most.
4. Hit "Try Again" to restart.

## Scoring, in short

Each answer is converted into a 0–100 "danger score." Those are combined into 7
categories (Sleep, Screen Time, Pending Work, Deadline Pressure, Productivity,
Procrastination, Money), each with its own weight. The weighted sum is your final
Screwed Score, always between 0 and 100.

The full formulas and weights are documented as comments inside `script.js`.

This score is for entertainment purposes only. It is not a real measure of
anything, please don't take it seriously.

## Project Structure

```text
how-screwed-am-i/
│
├── index.html    → page structure (landing, quiz, result screens)
├── style.css     → all styling and animations
├── script.js     → quiz logic, scoring engine, result rendering
```

## Running Locally

No build tools needed. Just open `index.html` in a browser.


## Tech Stack

- HTML
- CSS (vanilla, no frameworks)
- JavaScript (vanilla, no frameworks)