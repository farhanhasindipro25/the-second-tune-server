const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
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

// middleware function to verify a JSON WEB TOKEN(JWT)
function verifyJWT(req, res, next) {
  // console.log("Token inside verifyJWT", req.headers.authorization);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("Unauthorized Access");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const categoriesCollection = client
      .db("secondTuneDB")
      .collection("categories");

    const usersCollection = client.db("secondTuneDB").collection("users");

    const productsCollection = client.db("secondTuneDB").collection("products");

    const bookingsCollection = client.db("secondTuneDB").collection("bookings");

    const wishListCollection = client.db("secondTuneDB").collection("wishlist");

    // middleware for verifying a seller - Must be used after the verifyJWT middleware
    const verifySeller = async (req, res, next) => {
      // console.log("Inside verifySeller", req.decoded.email);

      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const seller = await usersCollection.findOne(query);

      if (seller?.role !== "Seller") {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      next();
    };

    // middleware for verifying a Buyer - Must be used after the verifyJWT middleware
    const verifyBuyer = async (req, res, next) => {
      // console.log("Inside verifyBuyer", req.decoded.email);

      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const buyer = await usersCollection.findOne(query);

      if (buyer?.role !== "Buyer") {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      next();
    };

    // middleware for verifying a Admin - Must be used after the verifyJWT middleware
    const verifyAdmin = async (req, res, next) => {
      // console.log("Inside verifyAdmin", req.decoded.email);

      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const admin = await usersCollection.findOne(query);

      if (admin?.role !== "Admin") {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      next();
    };

    // API for creating a JWT
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "5h",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });

    // API for adding a product to wishlist
    app.post("/wishlist", verifyJWT, verifyBuyer, async (req, res) => {
      const wishedProduct = req.body;
      const result = await wishListCollection.insertOne(wishedProduct);
      res.send(result);
    });

    // API for reading wishlist of a specific user via email
    app.get("/wishlist", verifyJWT, async (req, res) => {
      const query = { buyerEmail: req.query.email };
      // console.log(query);
      const wished = await wishListCollection.find(query).toArray();
      res.send(wished);
    });

    // API for adding a new booking of a product
    app.post("/bookings", verifyJWT, verifyBuyer, async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    // API for reading bookings of a specific user via email
    app.get("/bookings", verifyJWT, verifyBuyer, async (req, res) => {
      const buyerEmail = req.query.email;
      const query = { buyerEmail };
      const decodedEmail = req.decoded.email;
      if (buyerEmail !== decodedEmail) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const buyers = await bookingsCollection.find(query).toArray();
      res.send(buyers);
    });

    // API for deleting a specific booking
    app.delete("/bookings/:id", verifyJWT, verifyBuyer, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bookingsCollection.deleteOne(query);
      res.send(result);
    });

    // API for saving new user to DB
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // API for reading all users
    app.get("/users", async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
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

    // API for reading all users who are buyers
    app.get("/users/buyer", async (req, res) => {
      const query = { role: "Buyer" };
      const buyers = await usersCollection.find(query).toArray();
      res.send(buyers);
    });

    // API for deleting a specific buyer
    app.delete("/users/buyer/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // API for checking if a user is a Seller
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === "Seller" });
    });

    // API for reading all users who are sellers
    app.get("/users/seller", async (req, res) => {
      const query = { role: "Seller" };
      const sellers = await usersCollection.find(query).toArray();
      res.send(sellers);
    });

    // API for verifying a seller
    app.patch("/users/seller/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const query = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: status,
        },
      };
      const result = await usersCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    // API for deleting a specific seller
    app.delete(
      "/users/seller/:id",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await usersCollection.deleteOne(query);
        res.send(result);
      }
    );

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
    app.post("/products", verifyJWT, verifySeller, async (req, res) => {
      const product = req.body;
      console.log(product);
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    // API for reading all products of a specific category
    app.get("/products", async (req, res) => {
      console.log(req.query.categoryId);
      let query = {};
      if (req.query.categoryId) {
        query = { categoryId: req.query.categoryId };
      }
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    });

    // API for deleting a specific product
    app.delete("/products/:id", verifyJWT, verifySeller, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    // API for reading added product information of a specific seller.
    app.get("/myProducts", async (req, res) => {
      const email = req.query.email;
      const query = { sellerEmail: email };
      // console.log(query);
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    });

    // API for advertising a product
    app.patch("/myProducts/:id", verifyJWT, verifySeller, async (req, res) => {
      const id = req.params.id;
      const ad = req.body.ad;
      const query = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          ad: ad,
        },
      };
      const result = await productsCollection.updateOne(query, updatedDoc);
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
