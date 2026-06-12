-- ============================================================
-- ENUM types
-- ============================================================
CREATE TYPE subject AS ENUM ('MATHEMATICS', 'PHYSICS', 'CHEMISTRY');
CREATE TYPE grade AS ENUM ('X', 'XI', 'XII');
CREATE TYPE course_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');
CREATE TYPE question_type AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER');

-- ============================================================
-- courses table
-- ============================================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subject subject NOT NULL,
    grade grade NOT NULL,
    status course_status NOT NULL DEFAULT 'DRAFT',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- lessons table
-- ============================================================
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT,
    rich_text_content TEXT,
    summary TEXT,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    lesson_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- quizzes table
-- ============================================================
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- questions table
-- ============================================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    type question_type NOT NULL,
    prompt TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- explanations table
-- ============================================================
CREATE TABLE explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
    steps JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- submissions table
-- ============================================================
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    per_question_correctness JSONB NOT NULL,
    score NUMERIC(5, 2) NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- enrollments table
-- ============================================================
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
    completed_lessons INT NOT NULL DEFAULT 0,
    total_lessons INT NOT NULL DEFAULT 0,
    UNIQUE (user_id, course_id)
);

-- ============================================================
-- indexes
-- ============================================================
CREATE INDEX idx_courses_subject_grade_status ON courses (subject, grade, status);
CREATE INDEX idx_lessons_course_id ON lessons (course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course_order ON lessons (course_id, lesson_order ASC);
CREATE INDEX idx_submissions_user_id ON submissions (user_id);
CREATE INDEX idx_submissions_quiz_id ON submissions (quiz_id);
CREATE INDEX idx_enrollments_user_id ON enrollments (user_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- courses
CREATE POLICY "courses_student_read_approved" ON courses
    FOR SELECT USING (
        status = 'APPROVED'
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
    );

CREATE POLICY "courses_teacher_read_own" ON courses
    FOR SELECT USING (
        teacher_id = auth.uid()
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
    );

CREATE POLICY "courses_teacher_insert" ON courses
    FOR INSERT WITH CHECK (
        teacher_id = auth.uid()
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
    );

CREATE POLICY "courses_teacher_update_own" ON courses
    FOR UPDATE USING (
        teacher_id = auth.uid()
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
    );

CREATE POLICY "courses_admin_read_all" ON courses
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
    );

CREATE POLICY "courses_admin_update_all" ON courses
    FOR UPDATE USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
    );

-- lessons
CREATE POLICY "lessons_student_read_approved" ON lessons
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
        AND (SELECT status FROM courses WHERE id = course_id) = 'APPROVED'
    );

CREATE POLICY "lessons_teacher_read_own" ON lessons
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
        AND (SELECT teacher_id FROM courses WHERE id = course_id) = auth.uid()
    );

CREATE POLICY "lessons_teacher_insert" ON lessons
    FOR INSERT WITH CHECK (
        (SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
        AND (SELECT teacher_id FROM courses WHERE id = course_id) = auth.uid()
    );

CREATE POLICY "lessons_teacher_update_own" ON lessons
    FOR UPDATE USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
        AND (SELECT teacher_id FROM courses WHERE id = course_id) = auth.uid()
    );

CREATE POLICY "lessons_admin_read_all" ON lessons
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
    );

-- quizzes
CREATE POLICY "quizzes_student_read_approved" ON quizzes
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
        AND (
            SELECT status FROM courses
            WHERE id = (SELECT course_id FROM lessons WHERE id = quizzes.lesson_id)
        ) = 'APPROVED'
    );

CREATE POLICY "quizzes_teacher_read_own" ON quizzes
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
        AND (
            SELECT teacher_id FROM courses
            WHERE id = (SELECT course_id FROM lessons WHERE id = quizzes.lesson_id)
        ) = auth.uid()
    );

CREATE POLICY "quizzes_teacher_insert" ON quizzes
    FOR INSERT WITH CHECK (
        (SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
        AND (
            SELECT teacher_id FROM courses
            WHERE id = (SELECT course_id FROM lessons WHERE id = quizzes.lesson_id)
        ) = auth.uid()
    );

CREATE POLICY "quizzes_admin_read_all" ON quizzes
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
    );

-- questions
CREATE POLICY "questions_student_read_approved" ON questions
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
        AND (
            SELECT status FROM courses
            WHERE id = (
                SELECT course_id FROM lessons
                WHERE id = (SELECT lesson_id FROM quizzes WHERE id = questions.quiz_id)
            )
        ) = 'APPROVED'
    );

CREATE POLICY "questions_teacher_read_own" ON questions
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
        AND (
            SELECT teacher_id FROM courses
            WHERE id = (
                SELECT course_id FROM lessons
                WHERE id = (SELECT lesson_id FROM quizzes WHERE id = questions.quiz_id)
            )
        ) = auth.uid()
    );

CREATE POLICY "questions_teacher_insert" ON questions
    FOR INSERT WITH CHECK (
        (SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
        AND (
            SELECT teacher_id FROM courses
            WHERE id = (
                SELECT course_id FROM lessons
                WHERE id = (SELECT lesson_id FROM quizzes WHERE id = questions.quiz_id)
            )
        ) = auth.uid()
    );

CREATE POLICY "questions_admin_read_all" ON questions
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
    );

-- explanations
CREATE POLICY "explanations_student_read_approved" ON explanations
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
        AND (
            SELECT status FROM courses
            WHERE id = (
                SELECT course_id FROM lessons
                WHERE id = (
                    SELECT lesson_id FROM quizzes
                    WHERE id = (SELECT quiz_id FROM questions WHERE id = explanations.question_id)
                )
            )
        ) = 'APPROVED'
    );

CREATE POLICY "explanations_teacher_read_own" ON explanations
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
        AND (
            SELECT teacher_id FROM courses
            WHERE id = (
                SELECT course_id FROM lessons
                WHERE id = (
                    SELECT lesson_id FROM quizzes
                    WHERE id = (SELECT quiz_id FROM questions WHERE id = explanations.question_id)
                )
            )
        ) = auth.uid()
    );

CREATE POLICY "explanations_teacher_insert" ON explanations
    FOR INSERT WITH CHECK (
        (SELECT role FROM users WHERE id = auth.uid()) = 'TEACHER'
        AND (
            SELECT teacher_id FROM courses
            WHERE id = (
                SELECT course_id FROM lessons
                WHERE id = (
                    SELECT lesson_id FROM quizzes
                    WHERE id = (SELECT quiz_id FROM questions WHERE id = explanations.question_id)
                )
            )
        ) = auth.uid()
    );

CREATE POLICY "explanations_admin_read_all" ON explanations
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
    );

-- submissions
CREATE POLICY "submissions_student_read_own" ON submissions
    FOR SELECT USING (
        user_id = auth.uid()
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
    );

CREATE POLICY "submissions_student_insert_own" ON submissions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
    );

CREATE POLICY "submissions_admin_read_all" ON submissions
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
    );

-- enrollments
CREATE POLICY "enrollments_student_read_own" ON enrollments
    FOR SELECT USING (
        user_id = auth.uid()
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
    );

CREATE POLICY "enrollments_student_insert_own" ON enrollments
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
    );

CREATE POLICY "enrollments_student_update_own" ON enrollments
    FOR UPDATE USING (
        user_id = auth.uid()
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
    );

CREATE POLICY "enrollments_admin_read_all" ON enrollments
    FOR SELECT USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
    );
