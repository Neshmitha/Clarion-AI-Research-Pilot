const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    console.log(`Login attempt for email: ${req.body.email}`);
    const start = Date.now();
    try {
        const { email, password } = req.body;
        console.log('Searching for user...');
        const user = await User.findOne({ email });
        console.log(`User search took ${Date.now() - start}ms`);

        if (!user) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('Comparing passwords...');
        const matchStart = Date.now();
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`Password comparison took ${Date.now() - matchStart}ms`);

        if (!isMatch) {
            console.log('Invalid credentials');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log('Generating token...');
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Login successful');
        res.json({
            token, user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName || '',
                role: user.role || '',
                bio: user.bio || '',
                researchInterests: user.researchInterests || ''
            }
        });
    } catch (err) {
        console.error('Login error details:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update Password
router.post('/update-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Update password error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update Profile
router.post('/update-profile', async (req, res) => {
    try {
        const { userId, fullName, role, bio, researchInterests } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (fullName !== undefined) user.fullName = fullName;
        if (role !== undefined) user.role = role;
        if (bio !== undefined) user.bio = bio;
        if (researchInterests !== undefined) user.researchInterests = researchInterests;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                bio: user.bio,
                researchInterests: user.researchInterests
            }
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── Delete Account ────────────────────────────────
const Paper = require('../models/Paper');
const Contribution = require('../models/Contribution');
const GuideProgress = require('../models/GuideProgress');

router.delete('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`[AUTH] Deleting account for user: ${userId}`);

        // 1. Delete associated data first
        console.log(`[AUTH] Removing papers...`);
        const paperRes = await Paper.deleteMany({ userId });
        console.log(`[AUTH] Removed ${paperRes.deletedCount} papers.`);

        console.log(`[AUTH] Removing contributions...`);
        const contribRes = await Contribution.deleteMany({ author: userId });
        console.log(`[AUTH] Removed ${contribRes.deletedCount} contributions.`);

        console.log(`[AUTH] Removing guide progress...`);
        const guideRes = await GuideProgress.deleteMany({ userId });
        console.log(`[AUTH] Removed ${guideRes.deletedCount} guide entries.`);

        // 2. Finally delete the user
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            console.log(`[AUTH] User not found: ${userId}`);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(`[AUTH] Account ${userId} deleted successfully.`);
        res.json({ message: 'Account and all associated research data deleted successfully' });
    } catch (err) {
        console.error('Delete account error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
