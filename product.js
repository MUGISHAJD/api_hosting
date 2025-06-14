require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "uY@9!k3F$zXlqA#P7vRt^dMw0NgJ6LsB";
const fs = require('fs');
const cors = require('cors');
app.use(cors());

const path = require("path");
const SECRET_KEY = 'abefghijklmnopqrstuvwxyz1_234567890jdfyhgtuasjgfdsbfeadbmfjdfbvchjdbv_edhs';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create a reusable function to get a database connection
async function getDBConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, // default DB name or your custom one
    port: 4000,
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync('./certs/isrgrootx1.pem') // Optional: downloaded from TiDB Cloud
    }
  });
}

// Example usage of the reusable function
(async () => {
  try {
    const connection = await getDBConnection();
    console.log('Connected to MySQL database!');

    // Example query
    const [results] = await connection.query("SELECT * FROM users LIMIT 10");
    console.log(results);

    // Close the connection when done
    await connection.end();
  } catch (err) {
    console.error('Connection error:', err);
  }
})();

// ---------------------------
// JWT Middleware
// ---------------------------

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // <-- Uncommented and properly defined

  if (!token) return res.status(401).json({ error: "Token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });

    req.user = user; // You can access this in any route
    next();
  });
}



// ---------------------------
// User Signup
// ---------------------------
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  try {
    const db = await getDBConnection();
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute("INSERT INTO users (username, password) VALUES (?, ?)", [
      username,
      hashedPassword,
    ]);

    res.status(201).json({ message: "User registered" });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// ---------------------------
// User Login
// ---------------------------
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt:", { username, password });

  try {
    const db = await getDBConnection();
    const [rows] = await db.execute("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (rows.length === 0) {
      console.log("No user found with username:", username);
      return res.status(400).json({ error: "User not found" });
    }

    const user = rows[0];
    console.log("User from DB:", user);

    const match = await bcrypt.compare(password, user.password);
    console.log("Password match result:", match);

    if (!match) return res.status(400).json({ error: "Incorrect password" });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Login failed" });
  }

});

// ---------------------------
// Protected Product APIs
// ---------------------------
app.use("/products", authenticateToken);
// ---------------------------
// GET All Products
// ---------------------------
app.get("/products", async (req, res) => {
  try {
    const db = await getDBConnection();
    const [rows] = await db.execute("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ---------------------------
// GET Product By ID
// ---------------------------
app.get("/products/:id", async (req, res) => {
  try {
    const db = await getDBConnection();
    const [rows] = await db.execute(
      "SELECT * FROM products WHERE product_id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// ---------------------------
// POST Register New Product
// ---------------------------
app.post("/products", async (req, res) => {
  const { product_name, description, quantity, price } = req.body;

  if (!product_name || !quantity || !price) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const db = await getDBConnection();
    const [result] = await db.execute(
      "INSERT INTO products (product_name, description, quantity, price) VALUES (?, ?, ?, ?)",
      [product_name, description, quantity, price]
    );
    res
      .status(201)
      .json({ message: "Product added", productId: result.insertId });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Failed to register product" });
  }
});

// ---------------------------
// PUT Update Product
// ---------------------------
app.put("/products/:id", async (req, res) => {
  const { product_name, description, quantity, price } = req.body;

  try {
    const db = await getDBConnection();
    const [result] = await db.execute(
      "UPDATE products SET product_name = ?, description = ?, quantity = ?, price = ? WHERE product_id = ?",
      [product_name, description, quantity, price, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product updated" });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// ---------------------------
// DELETE Product
// ---------------------------
app.delete("/products/:id", async (req, res) => {
  try {
    const db = await getDBConnection();
    const [result] = await db.execute(
      "DELETE FROM products WHERE product_id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// ---------------------------
// Start Server
// ---------------------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
