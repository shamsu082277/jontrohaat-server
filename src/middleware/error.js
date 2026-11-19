export function notFound(req, res) {
  res.status(404).json({ success: false, message: "Route not found" });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status === 500 ? "Internal server error" : error.message;
  if (status === 500) console.error(error);
  res.status(status).json({ success: false, message });
}
