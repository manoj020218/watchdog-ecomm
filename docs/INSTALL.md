# Commerce Watchdog — Installation Guide

## Prerequisites
- Node.js 18+
- pnpm 8+
- MongoDB 6+ (local or Atlas)

## 1. Clone and install

```bash
git clone https://github.com/your-org/commerce-watchdog.git
cd commerce-watchdog
pnpm install
```

## 2. Configure the API

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
PORT=3100
MONGODB_URI=mongodb://localhost:27017/commerce-watchdog
WATCHDOG_API_KEYS=key_your_store_key_here
ALLOWED_ORIGINS=https://your-store.com,https://your-dashboard.com
```

Generate a secure key: `node -e "console.log('key_' + require('crypto').randomBytes(24).toString('hex'))"`

## 3. Configure the dashboard

```bash
cp apps/dashboard/.env.example apps/dashboard/.env
```

Edit `apps/dashboard/.env`:

```env
VITE_API_URL=http://localhost:3100
VITE_API_KEY=key_your_store_key_here
VITE_STORE_ID=your-store-name
```

## 4. Build and run

### Development

```bash
# Terminal 1: API
cd apps/api && pnpm dev

# Terminal 2: Dashboard
cd apps/dashboard && pnpm dev
```

Dashboard opens at http://localhost:5173

### Production

```bash
pnpm run build:api      # compiles to apps/api/dist/
pnpm run build:dashboard # compiles to apps/dashboard/dist/

# Run API with PM2
pm2 start apps/api/dist/index.js --name commerce-watchdog-api

# Serve dashboard with nginx or any static host
```

## 5. Add the Web SDK to your store

```html
<!-- Add before </body> -->
<script src="https://your-cdn.com/commerce-watchdog-sdk.umd.js"></script>
<script>
  CommerceWatchdog.init({
    apiUrl: 'https://your-api-domain.com',
    apiKey: 'key_your_store_key_here',
    storeId: 'your-store-name',
    adapter: 'custom-react-node'
  });
</script>
```

Or with npm:

```bash
npm install @commerce-watchdog/web-sdk
```

```typescript
import { CommerceWatchdogSDK } from '@commerce-watchdog/web-sdk';

const watchdog = new CommerceWatchdogSDK({
  apiUrl: 'https://your-api-domain.com',
  apiKey: 'key_your_store_key_here',
  storeId: 'your-store-name',
  adapter: 'custom-react-node'
});

watchdog.init();
```

See [SDK_USAGE.md](SDK_USAGE.md) for full tracking API documentation.
