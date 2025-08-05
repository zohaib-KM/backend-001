const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { cache, invalidateCache } = require('../middleware/cache');

// Simple validation function
const validatePost = (data) => {
  const errors = [];
  if (!data.title || data.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required' });
  }
  if (!data.content || data.content.trim().length === 0) {
    errors.push({ field: 'content', message: 'Content is required' });
  }
  if (!data.author) {
    errors.push({ field: 'author', message: 'Author is required' });
  }
  return { isValid: errors.length === 0, errors };
};

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the post
 *               content:
 *                 type: string
 *                 description: The content/body of the post
 *               author:
 *                 type: string
 *                 description: The ID of the user who created the post
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags associated with the post
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 description: The creation date of the post
 *               updatedAt:
 *                 type: string
 *                 format: date-time
 *                 description: The last update date of the post
 *             required:
 *               - title
 *               - content
 *               - author
 *     responses:
 *       201:
 *         description: Post created
 *       400:
 *         description: Bad request
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: List of posts
 */
router.post('/', invalidateCache('cache:*posts*'), async (req, res) => {
  const validation = validatePost(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.errors });
  }

  try {
    const post = await Post.create(req.body);
    
    // Get Socket.IO instance and emit notification
    const io = req.app.get('io');
    io.emit('newPost', {
      message: 'A new post has been created!',
      post: {
        id: post._id,
        title: post.title,
        author: post.author
      }
    });
    
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get a post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post found
 */
// Get all posts with caching
router.get('/', cache(300), async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'name email');
    res.json(posts);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get post by ID with caching
router.get('/:id', cache(600), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author');
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
