--ENUM types
CREATE TYPE subject AS ENUM ('MATHEMATICS', 'PHYSICS', 'CHEMISTRY');
CREATE TYPE grade AS ENUM ('X', 'XI', 'XII');
CREATE TYPE course_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');
CREATE TYPE question_type AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER');

--courses table
CREATE TABLE courses (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	title TEXT NOT NULL,
	description TEXT,
	subject subject NOT NULL,
	grade grade NOT NULL,
	status course_status NOT NULL DEFAULT 'DRAFT',
	rejection_reason TEXT,
	created_at TIMESTAMPTZ DEFAULT now()
);

--lessons table
CREATE TABLE lessons (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
	title TEXT NOT NULL,
	video_url TEXT,
	rich_text_content TEXT,
	summary TEXT,
	is_premium BOOLEAN NOT NULL DEFAULT false,
	order INT NOT NULL DEFAULT 0,
	created_at TIMESTAMPTZ DEFAULT now()
);

--quizzes table
CREATE TABLE quizzes (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ DEFAULT now()
);

--questions table
CREATE TABLE questions (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
	type question_type NOT NULL,
	prompt TEXT NOT NULL,
	options JSONB,
	correct_answer TEXT NOT NULL,
	created_at TIMESTAMPTZ DEFAULT now()
);

--explanations table
CREATE TABLE explanations (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
	steps JSONB NOT NULL,
	created_at TIMESTAMPTZ DEFAULT now()
);

--RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE explanations ENABLE ROW LEVEL SECURITY;

--courses: student can only read approved courses, teachers/admins can read all
CREATE POLICY "courses_student_read_approved" ON courses
	FOR SELECT USING (
		status = 'APPROVED' OR
		(SELECT role FROM users WHERE id = auth.uid()) IN ('TEACHER', 'ADMIN')
	);

--courses: teachers can only insert courses, and can only update their own courses
CREATE POLICY "courses_teacher_insert" ON courses
	FOR INSERT WITH CHECK (
		(SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
	);

CREATE POLICY "courses_teacher_update_own" ON courses
	FOR UPDATE USING (
		teacher_id = auth.uid() AND
		(SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
	);

--lessons: follows course status
CREATE POLICY "lessons_read_approved_course" ON lessons
	FOR SELECT USING (
		(SELECT status FROM courses WHERE id = course_id) = 'APPROVED' OR
		(SELECT role FROM users WHERE id = auth.uid()) IN ('TEACHER', 'ADMIN')
	);

CREATE POLICY "lessons_teacher_insert" ON lessons
	FOR INSERT WITH CHECK (
		(SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
	);

CREATE POLICY "lessons_teacher_update_own" ON lessons
	FOR UPDATE USING (
		(SELECT teacher_id FROM courses WHERE id = course_id) = auth.uid()
	);

--quizzes, questions, explanations: follows lessons status
CREATE POLICY "quizzes_read" ON quizzes
	FOR SELECT USING (true);

CREATE POLICY "quizzes_teacher_insert" ON quizzes
	FOR INSERT WITH CHECK (
		(SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
	);

CREATE POLICY "questions_read" ON questions
	FOR SELECT USING (true);

CREATE POLICY "questions_teacher_insert" ON questions
	FOR INSERT WITH CHECK (
		(SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
	);

CREATE POLICY "explanations_read" ON explanations
	FOR SELECT USING (true);

CREATE POLICY "explanations_teacher_insert" ON explanations
	FOR INSERT WITH CHECK (
		(SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
	);