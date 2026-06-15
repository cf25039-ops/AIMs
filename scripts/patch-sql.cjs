const fs = require('fs');
let sql = fs.readFileSync('supabase/aims_init.sql', 'utf8');

// Fix 1: hardware.brand & model
sql = sql.replace('brand varchar(80),', 'brand_id uuid references brands(id) on delete restrict,');
sql = sql.replace('model varchar(80),', 'model_id uuid references models(id) on delete restrict,');

// Fix 2: activity_logs insert policy
sql = sql.replace('create policy activity_logs_insert on activity_logs for insert with check (is_super_admin());', 'create policy activity_logs_insert on activity_logs for insert with check (auth.uid() = actor_id);');

// Fix 3: profiles_select policy
let profileSelect = `create policy profiles_select on profiles for select using (
    auth.uid() = id
    or is_super_admin()
    or exists (
        select 1 from project_members pm1
        join project_members pm2 on pm1.project_id = pm2.project_id
        where pm1.user_id = auth.uid() and pm2.user_id = profiles.id
    )
);`;
sql = sql.replace('create policy profiles_select on profiles for select using (auth.uid() = id or is_super_admin());', profileSelect);

// Fix 4: handle_new_user trigger
let triggerSql = `
-- Handle New User Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'staff');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
`;
sql = sql.replace('COMMIT;', triggerSql + '\nCOMMIT;');

fs.writeFileSync('supabase/aims_init.sql', sql);
console.log('Patched aims_init.sql successfully.');
