const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.h0us0hz.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const categoriesCollection = client
      .db("secondTuneDB")
      .collection("categories");

    const usersCollection = client.db("secondTuneDB").collection("users");

    const productsCollection = client.db("secondTuneDB").collection("products");

    // API for saving new user to DB
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // API for checking if a user is an Admin
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "Admin" });
    });

    // API for checking if a user is a Buyer
    app.get("/users/buyer/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isBuyer: user?.role === "Buyer" });
    });

    // API for checking if a user is a Seller
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === "Seller" });
    });

    // API for reading all product categories
    app.get("/categories", async (req, res) => {
      const query = {};
      const options = await categoriesCollection.find(query).toArray();
      res.send(options);
    });

    // API for reading a specific category as per it's ID
    app.get("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const category = await categoriesCollection.findOne(query);
      res.send(category);
    });

    // API for adding a new product as per category
    app.post("/products", async (req, res) => {
      const product = req.body;
      console.log(product);
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("The second tune server is running!");
});

app.listen(port, () =>
  console.log(`The second tune server is listening to port ${port}`)
);
