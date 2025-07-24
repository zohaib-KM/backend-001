const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

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
 *             $ref: '#/components/schemas/Post'
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
router.post('/', async (req, res) => {
  try {
    const post = await Post.create(req.body);
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
// Get all posts
router.get('/', async (req, res) => {
  const posts = await Post.find().populate('author', 'name email');
  res.json(posts);
});

// Get post by ID
router.get('/:id', async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author');
  res.json(post);
});

module.exports = router;
