CREATE OR REPLACE FUNCTION public.claim_next_dialer_contact(p_campaign_id uuid)
 RETURNS SETOF dialer_queue
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  update public.dialer_queue q
     set status = 'dialing',
         attempts = q.attempts + 1,
         last_attempt_at = now()
   where q.id = (
     select dq.id
       from public.dialer_queue dq
      where dq.campaign_id = p_campaign_id
        and dq.status = 'pending'
        and (dq.next_attempt_at is null or dq.next_attempt_at <= now())
        and auth.uid() is not null
      order by dq.priority desc, dq.created_at asc
        for update skip locked
      limit 1
   )
  returning q.*;
$function$
