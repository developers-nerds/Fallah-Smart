const express = require('express');
const router = express.Router();
const cropsController=require("../controllers/crops")
router.get('/', cropsController.getAllCrops);
router.get('/:id', cropsController.getCropById);
router.post('/', cropsController.createCrop);
router.put('/:id', cropsController.updateCrop);
router.delete('/:id', cropsController.deleteCrop);









module.exports = router;