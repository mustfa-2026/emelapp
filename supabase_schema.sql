-- ==============================================================================
-- 🚀 كود إنشاء جداول وقواعد بيانات Supabase لتطبيق "خزنة المستخدم" (UserVault)
-- قم بنسخ هذا الكود ولصقه في: Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. إنشاء جدول الخزنة وحفظ البريدات (vaults)
CREATE TABLE IF NOT EXISTS public.vaults (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    password TEXT DEFAULT '',
    label TEXT DEFAULT 'حساب بريد',
    notes TEXT DEFAULT '',
    service TEXT DEFAULT 'custom',
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. إنشاء فهارس لتحسين سرعة البحث
CREATE INDEX IF NOT EXISTS idx_vaults_created_at ON public.vaults(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vaults_email ON public.vaults(email);

-- 3. تفعيل الحماية على مستوى الصفوف (Row Level Security)
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء سياسات السماح للمستخدمين عبر مفتاح Anon Key (قراءة، إضافة، تحديث، حذف)
DROP POLICY IF EXISTS "Allow public read on vaults" ON public.vaults;
CREATE POLICY "Allow public read on vaults"
ON public.vaults FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow public insert on vaults" ON public.vaults;
CREATE POLICY "Allow public insert on vaults"
ON public.vaults FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on vaults" ON public.vaults;
CREATE POLICY "Allow public update on vaults"
ON public.vaults FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Allow public delete on vaults" ON public.vaults;
CREATE POLICY "Allow public delete on vaults"
ON public.vaults FOR DELETE
USING (true);

-- 5. تفعيل المزامنة اللحظية (Supabase Realtime) لتنبيه الأجهزة فوراً عند فتح الرابط أو النقر على موافق
ALTER PUBLICATION supabase_realtime ADD TABLE public.vaults;

-- تم الإعداد بنجاح!
