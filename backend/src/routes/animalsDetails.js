const express = require('express');
const router = express.Router();
const animalDetailsController=require("../controllers/animalsDetails")
router.get('/get/', animalDetailsController.getAllAnimalDetails);
router.get('/get/:id', animalDetailsController.getAnimalDetailsById);
router.post('/', animalDetailsController.createAnimalDetails);
router.put('/:id', animalDetailsController.updateAnimalDetails);
router.delete('/:id', animalDetailsController.deleteAnimalDetails); 






module.exports = router;