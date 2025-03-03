// Ensure the route is properly configured with multer for image uploads
router.post('/:postId/comments', authenticateToken, upload.single('image'), controller.addComment); 