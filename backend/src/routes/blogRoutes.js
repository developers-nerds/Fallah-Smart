const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const auth = require('../middleware/auth');
const upload = require('../utils/multerConfig');

// Post routes
router.get('/posts', blogController.getAllPosts);
router.get('/posts/search', blogController.searchPosts);
router.get('/posts/:postId', blogController.getPostById);
router.post('/posts', auth, upload.array('images', 5), blogController.createPost);
router.put('/posts/:postId', auth, upload.array('images', 5), blogController.updatePost);
router.delete('/posts/:postId', auth, blogController.deletePost);
router.get('/users/:userId/posts', blogController.getUserPosts);

// Comment routes
router.get('/posts/:postId/comments', blogController.getPostComments);
router.post('/posts/:postId/comments', auth, upload.single('image'), blogController.addComment);
router.put('/comments/:commentId', auth, upload.single('image'), blogController.updateComment);
router.delete('/comments/:commentId', auth, blogController.deleteComment);

// Like routes
router.post('/posts/:postId/like', auth, blogController.toggleLike);
router.get('/posts/:postId/likes', blogController.getPostLikes);

// Report routes
router.post('/posts/:postId/report', auth, blogController.reportPost);

module.exports = router; 