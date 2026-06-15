const db = require('./src/models');
const bcrypt = require('bcryptjs');

async function run() {
    try {
        const hash = await bcrypt.hash('123456', 10);
        console.log('Bcrypt hash of 123456:', hash);
        
        const [updatedRows] = await db.User.update(
            { passwordHash: hash },
            { where: { role: 'customer' } }
        );
        console.log(`Successfully updated ${updatedRows} customer users' passwords to 123456!`);
        
        // Check and output details of trung@gmail.com
        const user = await db.User.findOne({ where: { email: 'trung@gmail.com' } });
        if (user) {
            console.log(`Verified customer: ${user.fullName} (${user.email}) exists with role '${user.role}' and password hash updated.`);
        } else {
            console.log('Warning: customer trung@gmail.com was not found in the database!');
        }
    } catch (err) {
        console.error('Error during password update:', err);
    } finally {
        await db.sequelize.close();
    }
}

run();
