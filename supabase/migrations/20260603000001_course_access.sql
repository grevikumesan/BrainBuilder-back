-- ENUM types for courses
CREATE TYPE subject_type AS ENUM ('MATH', 'PHYSICS', 'CHEMISTRY');
CREATE TYPE grade_type AS ENUM ('X', 'XI', 'XII');
CREATE TYPE course_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- courses table
CREATE TABLE courses (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	subject subject_type NOT NULL,
	grade grade_type NOT NULL,
	title TEXT NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	status course_status NOT NULL DEFAULT 'DRAFT',
	rejection_reason TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- lessons table
CREATE TABLE lessons (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
	title TEXT NOT NULL,
	video_url TEXT NOT NULL DEFAULT '',
	rich_text_content TEXT NOT NULL DEFAULT '',
	summary TEXT NOT NULL DEFAULT '',
	is_premium BOOLEAN NOT NULL DEFAULT false,
	"order" INT NOT NULL DEFAULT 0,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- quizzes table (summary only; questions are UC-03 scope)
CREATE TABLE quizzes (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
	status TEXT NOT NULL DEFAULT 'ACTIVE',
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- plans table (referenced by subscriptions)
CREATE TABLE plans (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name TEXT NOT NULL,
	price NUMERIC(12, 2) NOT NULL,
	duration_days INT NOT NULL
);

-- subscriptions table
CREATE TABLE subscriptions (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	plan_id UUID NOT NULL REFERENCES plans(id),
	status subscription_status NOT NULL DEFAULT 'INACTIVE',
	start_date TIMESTAMPTZ,
	expiry_date TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- enrollments table (tracks which courses a student has opened)
CREATE TABLE enrollments (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
	enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	completed_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
	total_score INT NOT NULL DEFAULT 0,
	UNIQUE (user_id, course_id)
);

-- lesson_views table (idempotent per-lesson view tracking)
CREATE TABLE lesson_views (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
	viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	UNIQUE (user_id, lesson_id)
);

-- ==================== INDEXES ====================
CREATE INDEX idx_courses_subject_grade_status ON courses (subject, grade, status);
CREATE INDEX idx_lessons_course_id ON lessons (course_id);
CREATE INDEX idx_enrollments_user_id ON enrollments (user_id);
CREATE INDEX idx_lesson_views_user_id ON lesson_views (user_id);
CREATE INDEX idx_subscriptions_user_id_status ON subscriptions (user_id, status);

-- ==================== ROW LEVEL SECURITY ====================

-- courses RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Students can only see approved courses
CREATE POLICY "courses_student_read_approved" ON courses
	FOR SELECT USING (
		status = 'APPROVED'
		AND (SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
	);

-- Teachers can see all their own courses (any status)
CREATE POLICY "courses_teacher_read_own" ON courses
	FOR SELECT USING (
		teacher_id = auth.uid()
		AND (SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
	);

-- Teachers can insert their own courses
CREATE POLICY "courses_teacher_insert" ON courses
	FOR INSERT WITH CHECK (
		teacher_id = auth.uid()
		AND (SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
	);

-- Teachers can update their own non-approved courses
CREATE POLICY "courses_teacher_update_own" ON courses
	FOR UPDATE USING (
		teacher_id = auth.uid()
		AND (SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
	);

-- Admin can see all courses
CREATE POLICY "courses_admin_read_all" ON courses
	FOR SELECT USING (
		(SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
	);

-- Admin can update course status (approve/reject)
CREATE POLICY "courses_admin_update_status" ON courses
	FOR UPDATE USING (
		(SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
	);

-- lessons RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Students can read lessons whose parent course is approved
CREATE POLICY "lessons_student_read_approved" ON lessons
	FOR SELECT USING (
		(SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
		AND (
			SELECT status FROM courses WHERE id = course_id
		) = 'APPROVED'
	);

-- Teachers can read/write lessons on their own courses
CREATE POLICY "lessons_teacher_read_own" ON lessons
	FOR SELECT USING (
		(SELECT teacher_id FROM courses WHERE id = course_id) = auth.uid()
	);

CREATE POLICY "lessons_teacher_insert" ON lessons
	FOR INSERT WITH CHECK (
		(SELECT teacher_id FROM courses WHERE id = course_id) = auth.uid()
	);

CREATE POLICY "lessons_teacher_update_own" ON lessons
	FOR UPDATE USING (
		(SELECT teacher_id FROM courses WHERE id = course_id) = auth.uid()
	);

-- quizzes RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quizzes_student_read" ON quizzes
	FOR SELECT USING (
		(SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
	);

CREATE POLICY "quizzes_teacher_manage" ON quizzes
	FOR ALL USING (
		(SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
	);

-- subscriptions RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_read_own" ON subscriptions
	FOR SELECT USING (user_id = auth.uid());

-- enrollments RLS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_read_own" ON enrollments
	FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "enrollments_upsert_own" ON enrollments
	FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "enrollments_update_own" ON enrollments
	FOR UPDATE USING (user_id = auth.uid());

-- lesson_views RLS
ALTER TABLE lesson_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lesson_views_read_own" ON lesson_views
	FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "lesson_views_upsert_own" ON lesson_views
	FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "lesson_views_update_own" ON lesson_views
	FOR UPDATE USING (user_id = auth.uid());