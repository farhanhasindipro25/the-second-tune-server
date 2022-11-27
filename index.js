const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
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

    // API for reading all product categories
    app.get("/categories", async (req, res) => {
      const query = {};
      const options = await categoriesCollection.find(query).toArray();
      res.send(options);
    });

    // API for saving new user to DB
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
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
