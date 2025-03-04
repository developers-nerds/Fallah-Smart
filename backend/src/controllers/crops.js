const { Crop } = require('../database/assossiation');

const cropController = {
  getAllCrops: async (req, res) => {
    try {
      const crops = await Crop.findAll();
      res.status(200).json(crops);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getCropById: async (req, res) => {
    const { id } = req.params;
    try {
      const crop = await Crop.findByPk(id);
      res.status(200).json(crop);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  createCrop: async (req, res) => {
    const { name, category, image } = req.body;
    try {
      const crop = await Crop.create({ name, category, image });
      res.status(201).json(crop);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  updateCrop: async (req, res) => {
    const { id, name, category, image } = req.body;
    try {
      const crop = await Crop.update({ name, category, image }, { where: { id } });
      res.status(200).json(crop);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  deleteCrop: async (req, res) => {
    const { id } = req.params;
    try {
      await Crop.destroy({ where: { id } });
      res.status(204).json({ message: 'Crop deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = cropController;
