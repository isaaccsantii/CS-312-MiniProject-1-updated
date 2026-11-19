// CS 312 Mini-Project 1 - Blog Web Application (Node.js + Express.js + EJS)
// Posts live in an in-memory array, so they reset whenever the server restarts.

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Categories offered in the dropdown (bonus challenge)
const CATEGORIES = ["Tech", "Lifestyle", "Education", "Travel", "Other"];

// Temporary server-side storage
let posts = [];
let nextId = 1;

// ---------- Middleware ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true })); // parses HTML form bodies

// Values every view can use
app.use((req, res, next) => {
  res.locals.categories = CATEGORIES;
  res.locals.formatDate = (d) =>
    new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  next();
});

// ---------- Helpers ----------
function findPost(id) {
  return posts.find((p) => p.id === Number(id));
}

// Trims input and checks the required fields. Returns an error message or null.
function validatePost(body) {
  const author = (body.author || "").trim();
  const title = (body.title || "").trim();
  const content = (body.content || "").trim();
  const category = CATEGORIES.includes(body.category) ? body.category : "Other";
  if (!author || !title || !content) {
    return { error: "Name, title, and content are all required.", data: { author, title, content, category } };
  }
  return { error: null, data: { author, title, content, category } };
}

// ---------- Routes ----------

// Home page: create form + list of posts, optionally filtered by ?category=
app.get("/", (req, res) => {
  const selected = req.query.category || "All";
  const visible =
    selected === "All" ? posts : posts.filter((p) => p.category === selected);

  res.render("index", {
    posts: [...visible].sort((a, b) => b.createdAt - a.createdAt), // newest first
    selected,
    error: null,
    form: {},
  });
});

// Create a post
app.post("/posts", (req, res) => {
  const { error, data } = validatePost(req.body);
  if (error) {
    return res.status(400).render("index", {
      posts: [...posts].sort((a, b) => b.createdAt - a.createdAt),
      selected: "All",
      error,
      form: data, // keep what the user typed
    });
  }

  posts.push({ id: nextId++, ...data, createdAt: new Date(), updatedAt: null });
  res.redirect("/");
});

// Show the edit form pre-filled with the current post
app.get("/posts/:id/edit", (req, res) => {
  const post = findPost(req.params.id);
  if (!post) return res.status(404).render("404");
  res.render("edit", { post, error: null });
});

// Save an edited post (replaces the original in the array)
app.post("/posts/:id/edit", (req, res) => {
  const post = findPost(req.params.id);
  if (!post) return res.status(404).render("404");

  const { error, data } = validatePost(req.body);
  if (error) {
    return res.status(400).render("edit", { post: { ...post, ...data }, error });
  }

  const index = posts.findIndex((p) => p.id === post.id);
  posts[index] = { ...post, ...data, updatedAt: new Date() };
  res.redirect("/");
});

// Delete a post
app.post("/posts/:id/delete", (req, res) => {
  posts = posts.filter((p) => p.id !== Number(req.params.id));
  res.redirect("/");
});

// Anything else
app.use((req, res) => res.status(404).render("404"));

app.listen(PORT, () => {
  console.log(`Blog running at http://localhost:${PORT}`);
});
