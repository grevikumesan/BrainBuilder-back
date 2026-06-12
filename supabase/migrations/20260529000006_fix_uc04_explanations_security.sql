-- Drop the insecure old policy
DROP POLICY IF EXISTS "explanations_student_read_approved" ON explanations;

-- Create a secure, context-aware policy matching UC-04 Pre-conditions
CREATE POLICY "explanations_student_read_secure" ON explanations
	FOR SELECT USING (
		-- Rule 1: Must be a student
		(SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
		
		-- Rule 2: The course must be officially approved
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
		
		-- Rule 3: Enforce UC-04 Pre-condition (Must have completed a quiz submission first)
		AND EXISTS (
			SELECT 1 FROM submissions s
			WHERE s.user_id = auth.uid()
			AND s.quiz_id = (SELECT quiz_id FROM questions WHERE id = explanations.question_id)
		)
		
		-- Rule 4: Enforce Premium Paywall verification
		AND (
			NOT (
				SELECT is_premium FROM lessons 
				WHERE id = (
					SELECT lesson_id FROM quizzes 
					WHERE id = (SELECT quiz_id FROM questions WHERE id = explanations.question_id)
				)
			)
			OR EXISTS (
				SELECT 1 FROM subscriptions 
				WHERE user_id = auth.uid() AND status = 'ACTIVE'
			)
		)
	);

-- Optimize explanation queries to keep processing times below target metrics
CREATE INDEX IF NOT EXISTS idx_explanations_question_id ON explanations (question_id);