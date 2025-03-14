const express = require('express');
const router = express.Router();
const Education_AdditionalVideoController = require('../controllers/Education_AdditionalVideos');

router.get('/', Education_AdditionalVideoController.getAllAdditionalVideos);
router.get('/:id', Education_AdditionalVideoController.getAdditionalVideoById);
router.post('/', Education_AdditionalVideoController.createAdditionalVideo);
router.put('/:id', Education_AdditionalVideoController.updateAdditionalVideo);
router.delete('/:id', Education_AdditionalVideoController.deleteAdditionalVideo);
router.get('/video/:videoId', Education_AdditionalVideoController.getAdditionalVideosByVideoId);
 







module.exports = router;