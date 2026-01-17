# Petty Cash Manager

A React + Vite application for managing petty cash and expenses for projects.

## Prerequisites

- Node.js (v18 or higher)
- A Supabase account

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Supabase Setup**
   - Create a new project in [Supabase](https://supabase.com).
   - Go to the SQL Editor and run the contents of `supabase_schema.sql` to create the tables.
   - Go to Project Settings -> API and copy the `URL` and `anon` public key.

3. **Environment Variables**
   - Create a `.env` file in the root directory (copy from `.env.example`).
   - Add your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_project_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```

4. **Run the Application**
   ```bash
   npm run dev
   ```

## Features

- **Add Project**: Create projects with a logo.
- **Add Petty Cash**: Add funds to projects and view history.
- **Home Dashboard**: View all projects, total cash received, and total expenses.
- **Project Details**: Add expenses (Travelling, Food, etc.) to a project.
- **Reports**: View summary of all projects and export expense data to CSV.

## Tech Stack

- React
- Vite
- Tailwind CSS
- Supabase (Database & Auth)
- Lucide React (Icons)
