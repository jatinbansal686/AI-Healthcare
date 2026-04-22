drop extension if exists "pg_net";


  create table "public"."appointments" (
    "id" uuid not null default gen_random_uuid(),
    "inquiry_id" uuid,
    "therapist_id" uuid,
    "patient_id" uuid,
    "start_time" timestamp with time zone not null,
    "end_time" timestamp with time zone not null,
    "google_calendar_event_id" text,
    "status" text not null default 'confirmed'::text,
    "notes" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."appointments" enable row level security;


  create table "public"."chat_messages" (
    "id" uuid not null default gen_random_uuid(),
    "patient_id" uuid,
    "inquiry_id" uuid,
    "role" text not null,
    "content" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."chat_messages" enable row level security;


  create table "public"."inquiries" (
    "id" uuid not null default gen_random_uuid(),
    "patient_id" uuid,
    "problem_description" text not null,
    "requested_schedule" text,
    "insurance_info" text,
    "preferred_language" text,
    "preferred_gender" text,
    "extracted_specialty" text,
    "matched_therapist_id" uuid,
    "status" text not null default 'pending'::text,
    "ai_summary" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."inquiries" enable row level security;


  create table "public"."therapists" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "name" text not null,
    "bio" text,
    "photo_url" text,
    "specialties" text[] not null default '{}'::text[],
    "accepted_insurance" text[] not null default '{}'::text[],
    "languages" text[] not null default '{English}'::text[],
    "gender" text,
    "google_calendar_id" text,
    "google_refresh_token" text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."therapists" enable row level security;


  create table "public"."user_profiles" (
    "id" uuid not null,
    "role" text not null default 'patient'::text,
    "full_name" text,
    "email" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."user_profiles" enable row level security;

CREATE UNIQUE INDEX appointments_pkey ON public.appointments USING btree (id);

CREATE UNIQUE INDEX chat_messages_pkey ON public.chat_messages USING btree (id);

CREATE UNIQUE INDEX inquiries_pkey ON public.inquiries USING btree (id);

CREATE UNIQUE INDEX therapists_pkey ON public.therapists USING btree (id);

CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);

alter table "public"."appointments" add constraint "appointments_pkey" PRIMARY KEY using index "appointments_pkey";

alter table "public"."chat_messages" add constraint "chat_messages_pkey" PRIMARY KEY using index "chat_messages_pkey";

alter table "public"."inquiries" add constraint "inquiries_pkey" PRIMARY KEY using index "inquiries_pkey";

alter table "public"."therapists" add constraint "therapists_pkey" PRIMARY KEY using index "therapists_pkey";

alter table "public"."user_profiles" add constraint "user_profiles_pkey" PRIMARY KEY using index "user_profiles_pkey";

alter table "public"."appointments" add constraint "appointments_inquiry_id_fkey" FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id) ON DELETE CASCADE not valid;

alter table "public"."appointments" validate constraint "appointments_inquiry_id_fkey";

alter table "public"."appointments" add constraint "appointments_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."appointments" validate constraint "appointments_patient_id_fkey";

alter table "public"."appointments" add constraint "appointments_status_check" CHECK ((status = ANY (ARRAY['confirmed'::text, 'cancelled'::text, 'rescheduled'::text, 'no_show'::text]))) not valid;

alter table "public"."appointments" validate constraint "appointments_status_check";

alter table "public"."appointments" add constraint "appointments_therapist_id_fkey" FOREIGN KEY (therapist_id) REFERENCES public.therapists(id) ON DELETE SET NULL not valid;

alter table "public"."appointments" validate constraint "appointments_therapist_id_fkey";

alter table "public"."chat_messages" add constraint "chat_messages_inquiry_id_fkey" FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id) ON DELETE SET NULL not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_inquiry_id_fkey";

alter table "public"."chat_messages" add constraint "chat_messages_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_patient_id_fkey";

alter table "public"."chat_messages" add constraint "chat_messages_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text]))) not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_role_check";

alter table "public"."inquiries" add constraint "inquiries_matched_therapist_id_fkey" FOREIGN KEY (matched_therapist_id) REFERENCES public.therapists(id) ON DELETE SET NULL not valid;

alter table "public"."inquiries" validate constraint "inquiries_matched_therapist_id_fkey";

alter table "public"."inquiries" add constraint "inquiries_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."inquiries" validate constraint "inquiries_patient_id_fkey";

alter table "public"."inquiries" add constraint "inquiries_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'matched'::text, 'awaiting_booking'::text, 'scheduled'::text, 'cancelled'::text, 'failed'::text]))) not valid;

alter table "public"."inquiries" validate constraint "inquiries_status_check";

alter table "public"."therapists" add constraint "therapists_gender_check" CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'non-binary'::text, 'prefer_not_to_say'::text]))) not valid;

