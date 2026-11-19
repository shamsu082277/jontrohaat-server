export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function success(res, message, data = {}, status = 200) {
  return res.status(status).json({ success: true, message, data });
}
