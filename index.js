import express from "express";
import { configureApp } from "./src/app.js";

const app = configureApp(express(), { connectOnRequest: true });

export default app;
