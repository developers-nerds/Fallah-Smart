const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animal');
router.get('/get', animalController.getAllAnimals);
router.get('/get/:id', animalController.getAnimalById);
router.post('/', animalController.createAnimal);
router.put('/:id', animalController.updateAnimal);
router.delete('/:id', animalController.deleteAnimal);



module.exports = router;