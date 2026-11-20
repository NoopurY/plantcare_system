// sendReminders.js - Standalone PostgreSQL Cron Worker for Care Reminders
import "dotenv/config";
import pg from "pg";
import nodemailer from "nodemailer";
import cron from "node-cron";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "verdebase",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log("🌿 VerdeBase Care Routine Cron daemon initialized. Checking schedules every minute...");

// Runs every minute
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
  const currentDay = now
    .toLocaleString("en-US", { weekday: "long" })
    .toLowerCase();

  try {
    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT cs.*, p.plant_name, u.full_name
         FROM care_schedules cs
         JOIN users u ON cs.user_id = u.user_id
         LEFT JOIN plants p ON cs.plant_id = p.plant_id
         WHERE cs.is_active = TRUE
           AND $1 = ANY(cs.schedule_days)
           AND TO_CHAR(cs.schedule_time, 'HH24:MI') = $2`,
        [currentDay, currentTime]
      );

      const reminders = res.rows || [];

      for (const rem of reminders) {
        const targetEmail = rem.email || rem.user_email;
        if (!targetEmail) continue;

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: targetEmail,
          subject: `🌱 VerdeBase - Time to ${rem.task_type} ${rem.plant_name || 'your plants'}!`,
          text: `It's ${currentTime}! Hello ${rem.full_name || 'plant parent'}! Time for scheduled ${rem.task_type} on ${rem.plant_name || 'your plant collection'}.\n\nNotes: ${rem.notes || 'Routine care scheduled via VerdeBase.'}`,
        });

        await client.query(
          `UPDATE care_schedules SET last_sent_at = NOW() WHERE schedule_id = $1`,
          [rem.schedule_id]
        );

        console.log(`[${new Date().toISOString()}] Sent ${rem.task_type} reminder to ${targetEmail}`);
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Cron Database Error:", error);
  }
});
