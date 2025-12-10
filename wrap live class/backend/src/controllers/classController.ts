import { Response } from 'express';
import { query } from '../database/connection';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export const createClass = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, max_students = 100 } = req.body;
    const instructorId = req.user?.userId;
    
    const result = await query(
      'INSERT INTO classes (title, description, instructor_id, max_students) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, instructorId, max_students]
    );
    
    res.status(201).json({ class: result.rows[0] });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getClasses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    
    let result;
    
    if (role === 'instructor') {
      // Instructors see their own classes
      result = await query(
        `SELECT c.*, u.full_name as instructor_name, 
         (SELECT COUNT(*) FROM enrollments WHERE class_id = c.id) as enrolled_count
         FROM classes c
         JOIN users u ON c.instructor_id = u.id
         WHERE c.instructor_id = $1
         ORDER BY c.created_at DESC`,
        [userId]
      );
    } else {
      // Students see all classes and their enrollment status
      result = await query(
        `SELECT c.*, u.full_name as instructor_name,
         (SELECT COUNT(*) FROM enrollments WHERE class_id = c.id) as enrolled_count,
         EXISTS(SELECT 1 FROM enrollments WHERE class_id = c.id AND student_id = $1) as is_enrolled
         FROM classes c
         JOIN users u ON c.instructor_id = u.id
         ORDER BY c.created_at DESC`,
        [userId]
      );
    }
    
    res.json({ classes: result.rows });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    const result = await query(
      `SELECT c.*, u.full_name as instructor_name,
       (SELECT COUNT(*) FROM enrollments WHERE class_id = c.id) as enrolled_count,
       EXISTS(SELECT 1 FROM enrollments WHERE class_id = c.id AND student_id = $1) as is_enrolled
       FROM classes c
       JOIN users u ON c.instructor_id = u.id
       WHERE c.id = $2`,
      [userId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    res.json({ class: result.rows[0] });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, max_students } = req.body;
    const instructorId = req.user?.userId;
    
    // Verify ownership
    const classCheck = await query('SELECT instructor_id FROM classes WHERE id = $1', [id]);
    
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (classCheck.rows[0].instructor_id !== instructorId) {
      return res.status(403).json({ error: 'Forbidden: Not your class' });
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (max_students !== undefined) {
      updates.push(`max_students = $${paramCount++}`);
      values.push(max_students);
    }
    
    values.push(id);
    
    const result = await query(
      `UPDATE classes SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    res.json({ class: result.rows[0] });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const instructorId = req.user?.userId;
    
    // Verify ownership
    const classCheck = await query('SELECT instructor_id FROM classes WHERE id = $1', [id]);
    
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (classCheck.rows[0].instructor_id !== instructorId) {
      return res.status(403).json({ error: 'Forbidden: Not your class' });
    }
    
    await query('DELETE FROM classes WHERE id = $1', [id]);
    
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const enrollInClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = req.user?.userId;
    
    // Check if class exists and has space
    const classResult = await query(
      `SELECT max_students, 
       (SELECT COUNT(*) FROM enrollments WHERE class_id = $1) as enrolled_count
       FROM classes WHERE id = $1`,
      [id]
    );
    
    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    const classData = classResult.rows[0];
    if (classData.enrolled_count >= classData.max_students) {
      return res.status(400).json({ error: 'Class is full' });
    }
    
    // Check if already enrolled
    const enrollCheck = await query(
      'SELECT id FROM enrollments WHERE student_id = $1 AND class_id = $2',
      [studentId, id]
    );
    
    if (enrollCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this class' });
    }
    
    // Enroll
    await query(
      'INSERT INTO enrollments (student_id, class_id) VALUES ($1, $2)',
      [studentId, id]
    );
    
    res.status(201).json({ message: 'Enrolled successfully' });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unenrollFromClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = req.user?.userId;
    
    const result = await query(
      'DELETE FROM enrollments WHERE student_id = $1 AND class_id = $2',
      [studentId, id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    
    res.json({ message: 'Unenrolled successfully' });
  } catch (error) {
    console.error('Unenroll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEnrolledStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT u.id, u.email, u.full_name, e.enrolled_at
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.class_id = $1
       ORDER BY e.enrolled_at DESC`,
      [id]
    );
    
    res.json({ students: result.rows });
  } catch (error) {
    console.error('Get enrolled students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id, userId } = req.params;
    const instructorId = req.user?.userId;
    
    // Verify ownership
    const classCheck = await query('SELECT instructor_id FROM classes WHERE id = $1', [id]);
    
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (classCheck.rows[0].instructor_id !== instructorId) {
      return res.status(403).json({ error: 'Forbidden: Not your class' });
    }
    
    const result = await query(
      'DELETE FROM enrollments WHERE student_id = $1 AND class_id = $2',
      [userId, id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Student not enrolled in this class' });
    }
    
    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Schedule management
export const createSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { start_time, end_time } = req.body;
    const instructorId = req.user?.userId;
    
    // Verify ownership
    const classCheck = await query('SELECT instructor_id FROM classes WHERE id = $1', [id]);
    
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (classCheck.rows[0].instructor_id !== instructorId) {
      return res.status(403).json({ error: 'Forbidden: Not your class' });
    }
    
    const meetingRoomId = uuidv4();
    
    const result = await query(
      'INSERT INTO class_schedules (class_id, start_time, end_time, meeting_room_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, start_time, end_time, meetingRoomId]
    );
    
    res.status(201).json({ schedule: result.rows[0] });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSchedules = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM class_schedules WHERE class_id = $1 ORDER BY start_time ASC',
      [id]
    );
    
    res.json({ schedules: result.rows });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, status } = req.body;
    const instructorId = req.user?.userId;
    
    // Verify ownership
    const scheduleCheck = await query(
      `SELECT cs.id, c.instructor_id
       FROM class_schedules cs
       JOIN classes c ON cs.class_id = c.id
       WHERE cs.id = $1`,
      [id]
    );
    
    if (scheduleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    if (scheduleCheck.rows[0].instructor_id !== instructorId) {
      return res.status(403).json({ error: 'Forbidden: Not your schedule' });
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (start_time !== undefined) {
      updates.push(`start_time = $${paramCount++}`);
      values.push(start_time);
    }
    if (end_time !== undefined) {
      updates.push(`end_time = $${paramCount++}`);
      values.push(end_time);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    
    values.push(id);
    
    const result = await query(
      `UPDATE class_schedules SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    res.json({ schedule: result.rows[0] });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const instructorId = req.user?.userId;
    
    // Verify ownership
    const scheduleCheck = await query(
      `SELECT cs.id, c.instructor_id
       FROM class_schedules cs
       JOIN classes c ON cs.class_id = c.id
       WHERE cs.id = $1`,
      [id]
    );
    
    if (scheduleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    if (scheduleCheck.rows[0].instructor_id !== instructorId) {
      return res.status(403).json({ error: 'Forbidden: Not your schedule' });
    }
    
    await query('DELETE FROM class_schedules WHERE id = $1', [id]);
    
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
