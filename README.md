# TenantCart

## AI analytics setup

The merchant dashboard includes an analytics assistant at `/dashboard/analytics`.
Set one provider key in `backEnd/.env` before using it:

```env
GEMINI_API_KEY=your_google_ai_studio_key
# Optional fallback when Gemini is unavailable
GROQ_API_KEY=your_groq_api_key
```

Optional model overrides are `GEMINI_MODEL` and `GROQ_MODEL`. The assistant only
reads the authenticated tenant's paid, shipped, and delivered orders. It supports
revenue by day, week, or month and top products by quantity or revenue.