insert into public.plans (name, interval, price, duration_days) values
  ('Monthly', 'monthly', 30, 30),
  ('Quarterly', 'quarterly', 80, 90),
  ('Annual', 'annual', 290, 365);

-- Demo members + 45 days of attendance (members 1-4 slow down recently, so AI flags them)
insert into public.members (full_name, email, phone, plan_id, status, join_date, renewal_date)
select 'Demo Member ' || g, 'member' || g || '@example.com', '+92300000' || lpad(g::text, 4, '0'),
  (select id from public.plans order by price offset (g % 3) limit 1),
  case when g % 9 = 0 then 'expired' when g % 11 = 0 then 'paused' else 'active' end,
  current_date - (g * 6), current_date + ((g * 5) % 28) - 4
from generate_series(1, 24) g;

insert into public.attendance (member_id, checked_in_at, method)
select m.id, now() - (d || ' days')::interval - (random() * 8 || ' hours')::interval, 'manual'
from (select id, row_number() over (order by full_name) rn from public.members) m
cross join generate_series(0, 44) d
where random() < case when m.rn <= 4 and d < 18 then 0.05 else 0.55 end;

insert into public.payments (member_id, plan_id, amount, method, status, paid_at)
select m.id, m.plan_id, p.price, 'cash', 'paid', now() - interval '3 days'
from public.members m join public.plans p on p.id = m.plan_id;
