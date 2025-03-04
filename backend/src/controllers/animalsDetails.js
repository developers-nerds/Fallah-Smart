const { AnimalDetails } = require('../database/assossiation');

const animalDetailsController = {
  getAllAnimalDetails: async (req, res) => {
    try {
      const animalDetails = await AnimalDetails.findAll();
      res.status(200).json(animalDetails);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getAnimalDetailsById: async (req, res) => {
    const { id } = req.params;
    try {
      const animalDetails = await AnimalDetails.findByPk(id);
      res.status(200).json(animalDetails);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  createAnimalDetails: async (req, res) => {
    const { animalId, details } = req.body;
    try {
      const animalDetails = await AnimalDetails.create({ animalId, details });
      res.status(201).json(animalDetails);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  updateAnimalDetails: async (req, res) => {
    const { id, details } = req.body;
    try {
      const animalDetails = await AnimalDetails.update({ details }, { where: { id } });
      res.status(200).json(animalDetails);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  deleteAnimalDetails: async (req, res) => {
    const { id } = req.params;
    try {
      await AnimalDetails.destroy({ where: { id } });
      res.status(204).json({ message: 'Animal details deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};  

module.exports = animalDetailsController;
