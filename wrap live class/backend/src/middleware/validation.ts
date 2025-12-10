import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({ errors });
    }
    
    next();
  };
};

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  full_name: Joi.string().min(2).max(255).required(),
  role: Joi.string().valid('instructor', 'student').required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const createClassSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().allow(''),
  max_students: Joi.number().integer().min(1).max(500).default(100),
});

export const updateClassSchema = Joi.object({
  title: Joi.string().min(3).max(255),
  description: Joi.string().allow(''),
  max_students: Joi.number().integer().min(1).max(500),
});

export const createScheduleSchema = Joi.object({
  start_time: Joi.date().iso().required(),
  end_time: Joi.date().iso().greater(Joi.ref('start_time')).required(),
});

export const updateScheduleSchema = Joi.object({
  start_time: Joi.date().iso(),
  end_time: Joi.date().iso(),
  status: Joi.string().valid('scheduled', 'ongoing', 'completed', 'cancelled'),
});
