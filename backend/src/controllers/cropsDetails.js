const { CropDetails } = require('../database/assossiation');

const cropDetailsController = {
  getCropDetails: async (req, res) => {
    try {
      const cropDetails = await CropDetails.findAll();
      res.status(200).json(cropDetails);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getCropDetailsById: async (req, res) => {
    const { id } = req.params;
    try {
      const cropDetails = await CropDetails.findByPk(id);
      res.status(200).json(cropDetails);
    } catch (error) {s
      res.status(500).json({ error: error.message });
    }
  },
  createCropDetails: async (req, res) => {
    const { cropId, details } = req.body;
    try {
      const cropDetails = await CropDetails.create({ cropId, details });
      res.status(201).json(cropDetails);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  updateCropDetails: async (req, res) => {
    const { id, details } = req.body;
    try {
      const cropDetails = await CropDetails.update({ details }, { where: { id } });
      res.status(200).json(cropDetails);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  deleteCropDetails: async (req, res) => {
    const { id } = req.params;
    try { 
      await CropDetails.destroy({ where: { id } });
      res.status(204).json({ message: 'Crop details deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = cropDetailsController;
