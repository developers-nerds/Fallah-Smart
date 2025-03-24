const { Posts, Comments, Likes, Users, Media, Reports } = require('../database/assossiation');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = process.env.API_URL;

const blogController = {
  // POST OPERATIONS
  
  // Get all posts with comments count and likes count
  getAllPosts: async (req, res) => {
    try {
      const posts = await Posts.findAll({
        include: [
          {
            model: Users,
            as: 'author',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture', 'role']
          },
          {
            model: Media,
            as: 'media',
            attributes: ['id', 'url', 'type']
          },
          {
            model: Comments,
            as: 'comments',
            attributes: ['id']
          },
          {
            model: Likes,
            as: 'likes',
            attributes: ['id']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Transform posts to include counts and rename user to author for frontend consistency
      const formattedPosts = posts.map(post => {
        const postJson = post.toJSON();
        return {
          ...postJson,
          author: postJson.author,
          user: undefined,
          commentsCount: postJson.comments?.length || 0,
          likesCount: postJson.likes?.length || 0,
          // Keep media as is for displaying images
          // No need to rename comments and likes as they won't be used directly
        };
      });

      res.status(200).json(formattedPosts);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching posts', error: error.message });
    }
  },

  // Get a single post with comments and likes
  getPostById: async (req, res) => {
    try {
      const { postId } = req.params;
      
      const post = await Posts.findByPk(postId, {
        include: [
          {
            model: Users,
            as: 'author',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture', 'role']
          },
          {
            model: Media,
            as: 'media',
            attributes: ['id', 'url', 'type']
          },
          {
            model: Comments,
            as: 'comments',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture', 'role']
              },
              {
                model: Media,
                as: 'media',
                attributes: ['id', 'url', 'type']
              }
            ]
          },
          {
            model: Likes,
            as: 'likes',
            attributes: ['id', 'userId']
          }
        ]
      });
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Transform post data
      const postData = post.toJSON();
      const formattedPost = {
        ...postData,
        author: postData.author,
        user: undefined,
        commentsCount: postData.comments?.length || 0,
        likesCount: postData.likes?.length || 0
      };
      
      // Get category from the post's category field
      if (formattedPost.category) {
        formattedPost.categoryInfo = { 
          id: formattedPost.category,
          name: formattedPost.category
        };
      }
      
      // Check if user has liked the post
      if (req.user) {
        const userLiked = await Likes.findOne({
          where: { postId, userId: req.user.id }
        });
        formattedPost.userLiked = !!userLiked;
      }
      
      res.status(200).json(formattedPost);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching post', error: error.message });
    }
  },

  // Create a new post
  createPost: async (req, res) => {
    try {
      const { title, description, category } = req.body;
      const userId = req.user.id;
      const files = req.files || []; // Add fallback if files are undefined

      if (!title || !category) {
        return res.status(400).json({ message: 'Title and category are required' });
      }

      // Create the post
      const post = await Posts.create({
        title,
        description,
        category,
        userId
      });

      // Add uploaded files as media ONLY if files exist and have length
      if (files && files.length > 0) {
        const mediaPromises = files.map(file => {
          // Add null check for file and file.path
          if (!file || !file.path) {
            return null; 
          }
          const fileName = path.basename(file.path);
          // Make URL consistent with how your frontend serves static files
          const filePath = `${BASE_URL}/uploads/${fileName}`;
          
          // Determine media type based on mimetype
          let type = 'other';
          if (file.mimetype.startsWith('image/')) type = 'image';
          if (file.mimetype.startsWith('video/')) type = 'video';

          return Media.create({
            url: filePath, // Save the full URL
            type,
            file_path: file.path,
            file_type: file.mimetype,
            postId: post.id,
            originalName: file.originalname || 'unknown'
          });
        }).filter(Boolean); // Filter out null values

        if (mediaPromises.length > 0) {
          await Promise.all(mediaPromises);
        }
      }

      // Return the created post with its media
      const createdPost = await Posts.findByPk(post.id, {
        include: [
          {
            model: Users,
            as: 'author',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture', 'role']
          },
          {
            model: Media,
            as: 'media',
            attributes: ['id', 'url', 'type', 'originalName']
          }
        ]
      });

      res.status(201).json(createdPost);
    } catch (err) {
      res.status(500).json({ message: 'Error creating post', error: err.message });
    }
  },

  // Update a post
  updatePost: async (req, res) => {
    try {
      const { postId } = req.params;
      const { title, description, category, removeMedia } = req.body;
      const userId = req.user.id;
      const files = req.files;

      const post = await Posts.findByPk(postId);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if user is the author of the post
      if (post.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'You are not authorized to update this post' });
      }

      await post.update({
        title: title || post.title,
        description: description || post.description,
        category: category || post.category
      });

      // Remove media if specified
      if (removeMedia && Array.isArray(removeMedia)) {
        const mediaToRemove = await Media.findAll({
          where: {
            id: { [Op.in]: removeMedia },
            postId
          }
        });

        // Delete files from disk
        for (const media of mediaToRemove) {
          const filePath = path.join(__dirname, '../../', media.url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        // Delete from database
        await Media.destroy({
          where: {
            id: { [Op.in]: removeMedia },
            postId
          }
        });
      }

      // Add new media if files are uploaded
      if (files && files.length > 0) {
        const mediaPromises = files.map(file => {
          // Get file path relative to server - FIX URL FORMAT HERE
          const fileName = path.basename(file.path);
          // Use full URL path that will be accessible from the frontend
          const filePath = `${BASE_URL}/uploads/${fileName}`;
          
          // Determine media type based on mimetype
          let type = 'other';
          if (file.mimetype.startsWith('image/')) type = 'image';
          if (file.mimetype.startsWith('video/')) type = 'video';

          return Media.create({
            url: filePath, // Use the full URL
            type,
            file_path: file.path,
            file_type: file.mimetype,
            postId,
            originalName: file.originalname || 'unknown',
            mimeType: file.mimetype,
            size: file.size
          });
        });

        await Promise.all(mediaPromises);
      }

      // Fetch the updated post with author details
      const updatedPost = await Posts.findByPk(postId, {
        include: [
          {
            model: Users,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture']
          },
          {
            model: Media,
            as: 'media',
            attributes: ['id', 'url', 'type', 'originalName']
          }
        ]
      });

      res.status(200).json(updatedPost);
    } catch (error) {
      res.status(500).json({ message: 'Error updating post', error: error.message });
    }
  },

  // Delete a post
  deletePost: async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role || '';

      console.log(`Attempting to delete post ID: ${postId}`);
      console.log(`User ID: ${userId}, User Role: ${userRole}`);

      const post = await Posts.findByPk(postId);

      if (!post) {
        console.log(`Post not found: ${postId}`);
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if user is the author of the post or an admin (case-insensitive)
      const isAdmin = userRole.toUpperCase() === 'ADMIN';
      const isAuthor = post.userId === userId;
      
      console.log(`Is user admin? ${isAdmin}, Is user author? ${isAuthor}`);
      
      if (!isAuthor && !isAdmin) {
        console.log(`Access denied: User ${userId} with role ${userRole} attempted to delete post ${postId} by user ${post.userId}`);
        return res.status(403).json({ message: 'You are not authorized to delete this post' });
      }

      console.log(`Authorization confirmed. Proceeding with post deletion`);

      // Get all media to delete files
      const media = await Media.findAll({ where: { postId } });
      
      // Delete files from disk
      for (const item of media) {
        const filePath = path.join(__dirname, '../../', item.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Delete associated media, comments, and likes
      await Media.destroy({ where: { postId } });
      await Comments.destroy({ where: { postId } });
      await Likes.destroy({ where: { postId } });
      await Reports.destroy({ where: { postId } });

      // Delete the post
      await post.destroy();

      console.log(`Post ${postId} deleted successfully by ${isAdmin ? 'admin' : 'author'}`);
      res.status(200).json({ 
        message: 'Post deleted successfully',
        deletedBy: isAdmin ? 'admin' : 'author' 
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ message: 'Error deleting post', error: error.message });
    }
  },

  // COMMENT OPERATIONS

  // Get comments for a post
  getPostComments: async (req, res) => {
    try {
      const { postId } = req.params;
      
      const comments = await Comments.findAll({
        where: { postId },
        include: [
          {
            model: Users,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture']
          },
          {
            model: Media,
            as: 'media',
            attributes: ['id', 'url', 'type']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json(comments);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching comments', error: error.message });
    }
  },

  // Add a comment to a post
  addComment: async (req, res) => {
    try {
      const { postId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;
      
      // Create the comment with a default empty string for content if not provided
      const comment = await Comments.create({
        content: content || '',
        postId,
        userId
      });
      
      // Handle image upload if present
      if (req.file) {
        const filePath = `/uploads/${req.file.filename}`;
        
        // Create the media entry
        const media = await Media.create({
          url: filePath,
          type: 'image',
          commentId: comment.id
        });
      }
      
      // Get the complete comment with user and media info
      const fullComment = await Comments.findByPk(comment.id, {
        include: [
          {
            model: Users,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture']
          },
          {
            model: Media,
            as: 'media'
          }
        ]
      });
      
      // Format the response
      const responseData = fullComment.toJSON();
      
      // Add a direct imageUrl property if there's media attached
      if (responseData.media && responseData.media.length > 0) {
        responseData.imageUrl = responseData.media[0].url;
      }
      
      res.status(201).json(responseData);
    } catch (error) {
      res.status(500).json({ 
        message: 'Error adding comment',
        error: error.message
      });
    }
  },

  // Update a comment
  updateComment: async (req, res) => {
    try {
      const { commentId } = req.params;
      const { content, removeMedia } = req.body;
      const userId = req.user.id;
      const file = req.file;

      if (!content && !file) {
        return res.status(400).json({ message: 'Comment content or image is required' });
      }

      const comment = await Comments.findByPk(commentId);

      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      // Check if user is the author of the comment
      if (comment.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'You are not authorized to update this comment' });
      }

      await comment.update({ content });

      // Remove media if specified
      if (removeMedia) {
        const mediaToRemove = await Media.findAll({
          where: {
            id: removeMedia,
            commentId
          }
        });

        // Delete files from disk
        for (const media of mediaToRemove) {
          const filePath = path.join(__dirname, '../../', media.url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        // Delete from database
        await Media.destroy({
          where: {
            id: removeMedia,
            commentId
          }
        });
      }

      // Add new media if file is uploaded
      if (file) {
        // Get file path relative to server
        const filePath = `/uploads/${path.basename(file.path)}`;
        
        await Media.create({
          url: filePath,
          type: 'image',
          commentId,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size
        });
      }

      // Fetch the updated comment with author details
      const updatedComment = await Comments.findByPk(commentId, {
        include: [
          {
            model: Users,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture']
          },
          {
            model: Media,
            as: 'media',
            attributes: ['id', 'url', 'type']
          }
        ]
      });

      res.status(200).json(updatedComment);
    } catch (error) {
      res.status(500).json({ message: 'Error updating comment', error: error.message });
    }
  },

  // Delete a comment
  deleteComment: async (req, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.user.id;

      const comment = await Comments.findByPk(commentId);

      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      // Check if user is the author of the comment or an admin
      if (comment.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'You are not authorized to delete this comment' });
      }

      // Get all media to delete files
      const media = await Media.findAll({ where: { commentId } });
      
      // Delete files from disk
      for (const item of media) {
        const filePath = path.join(__dirname, '../../', item.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Delete associated media
      await Media.destroy({ where: { commentId } });

      // Delete the comment
      await comment.destroy();

      res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting comment', error: error.message });
    }
  },

  // LIKE OPERATIONS

  // Like or unlike a post
  toggleLike: async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user.id;

      // Check if post exists
      const post = await Posts.findByPk(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if user has already liked the post
      const existingLike = await Likes.findOne({
        where: { postId, userId }
      });

      if (existingLike) {
        // Unlike the post
        await existingLike.destroy();
        res.status(200).json({ liked: false, message: 'Post unliked successfully' });
      } else {
        // Like the post
        await Likes.create({ postId, userId });
        res.status(201).json({ liked: true, message: 'Post liked successfully' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error toggling like', error: error.message });
    }
  },

  // Get users who liked a post
  getPostLikes: async (req, res) => {
    try {
      const { postId } = req.params;

      const likes = await Likes.findAll({
        where: { postId },
        include: [
          {
            model: Users,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture']
          }
        ]
      });

      res.status(200).json(likes);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching likes', error: error.message });
    }
  },

  // SEARCH AND FILTER OPERATIONS

  // Search posts
  searchPosts: async (req, res) => {
    try {
      const { query, category } = req.query;
      
      const whereClause = {};
      
      // Add search query if provided
      if (query) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } }
        ];
      }
      
      // Add category filter if provided
      if (category) {
        whereClause.category = category;
      }

      const posts = await Posts.findAll({
        where: whereClause,
        include: [
          {
            model: Users,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture']
          },
          {
            model: Media,
            as: 'media',
            attributes: ['id', 'url', 'type', 'originalName']
          },
          {
            model: Likes,
            as: 'likes',
            attributes: ['id', 'userId']
          },
          {
            model: Comments,
            as: 'comments',
            attributes: ['id']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Calculate additional fields
      const postsWithCounts = posts.map(post => {
        const plainPost = post.get({ plain: true });
        return {
          ...plainPost,
          likesCount: plainPost.likes ? plainPost.likes.length : 0,
          commentsCount: plainPost.comments ? plainPost.comments.length : 0
        };
      });

      res.status(200).json(postsWithCounts);
    } catch (error) {
      res.status(500).json({ message: 'Error searching posts', error: error.message });
    }
  },

  // Get posts by user
  getUserPosts: async (req, res) => {
    try {
      const { userId } = req.params;
      const { category } = req.query;

      // Build where conditions
      const whereConditions = { userId };
      
      // Add category filter if provided
      if (category) {
        whereConditions.category = category;
      }

      const posts = await Posts.findAll({
        where: whereConditions,
        include: [
          {
            model: Users,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture']
          },
          {
            model: Media,
            as: 'media',
            attributes: ['id', 'url', 'type', 'originalName']
          },
          {
            model: Comments,
            as: 'comments',
            attributes: ['id']
          },
          {
            model: Likes,
            as: 'likes',
            attributes: ['id', 'userId']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Use the same response format as other methods
      const postsWithCounts = posts.map(post => {
        const plainPost = post.get({ plain: true });
        return {
          ...plainPost,
          likesCount: plainPost.likes ? plainPost.likes.length : 0,
          commentsCount: plainPost.comments ? plainPost.comments.length : 0
        };
      });

      res.status(200).json(postsWithCounts);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user posts', error: error.message });
    }
  },

  // Modify or add the getPosts method
  getPosts: async (req, res) => {
    try {
      const { category } = req.query;
      
      // Build query conditions
      const whereConditions = {};
      if (category) {
        whereConditions.category = category;
      }
      
      const posts = await Posts.findAll({
        where: whereConditions,
        include: [
          {
            model: Users,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'profilePicture']
          },
          {
            model: Media,
            as: 'media',
            attributes: ['id', 'url', 'type', 'originalName']
          },
          {
            model: Likes,
            as: 'likes',
            attributes: ['id', 'userId']
          },
          {
            model: Comments,
            as: 'comments',
            attributes: ['id']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Calculate additional fields for response
      const postsWithCounts = posts.map(post => {
        const plainPost = post.get({ plain: true });
        return {
          ...plainPost,
          likesCount: plainPost.likes ? plainPost.likes.length : 0,
          commentsCount: plainPost.comments ? plainPost.comments.length : 0
        };
      });

      // Without additional role info processing
      res.status(200).json(postsWithCounts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
    }
  },

  // Add this controller function
  reportPost: async (req, res) => {
    try {
      const { postId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;
      
      // Create a report entry in your database
      // This assumes you have a Reports model, if not you'd need to create one
      const report = await Reports.create({
        postId,
        userId,
        reason,
        status: 'pending'
      });
      
      res.status(200).json({ message: 'Report submitted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to submit report', error: error.message });
    }
  }
};

module.exports = blogController;