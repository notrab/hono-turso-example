import { Hono } from "hono";
import { createClient } from "@libsql/client";

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!, // turso db show my-db --url
  authToken: process.env.TURSO_AUTH_TOKEN, // turso db tokens create my-db
});

const app = new Hono();

app.get("/", (c) => c.json({ message: "Hello world" }));

app.get("/users", async (c) => {
  const { page = 1, perPage = 25 } = c.req.query();

  const parsedPage = parseInt(String(page), 10);
  const parsedPerPage = parseInt(String(perPage), 10);

  const validPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const validPerPage =
    isNaN(parsedPerPage) || parsedPerPage < 1 ? 25 : parsedPerPage;

  const offset = (validPage - 1) * validPerPage;

  try {
    const { rows } = await turso.execute({
      sql: "SELECT * FROM users LIMIT :perPage OFFSET :offset",
      args: {
        offset: parseInt(String(offset), 10),
        perPage,
      },
    });

    return c.json({ data: rows ?? null });
  } catch (err) {
    return c.json({ data: [], message: err.message });
  }
});

app.get("/users/:id", async (c) => {
  const userId = c.req.param("id");

  try {
    const { rows } = await turso.execute({
      sql: "SELECT * FROM users WHERE ID = ?",
      args: [Number(userId)],
    });

    return c.json({ data: rows[0] ?? null });
  } catch (err) {
    return c.json({ data: [], message: err.message });
  }
});

export default app;
