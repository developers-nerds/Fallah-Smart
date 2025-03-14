const express = require('express');
const router = express.Router();
const Education_VideoController = require('../controllers/Education_Videos');

router.get('/', Education_VideoController.getAllVideos);
router.get('/:id', Education_VideoController.getVideoById);
router.post('/', Education_VideoController.createVideo);
router.put('/:id', Education_VideoController.updateVideo);
router.delete('/:id', Education_VideoController.deleteVideo);


module.exports = router;