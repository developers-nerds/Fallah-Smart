const express = require('express');
const router = express.Router();
const Education_CropController = require('../controllers/Education_Crops');

router.get('/', Education_CropController.getAllCrops);
router.get('/:id', Education_CropController.getCropById);
router.post('/', Education_CropController.createCrop);
router.put('/:id', Education_CropController.updateCrop);
router.delete('/:id', Education_CropController.deleteCrop);
router.get('/category/:category', Education_CropController.getCropsByCategory);
router.get('/search', Education_CropController.searchCrops);

module.exports = router;