# EXPLAIN - AI-Powered Word Game

EXPLAIN is a unique word game where players challenge an AI to guess a secret word using concise, strategic clues. The game incorporates elements of AI reasoning, deductive logic, and efficient communication.

## Game Overview

In EXPLAIN, your goal is to provide the AI with clues that guide it to guess the **Challenge Word**. The game rewards players who use the fewest characters possible while making effective clues.

### Game Modes
- **Daily Challenge**: A new word every day, with **only 5 attempts** to win.
- **Shuffle Mode**: Play unlimited random puzzles for practice.
- **Custom Mode**: Challenge the AI with a word of your choosing.
- **Archive Mode**: Replay past daily challenges to improve your score.

### Key Metrics
- **Confidence Score**: AI’s certainty in its guess (0%-100%).
- **Search Space**: Number of possible words AI is considering.
- **Attempts Remaining**: Limited to 5 in Daily Challenge mode.
- **Character Usage**: Shorter clues result in better scores.

---

## Project Structure

This repository contains both the **frontend (game UI)** and **backend (AWS Lambda functions for leaderboard, scoring, and AI logic).**

### Frontend Files (User Interface)

| File | Purpose |
|------|---------|
| `index.html` | Main game page with UI layout. |
| `styles.css` | Styles and animations for the game. |
| `script.js` | Handles game logic, UI updates, AI communication, and local storage. |
| `puzzles.json` | Stores daily challenge words and fun facts. |
| `greetings.json` | AI-generated greetings, reactions, and randomized messages. |
| `resources` | Images necessary for themes. |
| `emotions` | Images necessary for AI avatar display. |
| `favicon` | A cute icon. |

### Backend Files (AWS Lambda Functions)

| File | Purpose |
|------|---------|
| `getleaderboard.js` | Fetches and sorts leaderboard scores from AWS DynamoDB. |
| `submit.js` | Processes player scores, validates inputs, and updates the leaderboard. |
| `index.js` | Calls OpenAI's API to generate AI guesses based on user clues. |

---

## Installation & Setup

### 1. Clone the Repository

```
git clone https://github.com/your-username/explain-game.git
cd explain-game
```

### 2. Install Dependencies (For Backend Development)

```
cd backend
npm install @aws-sdk/client-dynamodb
```

### 3. Running Locally (Frontend Only)

If testing only the frontend, use a local HTTP server:

```
npx http-server .
```

Then, visit http://localhost:8080.

---

## Deploying to AWS Lambda

Since the game’s backend runs on AWS Lambda, you must deploy changes manually or via GitHub Actions.

### Manual Deployment (AWS CLI)

1. Zip your Lambda function:

```
zip -r function.zip .
```

2. Upload to AWS Lambda:

```
aws lambda update-function-code --function-name getLeaderboard --zip-file fileb://function.zip
```

### Automated Deployment (GitHub Actions)

1. Create `.github/workflows/deploy.yml`
2. Add the following content:

```
name: Deploy to AWS Lambda
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: zip -r function.zip .
      - run: aws lambda update-function-code --function-name getLeaderboard --zip-file fileb://function.zip
```

3. Commit & Push:

```
git add .
git commit -m "Deploy to AWS"
git push origin main
```

---

## Features & Mechanics

### Gameplay Features
- AI-powered guessing engine (GPT-4)
- Daily challenges and leaderboards
- Achievements and unlockable themes
- Custom words and fun facts
- AI-generated humorous reactions
- Multiple game modes for replayability

### Styling & UX
- Smooth animations and transitions
- Customizable and unlockable themes
- Mobile-responsive UI

### Leaderboard & Achievements
- DynamoDB integration for tracking scores
- Players can retry past challenges to improve rankings
- Unlockable achievements and visual rewards

---

## License

This project is licensed under the MIT License.

---

## Contact

For questions or suggestions, feel free to reach out to mario.d.gerardi@gmail.com, or submit an issue on GitHub.