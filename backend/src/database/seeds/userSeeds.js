const { faker } = require('@faker-js/faker');
const { Users } = require('../assossiation');
const bcrypt = require('bcrypt');

async function seedUsers() {
  try {
    console.log("🌱 Seeding users...");

    const usersToCreate = [];
    const roles = ['ADMIN', 'USER', 'ADVISOR'];
    const genders = ['male', 'female'];

    // Create one admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    usersToCreate.push({
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
    });

    // Create regular users
    const userCount = faker.number.int({ min: 15, max: 30 });
    for (let i = 0; i < userCount; i++) {
      const password = await bcrypt.hash('password123', 10);
      const firstName = faker.person.firstName().substring(0, 15);
      const lastName = faker.person.lastName().substring(0, 15);
      const username = faker.internet.userName({ firstName, lastName }).substring(0, 15);

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

    await Users.bulkCreate(usersToCreate);
    console.log(`✅ Created ${usersToCreate.length} users`);

    return true;
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error;
  }
}

module.exports = seedUsers;