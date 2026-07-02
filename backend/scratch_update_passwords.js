const db = require('./src/models');
const bcrypt = require('bcryptjs');

async function run() {
    try {
        const hash = await bcrypt.hash('Levuhai2@5', 10);
        console.log('Bcrypt hash of Levuhai2@5:', hash);
        
        const [updatedRows] = await db.User.update(
            { passwordHash: hash },
            { where: {} }
        );
        console.log(`Successfully updated ${updatedRows} users' passwords to Levuhai2@5!`);
        
        // Check and output details of all users
        const users = await db.User.findAll();
        for (const user of users) {
            console.log(`User: ${user.fullName} (${user.email}), Active: ${user.isActive}, Role: ${user.role}`);
        }
    } catch (err) {
        console.error('Error during password update:', err);
    } finally {
        await db.sequelize.close();
    }
}

run();
