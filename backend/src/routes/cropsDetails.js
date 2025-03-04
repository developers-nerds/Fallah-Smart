const express = require('express');
const router = express.Router();
const cropDetailsController = require("../controllers/cropsDetails")
router.get('/', cropDetailsController.getCropDetails);
router.get('/:id', cropDetailsController.getCropDetailsById);   
router.post('/', cropDetailsController.createCropDetails);
router.put('/:id', cropDetailsController.updateCropDetails);
router.delete('/:id', cropDetailsController.deleteCropDetails);




module.exports = router;