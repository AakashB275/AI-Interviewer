import express from 'express';
import { createContact } from '../controllers/contactController.js';

const router = express.Router();

router.get("/", (req, res) => {
    res.send("hey");
});

router.post("/submit", createContact);

export default router;