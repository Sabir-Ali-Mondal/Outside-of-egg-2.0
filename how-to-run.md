# Gemini API Setup for Vercel and Local Development

## Running on Vercel
Replace with your Gemini API key in the `vercel.json` file before deploying on Vercel.

### **vercel.json**
```json
{
  "env": {
    "GEMINI_API_KEY": "YOURAPI"
  }
}
```

## Running Locally
In `.env` file in the project root, add your Gemini API key.

### **.env**
```
GEMINI_API_KEY=YOURAPI
```

This setup ensures secure API key handling for both cloud and local environments.

