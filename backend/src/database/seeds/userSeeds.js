const { faker } = require('@faker-js/faker');
const { Users } = require('../assossiation');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

async function seedUsers() {
  try {
    console.log("🌱 Seeding users...");

    const usersToCreate = [];
    const roles = ['ADMIN', 'USER', 'ADVISOR'];
    const genders = ['male', 'female'];

    // Create one admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminData = {
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      gender: faker.helpers.arrayElement(genders),
      email: 'admin@example.com',
      phoneNumber: faker.phone.number('###-###-####'),
      password: adminPassword,
      isOnline: true,
      lastLogin: new Date(),
      profilePicture: faker.image.avatar(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create regular users
    const userCount = faker.number.int({ min: 15, max: 30 });
    const pendingUsernames = ['admin']; // Track usernames to check
    
    for (let i = 0; i < userCount; i++) {
      const password = await bcrypt.hash('password123', 10);
      const firstName = faker.person.firstName().substring(0, 15);
      const lastName = faker.person.lastName().substring(0, 15);
      const username = faker.internet.userName({ firstName, lastName }).substring(0, 15);
      
      pendingUsernames.push(username);
      
      usersToCreate.push({
        username,
        firstName,
        lastName,
        role: faker.helpers.arrayElement(roles),
        gender: faker.helpers.arrayElement(genders),
        email: faker.internet.email({ firstName, lastName }),
        phoneNumber: faker.phone.number('###-###-####'),
        password,
        isOnline: faker.datatype.boolean(),
        lastLogin: faker.date.recent(),
        profilePicture: faker.image.avatar(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Check which usernames already exist in the database
    const existingUsers = await Users.findAll({
      where: {
        username: {
          [Op.in]: pendingUsernames
        }
      },
      attributes: ['username']
    });

    const existingUsernames = existingUsers.map(user => user.username);
    console.log(`Found ${existingUsernames.length} existing users that will be skipped`);

    // Filter out users that already exist
    const newUsers = usersToCreate.filter(user => !existingUsernames.includes(user.username));
    
    // Add admin if it doesn't exist
    if (!existingUsernames.includes('admin')) {
      newUsers.push(adminData);
    }

    if (newUsers.length > 0) {
      await Users.bulkCreate(newUsers);
      console.log(`✅ Created ${newUsers.length} new users`);
    } else {
      console.log('No new users to create, all usernames already exist');
    }

    return true;
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error;
  }
}

module.exports = seedUsers;