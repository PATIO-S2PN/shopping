const ShoppingService = require("../services/shopping-service");
const { PublishCustomerEvent, SubscribeMessage } = require("../utils");
const UserAuth = require("./middlewares/auth");
const { CUSTOMER_SERVICE } = require("../config");
const { ADMIN_SERVICE } = require("../config");
const { PublishMessage } = require("../utils");

module.exports = (app, channel) => {
  const service = new ShoppingService();

  SubscribeMessage(channel, service);

  // Cart
  app.post("/cart", UserAuth, async (req, res, next) => {
    const { _id } = req.user;
    const { product_id, qty } = req.body;
    const { data } = await service.AddCartItem(_id, product_id, qty);
    res.status(200).json(data);
  });

  app.delete("/cart/:id", UserAuth, async (req, res, next) => {
    const { _id } = req.user;
    const productId = req.params.id;
    const { data } = await service.RemoveCartItem(_id, productId);
    res.status(200).json(data);
  });

  app.get("/cart", UserAuth, async (req, res, next) => {
    const { _id } = req.user;
    const data = await service.GetCart(_id);
    return res.status(200).json(data);
  });

  // Wishlist
  app.post("/wishlist", UserAuth, async (req, res, next) => {
    const { _id } = req.user;
    const { product_id } = req.body;
    console.log(req.body);
    const data = await service.AddToWishlist(_id, product_id);
    return res.status(200).json(data);
  });
  app.get("/wishlist", UserAuth, async (req, res, next) => {
    const { _id } = req.user;
    const data = await service.GetWishlist(_id);
    return res.status(200).json(data);
  });
  app.delete("/wishlist/:id", UserAuth, async (req, res, next) => {
    const { _id } = req.user;
    const product_id = req.params.id;
    const data = await service.RemoveFromWishlist(_id, product_id);
    return res.status(200).json(data);
  });

  // Orders
  app.post("/order", UserAuth, async (req, res, next) => {
    const { _id } = req.user;
    const { txnNumber } = req.body;
    const data = await service.CreateOrder(_id, txnNumber);
    return res.status(200).json(data);
  });

  app.get("/order/:id", UserAuth, async (req, res, next) => {
    const { _id } = req.user;
    const orderId = req.params.id;
    const data = await service.GetOrder(_id, orderId);
    return res.status(200).json(data);
});

app.get("/orders", UserAuth, async (req, res, next) => {
    const { _id } = req.user;
    const data = await service.GetOrders(_id);
    return res.status(200).json(data);
});

app.get("/orders/all", UserAuth, async (req, res, next) => {
  try {
    const data = await service.GetAllOrders();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch("/order/:id/status", UserAuth, async (req, res, next) => {
  const { _id: customerId } = req.user;
  const { id: orderId } = req.params;
  const { newStatus } = req.body;

  try {
      const data = await service.UpdateOrderStatus(customerId, orderId, newStatus);
      return res.status(200).json(data);
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message || "An error occurred" });
  }
});

  app.get("/whoami", (req, res, next) => {
    return res.status(200).json({ msg: "/shoping : I am Shopping Service" });
  });
};
