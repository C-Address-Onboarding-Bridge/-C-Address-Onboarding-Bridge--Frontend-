# Deployment Guide

This document outlines the deployment process for the C-Address Onboarding Bridge Frontend. We use Vercel for our deployment infrastructure, which provides seamless continuous integration and deployment.

## Environments

We maintain three distinct environments:

1. **Development (Preview)**: Automatically deployed for every pull request. Used for QA and code review.
2. **Staging**: Deployed when code is merged into the `staging` branch (or specific staging tags). Used for final validation before production.
3. **Production**: Deployed when code is merged into the `main` branch. This is the live environment for users.

## Vercel Configuration

Our Vercel configuration is defined in `vercel.json` at the root of the repository. This file configures:
- Next.js framework settings
- Clean URLs and trailing slash behavior
- Security headers
- Build and install commands

## Environment Variables

Environment variables are managed directly in the Vercel Dashboard to ensure security. 

To configure environment variables:
1. Go to the project settings in the Vercel Dashboard.
2. Navigate to **Environment Variables**.
3. Add your variables and select the environments they apply to (Production, Preview, Development).

**Required Environment Variables:**
- `NEXT_PUBLIC_STELLAR_NETWORK`: Specifies the Stellar network (e.g., `PUBLIC`, `TESTNET`).
- (Add other necessary variables as needed)

## Deployment Workflow

### 1. Preview Deployments
When a developer creates a Pull Request against the `main` branch:
- Vercel automatically detects the PR.
- A new build is triggered.
- A unique preview URL is generated and posted as a comment on the PR.
- Reviewers can use this URL to test changes in an isolated environment.

### 2. Production Deployment
When a Pull Request is approved and merged into `main`:
- Vercel detects the push to `main`.
- A production build is triggered.
- If the build is successful, the new version is automatically deployed to the production domain.

## Rollbacks
Vercel automatically keeps previous deployments. If a critical issue is found in production:
1. Go to the **Deployments** tab in the Vercel Dashboard.
2. Find the last stable deployment.
3. Click the three dots (...) and select **Promote to Production** (or **Assign Custom Domains**) to instantly revert the live site.
