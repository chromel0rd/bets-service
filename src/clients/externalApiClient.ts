import axios from "axios";
import { createSignature } from "../utils/signature";
import { Request } from "express";
import { saveApiLog } from "../utils/logApi";

const BASE_URL = process.env.EXTERNAL_API_URL;

const http = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 5000,
});

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const status = error.response?.status;
      const shouldRetry = !status || (status >= 500 && status < 600);

      if (!shouldRetry || attempt === retries) break;
      console.warn(
        `Retry ${attempt}/${retries} after failure: ${status || error.code}`
      );
      await delay(delayMs);
    }
  }

  throw lastError;
}

async function safePost<T = any>(
  endpoint: string,
  body: any,
  userId: string,
  secretKey: string,
  req?: Request,
  userNumericId?: number
): Promise<T> {
  const signature = createSignature(body, secretKey);
  const start = Date.now();

  console.log(`POST ${endpoint}`, { userId, body, signature });

  try {
    const response = await withRetry(() =>
      http.post<T>(endpoint, body, {
        headers: {
          "user-id": userId,
          "x-signature": signature,
        },
      })
    );
    const duration = Date.now() - start;

    await saveApiLog({
      userId: userNumericId,
      endpoint,
      method: "POST",
      requestBody: body,
      responseBody: response.data,
      statusCode: 200,
      durationMs: duration,
      req,
    });

    return response.data;
  } catch (error: any) {
    const duration = Date.now() - start;
    const status = error.response?.status || 500;

    await saveApiLog({
      userId: userNumericId,
      endpoint,
      method: "POST",
      requestBody: body,
      responseBody: error.response?.data || { error: error.message },
      statusCode: status,
      durationMs: duration,
      req,
    });

    throw error;
  }
}

async function safeGet<T = any>(
  endpoint: string,
  userId: string,
  secretKey: string,
  req?: Request,
  userNumericId?: number
): Promise<T> {
  const signature = createSignature({}, secretKey);
  const start = Date.now();

  console.log(`GET ${endpoint}`, { userId, signature });

  try {
    const response = await withRetry(() =>
      http.get<T>(endpoint, {
        headers: {
          "user-id": userId,
          "x-signature": signature,
        },
      })
    );
    const duration = Date.now() - start;

    await saveApiLog({
      userId: userNumericId,
      endpoint,
      method: "GET",
      requestBody: {},
      responseBody: response.data,
      statusCode: 200,
      durationMs: duration,
      req,
    });

    return response.data;
  } catch (error: any) {
    const duration = Date.now() - start;
    const status = error.response?.status || 500;

    await saveApiLog({
      userId: userNumericId,
      endpoint,
      method: "GET",
      requestBody: {},
      responseBody: error.response?.data || { error: error.message },
      statusCode: status,
      durationMs: duration,
      req,
    });

    throw error;
  }
}

export const externalApiClient = {
  authenticateExternalApi: (
    userId: string,
    secretKey: string,
    req?: Request,
    uid?: number
  ) => safePost("/auth", {}, userId, secretKey, req, uid),

  getBalance: (
    userId: string,
    secretKey: string,
    req?: Request,
    uid?: number
  ) => safePost("/balance", {}, userId, secretKey, req, uid),

  placeBet: (
    userId: string,
    secretKey: string,
    amount: number,
    req?: Request,
    uid?: number
  ) => safePost("/bet", { bet: amount }, userId, secretKey, req, uid),

  getRecommendedBet: (
    userId: string,
    secretKey: string,
    req?: Request,
    uid?: number
  ) => safeGet("/bet", userId, secretKey, req, uid),

  checkWin: (
    userId: string,
    secretKey: string,
    betId: string,
    req?: Request,
    uid?: number
  ) => safePost("/win", { bet_id: betId }, userId, secretKey, req, uid),

  setOrGetBalance: (
    userId: string,
    secretKey: string,
    balance?: number,
    req?: Request,
    uid?: number
  ) => {
    const body = balance !== undefined ? { balance } : {};
    return safePost("/balance", body, userId, secretKey, req, uid);
  },

  checkBalance: (
    userId: string,
    secretKey: string,
    expected: number,
    req?: Request,
    uid?: number
  ) =>
    safePost(
      "/check-balance",
      { expected_balance: expected },
      userId,
      secretKey,
      req,
      uid
    ),
};
