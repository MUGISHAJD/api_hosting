# Secure Product Management API

A Node.js RESTful API for user authentication and product management using Express, MySQL, and JWT. The API includes user signup/login with hashed passwords, protected routes for managing products, and secure MySQL connections using SSL.

## 🚀 Features

- 🔐 User authentication using JWT
- 🔒 Passwords hashed with bcrypt
- ✅ Middleware-protected routes
- 📦 Full CRUD operations for products
- 🛡 Secure connection to MySQL database (supports TiDB Cloud)
- 📜 Simple project structure with reusable DB connection logic

---

## 📁 Project Structure

├── certs/
│ └── isrgrootx1.pem # SSL certificate for secure MySQL connection
├── .env # Environment variables
├── index.js # Main application file
├── package.json
└── README.md

---

## ⚙ Installation & Setup

1. *Clone the repository*
   bash
   $ git clone https://github.com/MUGISHAJD/api_hosting.git
   cd product-api
  2. **Install dependencies**
      npm install 
Configure environment variables

Create a .env file in the root directory and add:

 PORT=3000
DB_HOST=your-mysql-host
DB_USER=your-mysql-username
DB_PASSWORD=your-mysql-password
DB_NAME=your-database-name
JWT_SECRET=your-secret-key
Add MySQL SSL Certificate 


Save your SSL certificate (e.g. isrgrootx1.pem) in a certs/ folder. If using TiDB Cloud, download the appropriate certificate.

Start the server

node index.js

### 🧪 Example SQL Table Structure
 CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INT,
  price DECIMAL(10,2)
);

### 🔑 Authentication
#### ✅ POST /signup
Register a new user.

 json
{
  "username": "johndoe",
  "password": "yourpassword"
}

#### ✅ POST /login
Authenticate user and return a JWT token.
 json

{
  "username": "johndoe",
  "password": "yourpassword"
}
Returns:
json
{
  "token": "<jwt-token>"
}

Include this token in Authorization: Bearer <token> for protected routes.

#### 📦 Product API (Protected Routes)
All routes below require JWT in the Authorization header.

🔍 GET /products
Fetch all products.

🔍 GET /products/:id
Fetch a single product by ID.

📝 POST /products
Add a new product.

json
{
  "product_name": "Laptop",
  "description": "High-end gaming laptop",
  "quantity": 10,
  "price": 1200.00
}
✏ PUT /products/:id
Update product by ID.

json
Copy
Edit
{
  "product_name": "Updated Name",
  "description": "Updated description",
  "quantity": 5,
  "price": 899.99
}
❌ DELETE /products/:id
Delete a product by ID.
```
### 🛠 Built With
- [x] Express.js
- [x] MySQL2
- [x] bcryptjs
- [x] jsonwebtoken
- [x] dotenv

### 🔐 Security Notes
Passwords are hashed using bcrypt before storing in the DB.

JWT tokens expire in 1 hour.

SSL/TLS is enforced for MySQL connections.
