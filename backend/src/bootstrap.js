import db from "./models";
import { seedDatabase } from "./seed/seed";

export const initializeDatabaseAndStartServer = async (app, port) => {
    try {
        await db.sequelize.authenticate();
        console.log("MySQL Database Connected.");

        // Sync database schema
        await db.sequelize.sync();

        // Seed default records if empty
        await seedDatabase();

        app.listen(port, () => {
            console.log(`Backend Server running on port ${port}`);
        });
    } catch (err) {
        console.error("Database Connection Error:", err);
        process.exit(1);
    }
};
