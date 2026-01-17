-- Create projects table
create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  logo text, -- Base64 string or URL
  created_at timestamptz default now()
);

-- Create petty_cash_entries table
create table petty_cash_entries (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  amount numeric not null,
  created_at timestamptz default now()
);

-- Create expenses table
create table expenses (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  expense_type text not null,
  expense_head text not null,
  user_name text default 'Nikhil',
  description text,
  amount numeric not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table projects enable row level security;
alter table petty_cash_entries enable row level security;
alter table expenses enable row level security;

-- Create policies (Allow all for now for simplicity, or specific user based)
-- For this prototype, we'll allow public access (be careful in production)
create policy "Public projects access" on projects for all using (true);
create policy "Public petty cash access" on petty_cash_entries for all using (true);
create policy "Public expenses access" on expenses for all using (true);
