// routes/taskRoutes.js
const express = require('express');
const Task = require('../models/task');
const authMiddleware = require('../middleware/authMiddleware');

const { check, validationResult } = require('express-validator');
const router = express.Router();
router.post('/',
    authMiddleware,
    [
        check('title', 'Title is required').not().isEmpty(),
        check('description', 'Description must be a string').optional().isString(),
        check('completed', 'Completed must be a boolean').optional().isBoolean(),
        check('priority', 'Priority must be one of Low, Medium, High').isIn(['Low', 'Medium', 'High']),
    ], async (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const task = new Task({
                ...req.body,
                createdBy: req.user._id, // Assign the ID of the logged-in user
            });
            await task.save();
            res.status(201).send(task);
        } catch (error) {
            res.status(400).send(error);
        }
    }
);

// Read All Tasks
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page ?? 1);
        const limit = parseInt(req.query.limit ?? 10);
        const skip = (page - 1) * limit;
        const sortColumn = req.query.sortColumn ?? '_id';
        const sortOrder = req.query.sortOrder ?? 'asc';
        const sort = {};
        sort[sortColumn] = sortOrder;

        // get all tasks paginated from the database and populate the createdBy field with the name and email of the user
        const tasks = await Task.find()
            .populate('createdBy', '_id name email phone')
            .sort({ [sortColumn]: sortOrder })
            .skip(skip)
            .limit(limit)
            // .sort(req.query.sortBy??'createdAt:desc')
            .exec();
        res.send(tasks);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Read Task by ID
router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate('createdBy', 'name username').exec();
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Update Task by ID
router.put('/:id',
    authMiddleware,
    [
        check('title', 'Title is required').not().isEmpty(),
        check('description', 'Description must be a string').optional().isString(),
        check('completed', 'Completed must be a boolean').optional().isBoolean(),
        check('priority', 'Priority must be one of Low, Medium, High').isIn(['Low', 'Medium', 'High']),
    ], async (req, res) => {

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const updates = Object.keys(req.body);
        const allowedUpdates = ['title', 'description', 'completed', 'priority'];
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).send({ error: 'Invalid updates!' });
        }

        try {
            const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
            if (!task) {
                return res.status(404).send();
            }
            res.status(200).send(task);
        } catch (error) {
            res.status(400).send(error);
        }
    });

// Delete Task by ID
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/:id/toggle-completed', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        task.completed = !task.completed;
        await task.save();
        res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
