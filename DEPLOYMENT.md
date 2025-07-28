# NoteGPT Deployment Guide

## Render Deployment

### Quick Setup
1. **Fork this repository** to your GitHub account
2. **Create a new Web Service** on [Render](https://render.com)
3. **Connect your GitHub repository**
4. **Use these settings**:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start` 
   - **Node Version**: 18+ (auto-detected)

### Environment Variables
Set these in your Render dashboard:

**Required:**
- `NODE_ENV=production`
- `GEMINI_API_KEY=your_gemini_api_key_here`

**Optional:**
- `HUGGINGFACE_API_KEY=your_hugging_face_key` (for enhanced AI features)
- `DATABASE_URL=your_postgresql_url` (if using external database)

### Database Setup (Optional)
For persistent storage, add a PostgreSQL database:
1. **Create PostgreSQL database** in Render
2. **Copy connection string** to `DATABASE_URL` environment variable
3. **Run migrations**: The app will auto-setup tables on first run

### Troubleshooting

**Build fails with status 127:**
- Ensure `build` script exists in package.json
- Check Node.js version compatibility (use 18+)
- Verify all dependencies are in package.json

**App won't start:**
- Check `start` script runs `node dist/index.js`
- Ensure build completed successfully
- Verify environment variables are set

**API calls fail:**
- Check `GEMINI_API_KEY` is properly set
- Verify API key has sufficient permissions
- Check Render logs for specific error messages

### File Structure After Build
```
dist/
├── index.js          # Server bundle
├── worker.js         # Cloudflare Workers bundle  
└── public/           # Static frontend files
    ├── index.html
    └── assets/
        ├── *.css
        └── *.js
```

## Cloudflare Workers Deployment

### Requirements
- Cloudflare account with Workers enabled
- Wrangler CLI: `npm install -g wrangler`
- API token: [Create Token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)

### Deploy Steps
1. **Login to Wrangler**: `wrangler login`
2. **Set environment variables** in `wrangler.toml`
3. **Deploy**: `wrangler deploy --env=""`

### Environment Variables for Workers
```toml
[env.production.vars]
NODE_ENV = "production"
GEMINI_API_KEY = "your_gemini_api_key_here"
```

## Local Development

### Setup
```bash
npm install
npm run dev
```

### Production Test
```bash
npm run build
npm run start
```

The app will be available at `http://localhost:5000`

## Features Available After Deployment

✅ **Core Features**:
- AI-powered note generation with Google Gemini
- PDF upload and text extraction
- Real-time content processing
- Export to PDF functionality

✅ **Advanced Features** (with HUGGINGFACE_API_KEY):
- Multi-model AI processing
- Enhanced visual layouts
- Advanced PDF generation with charts

✅ **Production Ready**:
- Optimized bundle sizes
- Static file serving
- Error handling
- CORS configuration
- Environment-based configuration

## Performance

- **Frontend Bundle**: ~890KB (gzipped: ~254KB)
- **Server Bundle**: ~107KB
- **Workers Bundle**: ~37KB (for Cloudflare)
- **Cold Start**: < 2 seconds
- **API Response**: < 5 seconds (depending on AI processing)