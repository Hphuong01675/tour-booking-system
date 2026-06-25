import db from "./models";
import { seedDatabase } from "./seed/seed";

export const initializeDatabaseAndStartServer = async (app, port) => {
    try {
        await db.sequelize.authenticate();
        console.log("MySQL Database Connected.");

        // Sync database schema
        await db.sequelize.sync();

        // Alter ENUM type for booking status to support 'rejected'
        try {
            await db.sequelize.query(
                "ALTER TABLE bookings MODIFY COLUMN status ENUM('pending_approval', 'pending_payment', 'paid', 'cancelled', 'refunded', 'rejected') NOT NULL DEFAULT 'pending_payment';"
            );
            console.log("Successfully altered bookings status ENUM to support 'rejected'.");
        } catch (e) {
            console.warn("Failed to alter bookings status ENUM:", e.message);
        }

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