alter table "public"."therapists" validate constraint "therapists_gender_check";

alter table "public"."therapists" add constraint "therapists_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."therapists" validate constraint "therapists_user_id_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_id_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_role_check" CHECK ((role = ANY (ARRAY['patient'::text, 'therapist'::text, 'admin'::text]))) not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_role_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select role from user_profiles where id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.user_profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin new.updated_at = now(); return new; end;
$function$
;

grant delete on table "public"."appointments" to "anon";

grant insert on table "public"."appointments" to "anon";

grant references on table "public"."appointments" to "anon";

grant select on table "public"."appointments" to "anon";

grant trigger on table "public"."appointments" to "anon";

grant truncate on table "public"."appointments" to "anon";

grant update on table "public"."appointments" to "anon";

grant delete on table "public"."appointments" to "authenticated";

grant insert on table "public"."appointments" to "authenticated";

grant references on table "public"."appointments" to "authenticated";

grant select on table "public"."appointments" to "authenticated";

grant trigger on table "public"."appointments" to "authenticated";

grant truncate on table "public"."appointments" to "authenticated";

grant update on table "public"."appointments" to "authenticated";

grant delete on table "public"."appointments" to "service_role";

grant insert on table "public"."appointments" to "service_role";

grant references on table "public"."appointments" to "service_role";

grant select on table "public"."appointments" to "service_role";

grant trigger on table "public"."appointments" to "service_role";

grant truncate on table "public"."appointments" to "service_role";

grant update on table "public"."appointments" to "service_role";

grant delete on table "public"."chat_messages" to "anon";

grant insert on table "public"."chat_messages" to "anon";

grant references on table "public"."chat_messages" to "anon";

grant select on table "public"."chat_messages" to "anon";

grant trigger on table "public"."chat_messages" to "anon";

grant truncate on table "public"."chat_messages" to "anon";

grant update on table "public"."chat_messages" to "anon";

grant delete on table "public"."chat_messages" to "authenticated";

grant insert on table "public"."chat_messages" to "authenticated";

grant references on table "public"."chat_messages" to "authenticated";

grant select on table "public"."chat_messages" to "authenticated";

grant trigger on table "public"."chat_messages" to "authenticated";

grant truncate on table "public"."chat_messages" to "authenticated";

grant update on table "public"."chat_messages" to "authenticated";

grant delete on table "public"."chat_messages" to "service_role";

grant insert on table "public"."chat_messages" to "service_role";

grant references on table "public"."chat_messages" to "service_role";

grant select on table "public"."chat_messages" to "service_role";

grant trigger on table "public"."chat_messages" to "service_role";

grant truncate on table "public"."chat_messages" to "service_role";

grant update on table "public"."chat_messages" to "service_role";

grant delete on table "public"."inquiries" to "anon";

grant insert on table "public"."inquiries" to "anon";

grant references on table "public"."inquiries" to "anon";

grant select on table "public"."inquiries" to "anon";

grant trigger on table "public"."inquiries" to "anon";

grant truncate on table "public"."inquiries" to "anon";

grant update on table "public"."inquiries" to "anon";

grant delete on table "public"."inquiries" to "authenticated";

grant insert on table "public"."inquiries" to "authenticated";

grant references on table "public"."inquiries" to "authenticated";

grant select on table "public"."inquiries" to "authenticated";

grant trigger on table "public"."inquiries" to "authenticated";

grant truncate on table "public"."inquiries" to "authenticated";

grant update on table "public"."inquiries" to "authenticated";

grant delete on table "public"."inquiries" to "service_role";

grant insert on table "public"."inquiries" to "service_role";

