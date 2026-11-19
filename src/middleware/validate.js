export function validate(schema, source = "body") {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join("; ");
      return res.status(400).json({ success: false, message });
    }
    req[source] = parsed.data;
    next();
  };
}
