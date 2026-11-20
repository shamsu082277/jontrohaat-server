import { ObjectId } from "mongodb";
import { HttpError } from "./http.js";

export function toObjectId(value, label = "id") {
  if (!ObjectId.isValid(value)) throw new HttpError(400, `Invalid ${label}`);
  return new ObjectId(value);
}

export function authUserFilter(value) {
  const clauses = [{ _id: value }, { id: value }];
  if (ObjectId.isValid(value)) clauses.push({ _id: new ObjectId(value) });
  return { $or: clauses };
}
