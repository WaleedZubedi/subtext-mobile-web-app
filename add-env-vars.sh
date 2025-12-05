#!/bin/bash

# Script to add environment variables to Vercel
# Run this with: bash add-env-vars.sh

echo "Adding environment variables to Vercel project..."

echo "https://subtext-backend-f8ci.vercel.app/api" | vercel env add NEXT_PUBLIC_API_URL production preview development

echo "AQkBJ3wyz9rRNdY36CFMsaQpchZTrqgaRPQgXA1zPtfnUVhVA4BeV75KIG7ikzGWBgYfRn8NULl2Ivqj" | vercel env add NEXT_PUBLIC_PAYPAL_CLIENT_ID production preview development

echo "sandbox" | vercel env add NEXT_PUBLIC_PAYPAL_MODE production preview development

echo "P-9HN26005PT8329537NEZC4AA" | vercel env add NEXT_PUBLIC_PAYPAL_BASIC_PLAN_ID production preview development

echo "P-65030679KA417305BNEZC4AY" | vercel env add NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID production preview development

echo "P-9LS85721FN3193001NEZC4BA" | vercel env add NEXT_PUBLIC_PAYPAL_PREMIUM_PLAN_ID production preview development

echo ""
echo "✓ Environment variables added!"
echo ""
echo "Now redeploy to apply the changes:"
echo "vercel --prod"
