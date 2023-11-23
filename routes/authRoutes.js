// routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const {check, validationResult} = require('express-validator');
const router = express.Router();

// Generate JWT token for authentication
const generateAuthToken = (user) => {
    return jwt.sign({_id: user._id.toString()}, 'yourSecretKey', {expiresIn: '1h'});
};

// User Registration
router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('username', 'Username is required').not().isEmpty(),
    check('password', 'Password is required').not().isEmpty()
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    try {
        const username = req.body.username;
        console.log(username);
        // Check if the username already exists
        const existingUser = await User.findOne({username});
        if (existingUser) {
            return res.status(400).send({error: 'Username already exists'});
        }

        const user = new User({
            name: req.body.name,
            username: req.body.username,
            password: req.body.password,
        });
        await user.save();
        const token = generateAuthToken(user);
        res.status(201).send({user, token});
    } catch (error) {
        res.status(400).send(error);
    }
});

// User Login
router.post('/login', [
    check('username', 'Username is required').not().isEmpty(),
    check('password', 'Password is required').not().isEmpty()
], async (req, res) => {
    try {
        const {username, password} = req.body;
        const user = await User.findOne({username});

        if (!user) {
            return res.status(401).send({error: 'Invalid credentials'});
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.status(401).send({error: 'Invalid credentials'});
        }

        const token = generateAuthToken(user);
        res.send({user, token});
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = router;
