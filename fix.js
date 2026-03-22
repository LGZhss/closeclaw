// If we want to avoid interpolation in db.prepare, how do we write an update?
// We can't easily avoid it if the update is dynamic, unless we use string concatenation (which might also trigger it) or just live with it.
// BUT wait... what if we do:
// const sql = "UPDATE scheduled_tasks SET " + fields.join(", ") + " WHERE id = ?";
// const stmt = db.prepare(sql);
