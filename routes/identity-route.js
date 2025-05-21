import express from 'express';
import { identityController } from '../controllers/identity-controller.js';

const router=express.Router();

router.post("/",identityController);

export default router;