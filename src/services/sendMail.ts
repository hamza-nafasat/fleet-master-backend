import nodemailer from "nodemailer";
import { config } from "../config/config.js";
import { styleText } from "util";

export const transporter = nodemailer.createTransport({
  host: config.getEnv("NODEMAILER_HOST"),
  port: parseInt(config.getEnv("NODEMAILER_PORT")),
  auth: {
    user: config.getEnv("NODEMAILER_USER"),
    pass: config.getEnv("NODEMAILER_PASSWORD"),
  },
});

export const sendMail = async (to: string, subject: string, text: string, html = false) => {
  try {
    if (!to || !subject || !text) throw new Error("Please Provide To, Subject and Text");
    const myTransPorter: any = transporter;
    await myTransPorter.sendMail({
      from: config.getEnv("NODEMAILER_FROM"),
      to,
      subject,
      text: html ? undefined : text,
      html: html ? text : undefined,
    });
    return true;
  } catch (error) {
    console.log("error while sending mail", error);
    return false;
  }
};

export const sendNotificationMail = async ({
  to,
  subject,
  severity,
  text,
  userName,
  truckId,
}: {
  to: string;
  subject: string;
  severity: string;
  text: string;
  userName: string;
  truckId: string;
}) => {
  let color = "";
  if (severity == "high") color = "#ff030b";
  if (severity == "medium") color = "#ffcc00";
  if (severity == "low") color = "#00ff00";
  try {
    const myTransPorter: any = transporter;

    const html = `<div
    style="
      min-height: 100%;
      min-width: 100%;
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    "
  >
    <div
      style="
        max-width: 600px;
        max-height: fit-content;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      "
    >
      <div style="background-color: #004b8d; color: #ffffff; padding: 20px; text-align: center">
        <h1 style="margin: 0; font-size: 22px">Fleet Master Alert</h1>
      </div>

      <div style="padding: 40px; text-align: center; font-size: 20px">
        <strong style="background-color: ${color}; color: #ffffff; padding: 10px 15px; border-radius: 5px"
          >${subject}</strong
        >
      </div>

      <div
        style="padding-right: 20px; padding-left: 20px; padding-top: 0px; color: #333333; line-height: 1.6"
      >
        <p>Dear ${userName?.toUpperCase() || "USER"},</p>
        <p>
          ${text}
        </p>
        <p>Thank you,<br />Fleet Master Team</p>
      </div>

      <div
        style="
          background-color: #9edae0;
          padding: 10px;
          text-align: center;
          font-size: 14px;
          color: #555555;
        "
      >
        <p>&copy;${new Date().getFullYear()} Fleet Master. All rights reserved.</p>
      </div>
    </div>
  </div>`;

    await myTransPorter.sendMail({
      from: config.getEnv("NODEMAILER_FROM"),
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.log("Error while sending mail", error);
    return false;
  }
};
