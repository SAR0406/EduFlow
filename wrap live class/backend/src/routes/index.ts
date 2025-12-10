import express from 'express';
import * as authController from '../controllers/authController';
import * as classController from '../controllers/classController';
import { authenticate, requireInstructor } from '../middleware/auth';
import { validateRequest, registerSchema, loginSchema, createClassSchema, updateClassSchema, createScheduleSchema, updateScheduleSchema } from '../middleware/validation';

const router = express.Router();

// Auth routes
router.post('/auth/register', validateRequest(registerSchema), authController.register);
router.post('/auth/login', validateRequest(loginSchema), authController.login);
router.post('/auth/refresh', authController.refresh);
router.get('/users/me', authenticate, authController.getProfile);
router.put('/users/me', authenticate, authController.updateProfile);

// Class routes
router.post('/classes', authenticate, requireInstructor, validateRequest(createClassSchema), classController.createClass);
router.get('/classes', authenticate, classController.getClasses);
router.get('/classes/:id', authenticate, classController.getClass);
router.put('/classes/:id', authenticate, requireInstructor, validateRequest(updateClassSchema), classController.updateClass);
router.delete('/classes/:id', authenticate, requireInstructor, classController.deleteClass);

// Enrollment routes
router.post('/classes/:id/enroll', authenticate, classController.enrollInClass);
router.delete('/classes/:id/enroll', authenticate, classController.unenrollFromClass);
router.get('/classes/:id/students', authenticate, classController.getEnrolledStudents);
router.delete('/classes/:id/students/:userId', authenticate, requireInstructor, classController.removeStudent);

// Schedule routes
router.post('/classes/:id/schedules', authenticate, requireInstructor, validateRequest(createScheduleSchema), classController.createSchedule);
router.get('/classes/:id/schedules', authenticate, classController.getSchedules);
router.put('/schedules/:id', authenticate, requireInstructor, validateRequest(updateScheduleSchema), classController.updateSchedule);
router.delete('/schedules/:id', authenticate, requireInstructor, classController.deleteSchedule);

export default router;
