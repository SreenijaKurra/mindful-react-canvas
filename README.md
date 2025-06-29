# Tavus Vibecode Quickstart

## 🚀 Introduction

The fastest way to get started vibecoding with Tavus CVI. This React quickstart template provides everything you need to create interactive video experiences powered by Tavus's Conversational Video Interface technology.

> ⚠️ **Important Note**: This is a development template only. For production use, you must:
> - Never expose your Tavus API keys in the frontend
> - Implement a secure backend service to handle API calls
> - Use environment variables and proper key management
> - Follow security best practices for handling sensitive credentials

<br></br>
## 🛠️ Tech Stack
- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Supabase (Database)
- Tavus API (Lip-sync videos)
- OpenAI API (Text generation)
<br></br>
## 🧑‍💻 Try it Live
Spin up this template in under a minute with StackBlitz:

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/Tavus-Engineering/tavus-vibecode-quickstart?file=src%2FApp.tsx)

<br></br>
## ⚡ Quick Start

1. **Get your API credentials:**
   - Create an account on [Tavus Platform](https://platform.tavus.io/api-keys)
   - Generate your API token

2. **Run the template:**
   ```bash
   npm install
   npm run dev
   ```

3. **Customize your persona:**
   - Update the `persona_id` in `createConversation.ts` with your own
   - Learn how to [create your own persona](https://docs.tavus.io/sections/conversational-video-interface/creating-a-persona) on the [Tavus Platform](https://platform.tavus.io/)

4. **Set up Supabase:**
   - Create a Supabase project in the neuroheart org
   - Run the migration: `supabase/migrations/create_audio_files_neuroheart.sql`
   - Add your Supabase URL and anon key to `.env`

5. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Add your actual API keys and Supabase credentials
   ```

   ```typescript
   body: JSON.stringify({
     persona_id: "your_persona_id_here",
   }),
   ```

<br></br>
## 📚 Resources

- [Tavus Documentation](https://docs.tavus.io/)
- [API Reference](https://docs.tavus.io/api-reference/)
- [Tavus Platform](https://platform.tavus.io/)
- [Daily React Reference](https://docs.daily.co/reference/daily-react)

<!-- Sync fix for Lovable -->
