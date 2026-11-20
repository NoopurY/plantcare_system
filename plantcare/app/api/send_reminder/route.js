// app/api/send_reminder/route.js - Automated Email Trigger via PostgreSQL Care Schedules
import { NextResponse } from "next/server";
import { query } from "@/lib/db/pool";
import nodemailer from "nodemailer";

export async function POST() {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
  const currentDay = now
    .toLocaleString("en-US", { weekday: "long" })
    .toLowerCase();

  try {
    const result = await query(
      `SELECT cs.*, p.plant_name
       FROM care_schedules cs
       LEFT JOIN plants p ON cs.plant_id = p.plant_id
       WHERE cs.is_active = TRUE
         AND $1 = ANY(cs.schedule_days)
         AND TO_CHAR(cs.schedule_time, 'HH24:MI') = $2`,
      [currentDay, currentTime]
    );

    const reminders = result.rows || [];

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && reminders.length > 0) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      for (const rem of reminders) {
        if (!rem.email) continue;
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: rem.email,
            subject: `🌱 VerdeBase - Time to ${rem.task_type} ${rem.plant_name || 'your plants'}!`,
            text: `It is ${currentTime}! Friendly reminder from VerdeBase: time for scheduled ${rem.task_type} on ${rem.plant_name || 'your plant collection'}. Notes: ${rem.notes || 'None'}`,
          });

          await query(
            `UPDATE care_schedules SET last_sent_at = NOW() WHERE schedule_id = $1`,
            [rem.schedule_id]
          );
        } catch (mailErr) {
          console.error("Failed to dispatch email:", mailErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: reminders.length,
      time: currentTime,
      day: currentDay
    });
  } catch (err) {
    console.error("send_reminder error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
