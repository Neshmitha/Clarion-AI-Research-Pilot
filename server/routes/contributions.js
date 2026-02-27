const express = require('express');
const router = express.Router();
const Contribution = require('../models/Contribution');
const User = require('../models/User');

// POST /api/contributions - Create a new contribution
router.post('/', async (req, res) => {
    try {
        const { userId, title, domain, type, description, researchPaperFile, tags, issues } = req.body;

        if (!userId) return res.status(401).json({ message: 'User ID is required' });

        if (issues && issues.length > 0) {
            for (let i = 0; i < issues.length; i++) {
                if (!issues[i].questions || issues[i].questions.length !== 3) {
                    return res.status(400).json({ message: 'Each issue must have exactly 3 questions.' });
                }
            }
        }

        const newContribution = new Contribution({
            author: userId,
            title,
            domain,
            type,
            description,
            researchPaperFile,
            tags: tags || [],
            issues: issues || [],
            status: 'active',
            impactScore: Math.floor(Math.random() * 50) + 50,
            aiNoveltyScore: Math.floor(Math.random() * 50) + 50,
        });

        await newContribution.save();
        await newContribution.populate('author', 'username email fullName role bio researchInterests');

        res.status(201).json({ message: 'Contribution created successfully', contribution: newContribution });
    } catch (err) {
        console.error('Create contribution error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/contributions - List all contributions
router.get('/', async (req, res) => {
    try {
        const { domain, type, status, author } = req.query;
        let query = {};

        if (domain) {
            query.$or = [
                { domain: { $regex: domain, $options: 'i' } },
                { title: { $regex: domain, $options: 'i' } }
            ];
        } else {
            // Only filter by status if NOT searching
            if (status) query.status = status;
        }

        if (type) query.type = type;
        if (author) query.author = author;

        const contributions = await Contribution.find(query)
            .populate('author', 'username email fullName role bio researchInterests')
            .sort({ createdAt: -1 });

        res.json(contributions);
    } catch (err) {
        console.error('Fetch contributions error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/contributions/:id - Get detail
router.get('/:id', async (req, res) => {
    try {
        const contribution = await Contribution.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        )
            .populate('author', 'username email fullName role bio researchInterests')
            .populate('responses.responder', 'username email fullName role bio researchInterests averageRating totalRatings completedTasks')
            .populate('contributorsList', 'username email fullName role');

        if (!contribution) return res.status(404).json({ message: 'Contribution not found' });

        res.json(contribution);
    } catch (err) {
        console.error('Fetch contribution detail error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/contributions/:id - Update contribution details
router.put('/:id', async (req, res) => {
    try {
        const { userId, title, domain, type, description, researchPaperFile, tags, issues, status } = req.body;

        const contribution = await Contribution.findById(req.params.id);
        if (!contribution) return res.status(404).json({ message: 'Contribution not found' });

        if (contribution.author.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized: Only author can edit' });
        }

        if (title) contribution.title = title;
        if (domain) contribution.domain = domain;
        if (type) contribution.type = type;
        if (description) contribution.description = description;
        if (researchPaperFile !== undefined) contribution.researchPaperFile = researchPaperFile;
        if (tags) contribution.tags = tags;
        if (status) contribution.status = status;

        if (issues) {
            for (let i = 0; i < issues.length; i++) {
                if (!issues[i].questions || issues[i].questions.length !== 3) {
                    return res.status(400).json({ message: 'Each issue must have exactly 3 questions.' });
                }
            }
            contribution.issues = issues;
        }

        await contribution.save();
        await contribution.populate('author', 'username email fullName role bio researchInterests');
        await contribution.populate('responses.responder', 'username email fullName role bio researchInterests');

        res.json({ message: 'Contribution updated successfully', contribution });
    } catch (err) {
        console.error('Update contribution error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/contributions/:id/issues/:issueId/responses - Initial Response
router.post('/:id/issues/:issueId/responses', async (req, res) => {
    try {
        const { userId, answers } = req.body;

        if (!userId || !answers || answers.length !== 3) {
            return res.status(400).json({ message: 'User ID and exactly 3 answers are required' });
        }

        const contribution = await Contribution.findById(req.params.id);
        if (!contribution) return res.status(404).json({ message: 'Contribution not found' });

        if (!contribution.issues.id(req.params.issueId)) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        if (contribution.author.toString() === userId) {
            return res.status(400).json({ message: 'Cannot respond to your own contribution' });
        }

        contribution.responses.push({
            issueId: req.params.issueId,
            responder: userId,
            answers: answers,
        });

        contribution.impactScore = Math.min(100, contribution.impactScore + 5);

        await contribution.save();
        await contribution.populate('responses.responder', 'username email fullName role bio researchInterests');

        res.status(201).json({ message: 'Response submitted', responses: contribution.responses });
    } catch (err) {
        console.error('Add response error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/contributions/:id/responses/:responseId/status - Simple status update
router.put('/:id/responses/:responseId/status', async (req, res) => {
    try {
        const { userId, status } = req.body;
        const contribution = await Contribution.findById(req.params.id);
        if (!contribution) return res.status(404).json({ message: 'Contribution not found' });

        if (contribution.author.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const response = contribution.responses.id(req.params.responseId);
        if (!response) return res.status(404).json({ message: 'Response not found' });

        response.status = status;
        await contribution.save();
        await contribution.populate([
            { path: 'author', select: 'username email fullName role bio researchInterests' },
            { path: 'responses.responder', select: 'username email fullName role bio researchInterests averageRating totalRatings completedTasks' },
            { path: 'contributorsList', select: 'username email fullName role' }
        ]);
        res.json({ message: `Status updated to ${status}`, contribution });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* --- Task Workflow Routes --- */

// STEP 1: Owner Accepts Pitch (Allows submission)
router.put('/:id/responses/:responseId/accept-pitch', async (req, res) => {
    try {
        const { userId, deadline, optionalInstructions } = req.body;

        const contribution = await Contribution.findById(req.params.id);
        if (contribution.author.toString() !== userId) return res.status(403).json({ message: 'Unauthorized' });

        const response = contribution.responses.id(req.params.responseId);
        if (!response) return res.status(404).json({ message: 'Response not found' });

        response.status = 'accepted';
        response.taskStatus = 'assigned'; // This unlocks the submission button for the contributor
        if (deadline) response.deadline = new Date(deadline);
        response.optionalInstructions = optionalInstructions;
        response.assignedAt = new Date();
        response.assignedBy = userId;

        await contribution.save();
        await contribution.populate([
            { path: 'author', select: 'username email fullName role bio researchInterests' },
            { path: 'responses.responder', select: 'username email fullName role bio researchInterests averageRating totalRatings completedTasks' },
            { path: 'contributorsList', select: 'username email fullName role' }
        ]);
        res.json({ message: 'Pitch accepted. Contributor can now submit solution.', contribution });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// STEP 2: Contributor Submission
router.post('/:id/responses/:responseId/submit-solution', async (req, res) => {
    try {
        const { userId, solutionPDF, solutionDescription } = req.body;
        const contribution = await Contribution.findById(req.params.id);
        const response = contribution.responses.id(req.params.responseId);

        if (response.responder.toString() !== userId) return res.status(403).json({ message: 'Not authorized' });

        // Deadline check
        if (new Date() > new Date(response.deadline)) {
            response.taskStatus = 'overdue';
            await contribution.save();
            return res.status(400).json({ message: 'Deadline passed. Project is overdue.' });
        }

        response.solutionPDF = solutionPDF;
        response.solutionDescription = solutionDescription;
        response.submittedAt = new Date();
        response.submissionStatus = 'submitted';
        response.taskStatus = 'submitted';

        await contribution.save();
        await contribution.populate([
            { path: 'author', select: 'username email fullName role bio researchInterests' },
            { path: 'responses.responder', select: 'username email fullName role bio researchInterests averageRating totalRatings completedTasks' },
            { path: 'contributorsList', select: 'username email fullName role' }
        ]);
        res.json({ message: 'Solution submitted successfully', contribution });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// STEP 4: Final Review
router.put('/:id/responses/:responseId/final-review', async (req, res) => {
    try {
        const { userId, status } = req.body; // 'approved' or 'rejected'
        const contribution = await Contribution.findById(req.params.id);
        if (contribution.author.toString() !== userId) return res.status(403).json({ message: 'Unauthorized' });

        const response = contribution.responses.id(req.params.responseId);
        response.submissionStatus = status;

        if (status === 'approved') {
            response.taskStatus = 'completed';
            // Add to contributors list - robust check
            const alreadyListed = contribution.contributorsList.some(id => id.toString() === response.responder.toString());
            if (!alreadyListed) {
                contribution.contributorsList.push(response.responder);
            }

            // Mark the specific issue as resolved
            const parentIssue = contribution.issues.id(response.issueId);
            if (parentIssue) {
                parentIssue.isResolved = true;
                parentIssue.resolvedBy = response.responder;
            }
        } else if (status === 'rejected') {
            // Revert taskStatus to assigned to allow resubmission
            response.taskStatus = 'assigned';
        }

        await contribution.save();
        await contribution.populate([
            { path: 'author', select: 'username email fullName role bio researchInterests' },
            { path: 'responses.responder', select: 'username email fullName role bio researchInterests averageRating totalRatings completedTasks' },
            { path: 'contributorsList', select: 'username email fullName role' }
        ]);

        res.json({ message: `Submission ${status}`, contribution });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// STEP 5: Rating
router.post('/:id/responses/:responseId/rate', async (req, res) => {
    try {
        const { userId, rating, ratingComment } = req.body;
        if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be 1-5' });

        const contribution = await Contribution.findById(req.params.id);
        if (contribution.author.toString() !== userId) return res.status(403).json({ message: 'Unauthorized' });

        const response = contribution.responses.id(req.params.responseId);
        if (response.submissionStatus !== 'approved') return res.status(400).json({ message: 'Cannot rate before approval' });
        if (response.rating) return res.status(400).json({ message: 'Already rated' });

        response.rating = rating;
        response.ratingComment = ratingComment;
        response.ratedAt = new Date();
        response.ratedBy = userId;

        await contribution.save();

        // Update User Stats
        const targetUser = await User.findById(response.responder);
        const currentTotal = targetUser.totalRatings || 0;
        const currentAvg = targetUser.averageRating || 0;

        targetUser.totalRatings = currentTotal + 1;
        targetUser.averageRating = ((currentAvg * currentTotal) + rating) / (currentTotal + 1);
        targetUser.completedTasks = (targetUser.completedTasks || 0) + 1;

        await targetUser.save();

        await contribution.populate([
            { path: 'author', select: 'username email fullName role bio researchInterests' },
            { path: 'responses.responder', select: 'username email fullName role bio researchInterests averageRating totalRatings completedTasks' },
            { path: 'contributorsList', select: 'username email fullName role' }
        ]);

        res.json({ message: 'Rating submitted successfully', contribution });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/contributions/:id - Delete contribution 
router.delete('/:id', async (req, res) => {
    try {
        // Scavenge for userId from all possible sources
        const userId = (req.query.userId || req.body.userId || req.headers['x-user-id'] || req.params.userId)?.toString()?.trim();
        const contribId = req.params.id;

        if (!userId) {
            return res.status(401).json({ message: 'User identity is missing. Please log in again.' });
        }

        const contribution = await Contribution.findById(contribId);

        if (!contribution) {
            return res.status(404).json({ message: 'Research contribution could not be found in the database.' });
        }

        // Ensure we have an author ID to compare against
        const authorId = contribution.author ? contribution.author.toString().trim() : null;

        if (!authorId) {
            // If for some reason author is missing, allow deletion if user is logged in (safety fallback)
            // or just allow for now to fix the user's issue.
            await Contribution.findByIdAndDelete(contribId);
            return res.json({ message: 'Contribution removed (Author data was missing).' });
        }

        if (authorId !== userId) {
            return res.status(403).json({
                message: 'Unauthorized: You are not the owner of this contribution.',
                debug: {
                    authorInDB: authorId,
                    userRequesting: userId,
                    match: authorId === userId
                }
            });
        }

        await Contribution.findByIdAndDelete(contribId);
        res.json({ message: 'Contribution deleted successfully' });
    } catch (err) {
        console.error('[Delete] System Error:', err);
        res.status(500).json({
            message: 'Internal server error while deleting contribution',
            error: err.message
        });
    }
});

module.exports = router;
