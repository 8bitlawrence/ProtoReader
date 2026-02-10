# Heroku Deployment Guide

Your QuizBowl application is ready for Heroku deployment! Follow these steps:

## Prerequisites
1. **Create a Heroku Account**: https://www.heroku.com/
2. **Install Heroku CLI**: https://devcenter.heroku.com/articles/heroku-cli

## Deployment Steps

### 1. Install Heroku CLI
Download and install from: https://devcenter.heroku.com/articles/heroku-cli

### 2. Login to Heroku
```bash
heroku login
```
This will open a browser window for authentication.

### 3. Create a Heroku App
```bash
cd "C:\Users\Lawrence Tong\Desktop\qb website"
heroku create your-app-name
```
Replace `your-app-name` with a unique name (e.g., `quiz-bowl-multiplayer`, `lawrence-quiz-bowl`, etc.)

### 4. Commit Your Code
```bash
git add .
git commit -m "Initial commit for Heroku deployment"
```

### 5. Deploy to Heroku
```bash
git push heroku main
```
Or if your branch is `master`:
```bash
git push heroku master
```

### 6. Open Your App
```bash
heroku open
```

Your app will be live at: `https://your-app-name.herokuapp.com`

## Testing
- Open the URL in your browser
- Share the URL with friends on any network
- They can now join your multiplayer rooms without being on the same WiFi

## Useful Heroku Commands
```bash
# View logs
heroku logs --tail

# View your app URL
heroku info

# Scale dynos if needed (free tier has limited resources)
heroku ps:scale web=1

# View environment variables
heroku config
```

## Troubleshooting

**App won't start?**
```bash
heroku logs --tail
```
Check logs for error messages.

**Questions about deployment?**
Visit: https://devcenter.heroku.com/articles/getting-started-with-nodejs

---

Once deployed, anyone with the URL can access your quiz bowl multiplayer game!
