# AI-Powered Property Scraping Setup Guide

## 🤖 OpenAI API Setup

To enable AI-powered property data extraction, you need to set up an OpenAI API key:

### 1. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" in your dashboard
4. Click "Create new secret key"
5. Copy the API key (starts with `sk-`)

### 2. Add to Environment
Add your OpenAI API key to your `.env.local` file:

```bash
# OpenAI API (for AI-powered property data extraction)
OPENAI_API_KEY="sk-your-actual-api-key-here"
```

### 3. How It Works

The AI-powered scraping works in three steps:

1. **Content Extraction**: Extracts text content from the property page
2. **AI Analysis**: Sends the text to ChatGPT for intelligent parsing
3. **Data Mapping**: Converts AI response to structured property data

### 4. Benefits

- ✅ **Bypasses anti-bot protection** by focusing on content, not HTML structure
- ✅ **Intelligent parsing** understands Italian property terms
- ✅ **Handles complex layouts** that traditional scraping can't
- ✅ **Extracts context** from descriptions and features
- ✅ **Works with any property site** that has text content

### 5. Cost

- Uses GPT-3.5-turbo (very cost-effective)
- Approximately $0.001-0.002 per property
- 1000 properties ≈ $1-2 in API costs

### 6. Supported Sites

Works with any property site that has text content:
- ✅ Idealista.it
- ✅ Immobiliare.it  
- ✅ Casa.it
- ✅ Tecnocasa.it
- ✅ And many more!

### 7. Fallback

If AI parsing fails, the system gracefully falls back to:
- Manual entry form
- Traditional scraping (if possible)
- Property link is still saved

## 🚀 Ready to Use!

Once you add your OpenAI API key, the AI-powered property extraction will work automatically when you paste property URLs!
