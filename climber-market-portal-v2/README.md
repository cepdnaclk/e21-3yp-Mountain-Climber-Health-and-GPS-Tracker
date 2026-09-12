# Summit Gear Portal

The Summit Gear Portal is a comprehensive Next.js e-commerce web application for off-grid mountain safety tracking hardware and software. It allows users to browse and purchase hardware nodes, register devices, and access dedicated firmware/software downloads.

## Tech Stack
- **Framework:** Next.js 16
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage)

## Features
- **Product Catalog:** Browse and purchase hardware nodes (Climber, Basecamp, Repeater).
- **Cart & Checkout:** Persistent shopping cart (localStorage) and integrated checkout processing.
- **Device Registration:** Secure device registration workflow using hardware serial numbers.
- **Software Distribution:** Role-Based Access Control (RBAC) ensures users only access firmware and software for registered and approved devices.
- **Admin Dashboard:** Manage inventory, update order statuses, upload software packages, and approve device registrations.

## Setup Instructions

### Environment Variables
To run this project locally, you need to set up the following environment variables. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### How to Run Locally
1. Clone the repository and navigate into the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure Overview
- `app/`: Next.js App Router containing pages, layouts, and API routes.
  - `admin/`: Admin panel routes for managing orders, devices, registrations, and software.
  - `actions/`: Next.js Server Actions for secure database operations (orders, device registration, admin tasks).
  - `types/`: Shared TypeScript definitions (e.g., Supabase table interfaces).
- `lib/`: Utility functions and clients, such as Supabase client configurations (`server.ts`, `client.ts`).
- `public/`: Static assets including product images and icons.
