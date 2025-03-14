const express = require('express');
const router = express.Router();
const Education_AnimalController = require('../controllers/Education_Animals');

router.get('/', Education_AnimalController.getAllAnimals);
router.get('/:id', Education_AnimalController.getAnimalById);
router.post('/', Education_AnimalController.createAnimal);
router.put('/:id', Education_AnimalController.updateAnimal);
router.delete('/:id', Education_AnimalController.deleteAnimal);


module.exports = router;