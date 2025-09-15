# AI Powered Intelligent Nurse Rostering System


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

