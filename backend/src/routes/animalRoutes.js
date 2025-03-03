const express = require('express');
const router = express.Router();
const { AnimalDetails, Media } = require('../database/assossiation');
const auth = require('../middleware/auth');

// Middleware to check if animal exists and belongs to user
const checkAnimalOwnership = async (req, res, next) => {
  try {
    const animal = await AnimalDetails.findOne({
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
router.get('/', auth, async (req, res) => {
  try {
    const animals = await AnimalDetails.findAll({
      where: { userId: req.user.id },
      include: [{ model: Media, as: 'media' }]
    });
    res.json(animals);
  } catch (error) {
    console.error('Error fetching animals:', error);
    res.status(500).json({ error: 'Failed to fetch animals' });
  }
});

router.get('/:id', auth, checkAnimalOwnership, async (req, res) => {
  try {
    const animal = await AnimalDetails.findOne({
      where: { id: req.params.id },
      include: [{ model: Media, as: 'media' }]
    });
    res.json(animal);
  } catch (error) {
    console.error('Error fetching animal:', error);
    res.status(500).json({ error: 'Failed to fetch animal' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const {
      type,
      count,
      healthStatus,
      feedingSchedule,
      gender,
      feeding,
      health,
      diseases,
      medications,
      vaccination,
      notes
    } = req.body;

    const animal = await AnimalDetails.create({
      userId: req.user.id,
      type,
      count,
      healthStatus,
      feedingSchedule,
      gender,
      feeding,
      health,
      diseases,
      medications,
      vaccination,
      notes
    });

    const createdAnimal = await AnimalDetails.findOne({
      where: { id: animal.id },
      include: [{ model: Media, as: 'media' }]
    });

    res.status(201).json(createdAnimal);
  } catch (error) {
    console.error('Error creating animal:', error);
    res.status(500).json({ error: 'Failed to create animal' });
  }
});

router.put('/:id', auth, checkAnimalOwnership, async (req, res) => {
  try {
    const {
      type,
      count,
      healthStatus,
      feedingSchedule,
      gender,
      feeding,
      health,
      diseases,
      medications,
      vaccination,
      notes
    } = req.body;

    await req.animal.update({
      type,
      count,
      healthStatus,
      feedingSchedule,
      gender,
      feeding,
      health,
      diseases,
      medications,
      vaccination,
      notes
    });

    const updatedAnimal = await AnimalDetails.findOne({
      where: { id: req.params.id },
      include: [{ model: Media, as: 'media' }]
    });

    res.json(updatedAnimal);
  } catch (error) {
    console.error('Error updating animal:', error);
    res.status(500).json({ error: 'Failed to update animal' });
  }
});

router.delete('/:id', auth, checkAnimalOwnership, async (req, res) => {
  try {
    await req.animal.destroy();
    res.json({ message: 'Animal deleted successfully' });
  } catch (error) {
    console.error('Error deleting animal:', error);
    res.status(500).json({ error: 'Failed to delete animal' });
  }
});

module.exports = router; 