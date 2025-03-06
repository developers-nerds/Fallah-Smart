const express = require('express');
const router = express.Router();
const { AnimalGaston, Media } = require('../database/assossiation');
const auth = require('../middleware/auth');
const animalGastonController = require('../controllers/animalGastonController');

// Middleware to check if animal exists and belongs to user
const checkAnimalOwnership = async (req, res, next) => {
  try {
    const animal = await AnimalGaston.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    req.animal = animal;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking animal ownership' });
  }
};

// Routes
router.get('/', auth, animalGastonController.getAllAnimals);
router.get('/:id', auth, checkAnimalOwnership, animalGastonController.getAnimalById);
router.post('/', auth, animalGastonController.createAnimal);
router.put('/:id', auth, checkAnimalOwnership, animalGastonController.updateAnimal);
router.delete('/:id', auth, checkAnimalOwnership, animalGastonController.deleteAnimal);

module.exports = router; 