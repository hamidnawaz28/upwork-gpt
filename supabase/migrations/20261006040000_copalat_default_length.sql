-- New accounts start on the Detailed length (Professional is already the default tone).
alter table public.copalat_accounts alter column length set default 'detailed';

-- Accounts still on the old default move with it; anyone who picked Short keeps it.
update public.copalat_accounts set length = 'detailed' where length = 'medium';
