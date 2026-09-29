-- ================================================================
-- Supabase Easy Mode for platform-files
-- هدفه تشغيل الرفع والعرض بأقل إعدادات ممكنة.
-- ملاحظة: هذا الإعداد متساهل أمنيًا عن عمد: الملفات عامة، والرفع متاح
-- للـ anon/authenticated. لا تستخدمه للملفات الحساسة.
-- ================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'platform-files',
  'platform-files',
  true,
  52428800,
  null
)
on conflict (id) do update set
  name = excluded.name,
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = null;

-- إزالة السياسات القديمة التي قد تتعارض مع وضع التشغيل السهل.
drop policy if exists "platform firebase project only" on storage.objects;
drop policy if exists "platform approved users can read files" on storage.objects;
drop policy if exists "platform approved teachers can upload" on storage.objects;
drop policy if exists "platform owners and admins can delete" on storage.objects;
drop policy if exists "platform teachers can read own uploaded objects" on storage.objects;
drop policy if exists "easy public uploads" on storage.objects;
drop policy if exists "easy public reads" on storage.objects;
drop policy if exists "easy authenticated updates" on storage.objects;
drop policy if exists "easy authenticated deletes" on storage.objects;

-- الرفع: يعمل حتى بدون تسجيل دخول إلى Supabase.
create policy "easy public uploads"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'platform-files');

-- القراءة/الـRETURNING بعد الرفع: متاحة للـ anon وauthenticated.
create policy "easy public reads"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'platform-files');

-- يمكن للمستخدم المسجل حذف الملفات من المنصة.
create policy "easy authenticated deletes"
on storage.objects
for delete
to authenticated
using (bucket_id = 'platform-files');

-- دعم التحديث عند الحاجة.
create policy "easy authenticated updates"
on storage.objects
for update
to authenticated
using (bucket_id = 'platform-files')
with check (bucket_id = 'platform-files');
