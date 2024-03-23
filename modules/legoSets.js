require('dotenv').config();
const Sequelize = require('sequelize');
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // This bypasses SSL certificate verification. Use with caution in production.
    }
  },
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Define the Theme model
const Theme = sequelize.define('Theme', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false, // Assuming a name is always required
  },
}, {
  timestamps: false, // Disable createdAt and updatedAt
});

// Define the Set model
const Set = sequelize.define('Set', {
  set_num: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false, // Assuming a name is always required
  },
  year: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  num_parts: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  theme_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  img_url: {
    type: Sequelize.STRING,
    allowNull: true, // Assuming the image URL is optional
  },
}, {
  timestamps: false, // Disable createdAt and updatedAt
});

// Create a "belongsTo" association from Set to Theme
Set.belongsTo(Theme, {foreignKey: 'theme_id'})
// Refactored functions to use Sequelize models
function initialize() {
  return sequelize.sync();
}

function getAllSets() {
  return Set.findAll({
    include: [{ model: Theme }]
  });
}

function getSetByNum(setNum) {
  return Set.findAll({
    where: { set_num: setNum },
    include: [{ model: Theme }]
  }).then(sets => {
    if (sets && sets.length > 0) {
      return sets[0]; // return the first element in the array
    } else {
      return Promise.reject("Unable to find requested set");
    }
  });
}


function getSetsByTheme(theme) {
  return Set.findAll({
    include: [{
      model: Theme,
      // as: 'theme', // Use the alias specified in the association
      where: {
        name: {
          [Sequelize.Op.iLike]: `%${theme}%`
        }
      }
    }]
  }).then(sets => {
    if (sets.length > 0) {
      return sets;
    } else {
      return Promise.reject("Unable to find requested sets");
    }
  });
}

async function addSet(setData) {
  try {
    await Set.create(setData);
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err.errors[0].message);
  }
}

async function getAllThemes() {
  try {
    const themes = await Theme.findAll();
    return Promise.resolve(themes);
  } catch (err) {
    return Promise.reject(err);
  }
}

async function editSet(set_num, setData) {
  try {
    const [numOfUpdatedSets, updatedSets] = await Set.update(setData, {
      where: { set_num: set_num }
    });
    if (numOfUpdatedSets > 0) {
      return Promise.resolve();
    } else {
      return Promise.reject("Set not found or not updated");
    }
  } catch (err) {
    return Promise.reject(err.errors[0].message);
  }
}

async function deleteSet(setNum) {
  try {
    await Set.destroy({
      where: { set_num: setNum }
    });
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err.errors[0].message);
  }
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, addSet, getAllThemes, editSet, deleteSet }

