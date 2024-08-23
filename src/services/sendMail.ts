import nodemailer from "nodemailer";
import { config } from "../config/config.js";

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
