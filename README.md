# 🏥 AI Powered Intelligent Nurse Rostering System

**Modern web application for Malaysian healthcare with complete labor law compliance**

---

## 📚 Documentation

- **[🚀 QUICK START](./QUICK_START.md)** - Get running in 30 minutes
- **[🌐 INTEGRATION GUIDE](./INTEGRATION_GUIDE.md)** - Detailed integration analysis
- **[⚖️ Malaysian Compliance](../FILE_CLEANUP_RECOMMENDATION.md)** - Labor law requirements

---

## 🏃‍♂️ Quick Setup

### 1. Clone the Repository

```bash
git clone <repo-url>
cd great_ai
```

### 2. Install Dependencies

Use [pnpm](https://pnpm.io/) for package management:

```bash
pnpm install
```


### 3. Set Up Environment Variables

#### Option 1: Local .env File
Create a `.env.local` file in the root directory. Example:

```env
# Database connection
DATABASE_URL="your_database_url_here"
# Add other required environment variables below
```

#### Option 2: Doppler CLI 

Use [Doppler](https://doppler.com/) to securely manage and share environment variables across services and collaborators.

**Install Doppler CLI:**
Follow the official instructions: https://docs.doppler.com/docs/install-cli

**Login and setup your project/environment:**
```bash
doppler login
doppler setup
```

**Run the development server with Doppler:**
```bash
doppler run -- pnpm dev
```

> **Note:** On Doppler's free plan, if you change environment variables, you must manually restart the dev server for changes to take effect.

Open [http://localhost:3000](http://localhost:3000) in your browser.

