# SubText Mobile Web App - Deployment Guide

## ✅ Build Status

**✓ Build Successful** - The app compiles without errors and is ready for deployment.

---

## 🚀 Quick Deployment to Vercel

### Option 1: Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from project directory:**
   ```bash
   cd /Users/saadzubedi/Desktop/subtext-mobile-web-app
   vercel
   ```

4. **Follow prompts:**
   - Link to existing project or create new
   - Set project name: `subtext-mobile-web-app`
   - Accept defaults

5. **Add environment variables:**
   ```bash
   vercel env add NEXT_PUBLIC_API_URL
   vercel env add NEXT_PUBLIC_PAYPAL_CLIENT_ID
   vercel env add NEXT_PUBLIC_PAYPAL_MODE
   vercel env add NEXT_PUBLIC_PAYPAL_BASIC_PLAN_ID
   vercel env add NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID
   vercel env add NEXT_PUBLIC_PAYPAL_PREMIUM_PLAN_ID
   ```

   **Or** add them via Vercel Dashboard (easier):
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Copy values from `.env.local`

6. **Deploy to production:**
   ```bash
   vercel --prod
   ```

### Option 2: Vercel Dashboard (Web UI)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - SubText mobile web app"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure project:
     - Framework: Next.js
     - Build Command: `next build`
     - Output Directory: `.next`

3. **Add Environment Variables:**
   Copy from `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=https://subtext-backend-f8ci.vercel.app/api
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=AQkBJ3wyz9rRNdY36CFMsaQpchZTrqgaRPQgXA1zPtfnUVhVA4BeV75KIG7ikzGWBgYfRn8NULl2Ivqj
   NEXT_PUBLIC_PAYPAL_MODE=sandbox
   NEXT_PUBLIC_PAYPAL_BASIC_PLAN_ID=P-9HN26005PT8329537NEZC4AA
   NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID=P-65030679KA417305BNEZC4AY
   NEXT_PUBLIC_PAYPAL_PREMIUM_PLAN_ID=P-9LS85721FN3193001NEZC4BA
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

---

## 🔧 Before Going Live

### 1. Switch PayPal to Live Mode

**In Backend (.env):**
```env
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=<your-live-client-id>
PAYPAL_CLIENT_SECRET=<your-live-client-secret>
PAYPAL_BASIC_PLAN_ID=<new-live-plan-id>
PAYPAL_PRO_PLAN_ID=<new-live-plan-id>
PAYPAL_PREMIUM_PLAN_ID=<new-live-plan-id>
PAYPAL_WEBHOOK_ID=<new-live-webhook-id>
```

**In Frontend (.env.local):**
```env
NEXT_PUBLIC_PAYPAL_MODE=live
NEXT_PUBLIC_PAYPAL_CLIENT_ID=<your-live-client-id>
NEXT_PUBLIC_PAYPAL_BASIC_PLAN_ID=<new-live-plan-id>
NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID=<new-live-plan-id>
NEXT_PUBLIC_PAYPAL_PREMIUM_PLAN_ID=<new-live-plan-id>
```

### 2. Create Live PayPal Plans

Run backend scripts with live credentials:
```bash
cd /Users/saadzubedi/Desktop/SubText\ BackEnd
node scripts/create-product.js
node scripts/create-paypal-plans.js
```

Copy the generated Plan IDs to both backend and frontend env files.

### 3. Update Webhook URL

Create new PayPal webhook pointing to your live backend:
```
https://your-backend.vercel.app/api/webhooks/paypal
```

Save the Webhook ID to backend `.env`

---

## 📱 Custom Domain (Optional)

1. **In Vercel Dashboard:**
   - Go to Project Settings → Domains
   - Add your custom domain (e.g., `app.subtext.com`)

2. **Update DNS:**
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or use Vercel nameservers

3. **SSL:**
   - Auto-configured by Vercel
   - HTTPS enforced automatically

---

## 🧪 Testing Checklist

### Before Deployment
- [x] Build completes successfully
- [x] All pages render without errors
- [x] Environment variables configured
- [ ] Test with live PayPal sandbox
- [ ] Test full user flow end-to-end

### After Deployment
- [ ] Sign up creates account
- [ ] Login authenticates correctly
- [ ] Subscription payment completes
- [ ] OCR processes images
- [ ] AI analysis returns results
- [ ] Settings displays user info
- [ ] Logout clears session

### Production Ready
- [ ] PayPal switched to live mode
- [ ] Backend deployed with live credentials
- [ ] Webhooks configured
- [ ] Custom domain configured (optional)
- [ ] Analytics/monitoring set up
- [ ] Error tracking enabled

---

## 📊 Monitoring & Analytics

### Recommended Tools

1. **Vercel Analytics:**
   - Enable in Vercel dashboard
   - Real-time performance metrics
   - Web Vitals tracking

2. **Sentry (Error Tracking):**
   ```bash
   npm install @sentry/nextjs
   ```

3. **Google Analytics:**
   Add tracking script to `app/layout.tsx`

---

## 🔄 Updates & Redeploys

### Auto-Deploy from Git (Recommended)
Once connected to GitHub, every push to `main` branch auto-deploys.

### Manual Redeploy
```bash
vercel --prod
```

### Rollback
```bash
vercel rollback <deployment-url>
```

---

## 🐛 Troubleshooting

### Build Fails
- Check Vercel build logs
- Verify all env variables are set
- Test build locally: `npm run build`

### PayPal Buttons Not Showing
- Verify `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is correct
- Check browser console for errors
- Ensure plan IDs match your PayPal account

### API Requests Failing
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is deployed and running
- Verify CORS is enabled on backend

### Authentication Issues
- Clear browser localStorage
- Check JWT token expiry
- Verify Supabase credentials in backend

---

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables
4. Test backend API endpoints directly
5. Check PayPal dashboard for subscription issues

---

## 🎉 Your App is Ready!

**Live URL:** `https://your-project.vercel.app`

**Features:**
✓ User authentication
✓ PayPal subscriptions
✓ AI-powered analysis
✓ Mobile-optimized UI
✓ Secure & scalable

**Next Steps:**
1. Test thoroughly
2. Switch to live PayPal
3. Add custom domain
4. Set up monitoring
5. Launch! 🚀