grant references on table "public"."inquiries" to "service_role";

grant select on table "public"."inquiries" to "service_role";

grant trigger on table "public"."inquiries" to "service_role";

grant truncate on table "public"."inquiries" to "service_role";

grant update on table "public"."inquiries" to "service_role";

grant delete on table "public"."therapists" to "anon";

grant insert on table "public"."therapists" to "anon";

grant references on table "public"."therapists" to "anon";

grant select on table "public"."therapists" to "anon";

grant trigger on table "public"."therapists" to "anon";

grant truncate on table "public"."therapists" to "anon";

grant update on table "public"."therapists" to "anon";

grant delete on table "public"."therapists" to "authenticated";

grant insert on table "public"."therapists" to "authenticated";

grant references on table "public"."therapists" to "authenticated";

grant select on table "public"."therapists" to "authenticated";

grant trigger on table "public"."therapists" to "authenticated";

grant truncate on table "public"."therapists" to "authenticated";

grant update on table "public"."therapists" to "authenticated";

grant delete on table "public"."therapists" to "service_role";

grant insert on table "public"."therapists" to "service_role";

grant references on table "public"."therapists" to "service_role";

grant select on table "public"."therapists" to "service_role";

grant trigger on table "public"."therapists" to "service_role";

grant truncate on table "public"."therapists" to "service_role";

grant update on table "public"."therapists" to "service_role";

grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant references on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant trigger on table "public"."user_profiles" to "anon";

grant truncate on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

grant insert on table "public"."user_profiles" to "authenticated";

grant references on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "authenticated";

grant trigger on table "public"."user_profiles" to "authenticated";

grant truncate on table "public"."user_profiles" to "authenticated";

grant update on table "public"."user_profiles" to "authenticated";

grant delete on table "public"."user_profiles" to "service_role";

grant insert on table "public"."user_profiles" to "service_role";

grant references on table "public"."user_profiles" to "service_role";

grant select on table "public"."user_profiles" to "service_role";

grant trigger on table "public"."user_profiles" to "service_role";

grant truncate on table "public"."user_profiles" to "service_role";

grant update on table "public"."user_profiles" to "service_role";


  create policy "Admin sees all appointments"
  on "public"."appointments"
  as permissive
  for all
  to public
using ((public.get_user_role() = 'admin'::text));



  create policy "Patient sees own appointments"
  on "public"."appointments"
  as permissive
  for select
  to public
using ((patient_id = auth.uid()));



  create policy "Therapist sees own appointments"
  on "public"."appointments"
  as permissive
  for select
  to public
using ((therapist_id IN ( SELECT therapists.id
   FROM public.therapists
  WHERE (therapists.user_id = auth.uid()))));



  create policy "Patient sees own messages"
  on "public"."chat_messages"
  as permissive
  for all
  to public
using ((patient_id = auth.uid()));



  create policy "Admin sees all inquiries"
  on "public"."inquiries"
  as permissive
  for all
  to public
using ((public.get_user_role() = 'admin'::text));



  create policy "Patients can insert own inquiry"
  on "public"."inquiries"
  as permissive
  for insert
  to public
with check ((patient_id = auth.uid()));



  create policy "Patients see own inquiries"
  on "public"."inquiries"
  as permissive
  for select
  to public
using ((patient_id = auth.uid()));



  create policy "Admin can do everything on therapists"
  on "public"."therapists"
  as permissive
  for all
  to public
using ((public.get_user_role() = 'admin'::text));



  create policy "Public can read active therapists"
  on "public"."therapists"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "Therapist can update own profile"
  on "public"."therapists"
  as permissive
  for update
  to public
using ((user_id = auth.uid()));



  create policy "Admin sees all profiles"
  on "public"."user_profiles"
  as permissive
  for all
  to public
using ((public.get_user_role() = 'admin'::text));



  create policy "User sees own profile"
  on "public"."user_profiles"
  as permissive
  for select
  to public
using ((id = auth.uid()));



  create policy "User updates own profile"
  on "public"."user_profiles"
  as permissive
  for update
  to public
using ((id = auth.uid()));


CREATE TRIGGER inquiries_updated_at BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER therapists_updated_at BEFORE UPDATE ON public.therapists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


