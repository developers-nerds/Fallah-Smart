module.exports =(connection,DataTypes ) =>{


  const Crop = connection.define('Crop', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'crops',
    timestamps: false,
  });
  return Crop
  
  }