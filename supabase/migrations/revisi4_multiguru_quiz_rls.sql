-- ============================================================
-- REVISI 4: MULTI-GURU SYSTEM & QUIZ ACCESS
-- ============================================================

-- 0. PASTIKAN TABEL KUIS & PERCOBAAN (ATTEMPTS) ADA
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  xp_reward INTEGER DEFAULT 100,
  time_limit_seconds INTEGER DEFAULT 600,
  kkm INTEGER DEFAULT 70,
  max_attempts INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_completed BOOLEAN DEFAULT true,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1. PASTIKAN RLS AKTIF
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;

-- 2. QUIZZES RLS
-- Semua yang terautentikasi bisa melihat kuis
CREATE POLICY "Enable read access for authenticated users on quizzes"
  ON quizzes FOR SELECT
  USING (auth.role() = 'authenticated');

-- Hanya admin, creator kelas, dan guru tambahan (class_teachers) yang bisa CRUD kuis
CREATE POLICY "Enable all access for admin and authorized teachers on quizzes"
  ON quizzes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = quizzes.class_id AND classes.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM class_teachers 
      WHERE class_teachers.class_id = quizzes.class_id AND class_teachers.user_id = auth.uid()
    )
  );

-- 3. QUIZ_QUESTIONS RLS
CREATE POLICY "Enable read access for authenticated users on quiz_questions"
  ON quiz_questions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for admin and authorized teachers on quiz_questions"
  ON quiz_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN classes ON classes.id = quizzes.class_id
      WHERE quizzes.id = quiz_questions.quiz_id AND (
        classes.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM class_teachers WHERE class_teachers.class_id = quizzes.class_id AND class_teachers.user_id = auth.uid()
        )
      )
    )
  );

-- 4. CLASS_TEACHERS RLS
CREATE POLICY "Enable read access for authenticated users on class_teachers"
  ON class_teachers FOR SELECT
  USING (auth.role() = 'authenticated');

-- Hanya admin atau pembuat kelas (creator) yang bisa kelola class_teachers
CREATE POLICY "Enable all access for admin and class creator on class_teachers"
  ON class_teachers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_teachers.class_id AND classes.created_by = auth.uid()
    )
  );

-- 5. MATERIALS & ASSIGNMENTS RLS (UPDATE UNTUK MENDUKUNG CLASS_TEACHERS)
-- Mengganti/menambahkan kebijakan sebelumnya agar co-teacher bisa mengelola materi dan tugas
DROP POLICY IF EXISTS "Enable all access for guru and admin on materials" ON materials;
CREATE POLICY "Enable all access for guru and admin on materials"
  ON materials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('guru', 'admin')
    ) AND (
      EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      ) OR
      EXISTS (
        SELECT 1 FROM classes WHERE classes.id = materials.class_id AND classes.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM class_teachers WHERE class_teachers.class_id = materials.class_id AND class_teachers.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Enable all access for guru and admin on assignments" ON assignments;
CREATE POLICY "Enable all access for guru and admin on assignments"
  ON assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('guru', 'admin')
    ) AND (
      EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      ) OR
      EXISTS (
        SELECT 1 FROM classes WHERE classes.id = assignments.class_id AND classes.created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM class_teachers WHERE class_teachers.class_id = assignments.class_id AND class_teachers.user_id = auth.uid()
      )
    )
  );

-- 6. QUIZ_ATTEMPTS RLS
CREATE POLICY "Enable read access for user's own attempts and admin/teachers"
  ON quiz_attempts FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('guru', 'admin')
    )
  );

CREATE POLICY "Enable insert access for authenticated users"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());
