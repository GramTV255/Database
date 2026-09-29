import { Router } from 'express';
import { getUsers, deleteUser } from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Njia zote hapa chini zinalindwa na zinahitaji ruhusa ya 'admin' pekee
router.use(protect);
router.use(authorize('admin'));

router.route('/').get(getUsers);
router.route('/:id').delete(deleteUser);

export default router;
