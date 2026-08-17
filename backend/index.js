require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client("693959344684-549u30r3prgohjhli9qdefgp6fcabqha.apps.googleusercontent.com");
const http = require("http");
const { Server } = require("socket.io");

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const port = process.env.PORT || 4000;

const app = express();
app.use(express.json());
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Database Connection With MongoDB
mongoose.connect(process.env.MONGO_URI);

// paste your mongoDB Connection string above with password
// password should not contain '@' special character


//Image Storage Engine 
const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
  }
})
const upload = multer({ storage: storage })
app.post("/upload", upload.array('product', 4), (req, res) => {
  const image_urls = req.files.map(file => `/images/${file.filename}`);
  res.json({
    success: 1,
    image_urls: image_urls
  })
})


// Route for Images folder
app.use('/images', express.static('upload/images'));


// MiddleWare to fetch user from token
const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, "secret_ecom");
    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
};


// Schema for creating user model
const Users = mongoose.model("Users", {
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  cartData: { type: Object },
  addresses: { type: Array, default: [] },
  date: { type: Date, default: Date.now() },
});


// Schema for creating Product
const Product = mongoose.model("Product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  images: { type: [String], default: [] },
  category: { type: String, required: true },
  type: { type: String, default: "" },
  tags: { type: [String], default: [] },
  new_price: { type: Number },
  old_price: { type: Number },
  date: { type: Date, default: Date.now },
  avilable: { type: Boolean, default: true },
});
// Schema for Orders
const Order = mongoose.model("Order", {
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  items: [
    {
      productId: { type: Number },
      name: { type: String },
      size: { type: String },
      quantity: { type: Number },
      price: { type: Number },
    }
  ],
  shipping: {
    fullName: { type: String },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    district: { type: String },
    postalCode: { type: String },
  },
  totalAmount: { type: Number },
  paymentIntentId: { type: String },
  status: { type: String, default: "paid" },
  date: { type: Date, default: Date.now },
});

// Create payment intent
app.post("/create-payment-intent", fetchuser, async (req, res) => {
  const { amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // stripe uses cents
      currency: "lkr",
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ errors: error.message });
  }
});

// Place order after successful payment
app.post("/placeorder", fetchuser, async (req, res) => {
  try {
    const { items, shipping, totalAmount, paymentIntentId, promoCode } = req.body;
    const order = new Order({
      userId: req.user.id,
      items,
      shipping,
      totalAmount,
      paymentIntentId,
      status: "paid",
    });
    await order.save();

    // Mark promo code as used
    if (promoCode) {
      await PromoCode.findOneAndUpdate({ code: promoCode }, { used: true });
    }

    // Clear user cart
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: {} });

    res.json({ success: true, orderId: order._id });
  } catch (error) {
    res.status(500).json({ success: false, errors: error.message });
  }
});
// Schema for Complaints
const Complaint = mongoose.model("Complaint", {
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  userName: { type: String },
  userEmail: { type: String },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: "open" }, // open, in-progress, resolved
  messages: [{
    sender: { type: String }, // "customer" or "officer"
    senderName: { type: String },
    text: { type: String },
    timestamp: { type: Date, default: Date.now },
  }],
  date: { type: Date, default: Date.now },
  hasNewMessageForAdmin: { type: Boolean, default: true },
  hasNewMessageForCustomer: { type: Boolean, default: false },
});

// Submit complaint
app.post("/submitcomplaint", fetchuser, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);
    const complaint = new Complaint({
      userId: req.user.id,
      userName: user.name,
      userEmail: user.email,
      subject: req.body.subject,
      description: req.body.description,
      status: "open",
      messages: [{
        sender: "customer",
        senderName: user.name,
        text: req.body.description,
        timestamp: new Date(),
      }],
    });
    await complaint.save();
    res.json({ success: true, complaintId: complaint._id });
  } catch (error) {
    res.status(500).json({ success: false, errors: "Failed to submit complaint" });
  }
});

// Get complaints for logged in customer
app.get("/mycomplaints", fetchuser, async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ errors: "Failed to fetch complaints" });
  }
});

// Get all complaints for admin
app.get("/admin/complaints", async (req, res) => {
  try {
    const complaints = await Complaint.find({}).sort({ date: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ errors: "Failed to fetch complaints" });
  }
});

// Get unread complaint count for admin badge
app.get("/admin/complaints/unread", async (req, res) => {
  try {
    const count = await Complaint.countDocuments({ hasNewMessageForAdmin: true });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ count: 0 });
  }
});

// Update complaint status
app.post("/admin/complaint/status", async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.body.complaintId, { status: req.body.status });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Mark complaint as read by customer
app.post("/complaint/markread", fetchuser, async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.body.complaintId, { hasNewMessageForCustomer: false });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Get all unread notifications for customer
app.get("/notifications", fetchuser, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      userId: req.user.id,
      hasNewMessageForCustomer: true,
    });
    const notifications = complaints.map(c => ({
      complaintId: c._id,
      subject: c.subject,
      lastMessage: c.messages[c.messages.length - 1],
    }));
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ errors: "Failed to fetch notifications" });
  }
});

// Mark all notifications as read
app.post("/notifications/markallread", fetchuser, async (req, res) => {
  try {
    await Complaint.updateMany({ userId: req.user.id }, { hasNewMessageForCustomer: false });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Delete complaint
app.post("/deletecomplaint", fetchuser, async (req, res) => {
  try {
    await Complaint.findOneAndDelete({ _id: req.body.complaintId, userId: req.user.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, errors: "Failed to delete complaint" });
  }
});

// Socket.io real-time chat
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join_complaint", (complaintId) => {
    socket.join(complaintId);
    console.log(`Joined room: ${complaintId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      const { complaintId, sender, senderName, text } = data;
      const message = { sender, senderName, text, timestamp: new Date() };

      const updateData = {
        $push: { messages: message },
        hasNewMessageForAdmin: sender === "customer",
        hasNewMessageForCustomer: sender === "officer",
      };

      await Complaint.findByIdAndUpdate(complaintId, updateData);
      io.to(complaintId).emit("receive_message", message);
    } catch (error) {
      console.error("Socket message error:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});
// Schema for Reviews
const Review = mongoose.model("Review", {
  productId: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  username: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

// Get reviews for a product
app.get("/reviews/:productId", async (req, res) => {
  const reviews = await Review.find({ productId: Number(req.params.productId) }).sort({ date: -1 });
  res.json(reviews);
});

// Add a review (logged-in users only)
app.post("/addreview", fetchuser, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);
    if (!user) return res.status(401).json({ success: false, errors: "User not found" });

    const existing = await Review.findOne({ productId: req.body.productId, userId: req.user.id });
    if (existing) return res.status(400).json({ success: false, errors: "You have already reviewed this product" });

    const review = new Review({
      productId: req.body.productId,
      userId: req.user.id,
      username: user.name,
      rating: req.body.rating,
      comment: req.body.comment,
    });
    await review.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, errors: "Failed to submit review" });
  }
});

// Check if user can review a product
app.get("/canreview/:productId", fetchuser, async (req, res) => {
  try {
    const delivered = await Order.findOne({
      userId: req.user.id,
      status: "Delivered",
      "items.productId": Number(req.params.productId),
    });
    const alreadyReviewed = await Review.findOne({
      productId: Number(req.params.productId),
      userId: req.user.id,
    });
    res.json({
      canReview: !!delivered && !alreadyReviewed,
      alreadyReviewed: !!alreadyReviewed,
    });
  } catch (error) {
    res.status(500).json({ canReview: false });
  }
});

// Update name
app.post("/updatename", fetchuser, async (req, res) => {
  try {
    await Users.findByIdAndUpdate(req.user.id, { name: req.body.name });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, errors: "Failed to update name" });
  }
});

// Update password
app.post("/updatepassword", fetchuser, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);
    if (req.body.currentPassword !== user.password) {
      return res.status(400).json({ success: false, errors: "Current password is incorrect" });
    }
    await Users.findByIdAndUpdate(req.user.id, { password: req.body.newPassword });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, errors: "Failed to update password" });
  }
});

// Add address (max 3)
app.post("/addaddress", fetchuser, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);
    if (user.addresses.length >= 3) {
      return res.status(400).json({ success: false, errors: "Maximum 3 addresses allowed" });
    }
    const newAddress = {
      id: Date.now().toString(),
      fullName: req.body.fullName,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,
      district: req.body.district,
      postalCode: req.body.postalCode,
      isDefault: user.addresses.length === 0,
    };
    user.addresses.push(newAddress);
    await Users.findByIdAndUpdate(req.user.id, { addresses: user.addresses });
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, errors: "Failed to add address" });
  }
});

// Delete address
app.post("/deleteaddress", fetchuser, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);
    user.addresses = user.addresses.filter(a => a.id !== req.body.addressId);
    if (user.addresses.length > 0 && !user.addresses.find(a => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }
    await Users.findByIdAndUpdate(req.user.id, { addresses: user.addresses });
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, errors: "Failed to delete address" });
  }
});

// Set default address
app.post("/setdefaultaddress", fetchuser, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);
    user.addresses = user.addresses.map(a => ({ ...a, isDefault: a.id === req.body.addressId }));
    await Users.findByIdAndUpdate(req.user.id, { addresses: user.addresses });
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, errors: "Failed to set default address" });
  }
});

// Get order history for logged in user
app.get("/getorders", fetchuser, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ errors: "Failed to fetch orders" });
  }
});

// Get all orders for admin
app.get("/admin/allorders", async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ date: -1 });
    // Attach user info to each order
    const ordersWithUser = await Promise.all(orders.map(async (order) => {
      const user = await Users.findById(order.userId).select("name email");
      return { ...order._doc, user };
    }));
    res.json(ordersWithUser);
  } catch (error) {
    res.status(500).json({ errors: "Failed to fetch orders" });
  }
});
// Delete complaint (admin only)
app.post("/admin/deletecomplaint", async (req, res) => {
  try {
    await Complaint.findByIdAndDelete(req.body.complaintId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, errors: "Failed to delete complaint" });
  }
});

// Update order status
app.post("/admin/updateorderstatus", async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, errors: "Failed to update status" });
  }
});
// Google Login
app.post('/google-login', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: "693959344684-549u30r3prgohjhli9qdefgp6fcabqha.apps.googleusercontent.com",
    });
    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    let user = await Users.findOne({ email });
    if (!user) {
      // Auto-register Google users
      user = new Users({
        name,
        email,
        password: await bcrypt.hash(sub, 10), // use Google sub as placeholder password
        cartData: {},
      });
      await user.save();
    }
    const data = { user: { id: user.id } };
    const token = jwt.sign(data, 'secret_ecom');
    res.json({ success: true, token });
  } catch (error) {
    res.status(400).json({ success: false, errors: "Google login failed." });
  }
});
// Get products for chatbot context
app.get("/chatbot/products", async (req, res) => {
  try {
    const products = await Product.find({}, "name category type tags new_price old_price description");
    res.json(products);
  } catch (error) {
    res.status(500).json({ errors: "Failed to fetch products" });
  }
});

// Save escalated complaint
app.post("/chatbot/escalate", async (req, res) => {
  try {
    const { userId, messages, issue } = req.body;
    // We'll save to a Complaints collection later when building the officer portal
    // For now just acknowledge
    res.json({ success: true, message: "Your issue has been escalated to a customer officer. We will get back to you shortly." });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});
// Analytics: Top selling products
app.get("/admin/analytics/topselling", async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: "cancelled" } });
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            name: item.name,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0,
          };
        }
        productSales[item.productId].totalQuantity += item.quantity;
        productSales[item.productId].totalRevenue += item.price * item.quantity;
        productSales[item.productId].orderCount += 1;
      });
    });
    const sorted = Object.values(productSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ errors: "Failed to fetch top selling data" });
  }
});

// Analytics: Weekly sales
app.get("/admin/analytics/weeklysales", async (req, res) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const orders = await Order.find({
        date: { $gte: date, $lt: nextDate },
        status: { $ne: "cancelled" }
      });
      days.push({
        date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        revenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        orders: orders.length,
      });
    }
    res.json(days);
  } catch (error) {
    res.status(500).json({ errors: "Failed to fetch weekly sales" });
  }
});

// Analytics: Inventory suggestions
app.get("/admin/analytics/inventory", async (req, res) => {
  try {
    const products = await Product.find({});
    const orders = await Order.find({ status: { $ne: "cancelled" } });
    const salesMap = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!salesMap[item.productId]) salesMap[item.productId] = 0;
        salesMap[item.productId] += item.quantity;
      });
    });
    const result = products.map(p => ({
      productId: p.id,
      name: p.name,
      category: p.category,
      type: p.type || "N/A",
      totalSold: salesMap[p.id] || 0,
      new_price: p.new_price,
    })).sort((a, b) => b.totalSold - a.totalSold);
    res.json(result);
  } catch (error) {
    res.status(500).json({ errors: "Failed to fetch inventory data" });
  }
});
// Monthly report data
app.get("/admin/analytics/monthlyreport", async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const orders = await Order.find({
      date: { $gte: startOfMonth, $lte: endOfMonth },
      status: { $ne: "cancelled" }
    });

    // Daily breakdown
    const dailyMap = {};
    orders.forEach(order => {
      const day = new Date(order.date).getDate();
      if (!dailyMap[day]) dailyMap[day] = { revenue: 0, orders: 0 };
      dailyMap[day].revenue += order.totalAmount || 0;
      dailyMap[day].orders += 1;
    });

    const daysInMonth = endOfMonth.getDate();
    const dailyBreakdown = [];
    for (let d = 1; d <= daysInMonth; d++) {
      dailyBreakdown.push({
        day: d,
        revenue: dailyMap[d]?.revenue || 0,
        orders: dailyMap[d]?.orders || 0,
      });
    }

    // Top selling
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.name,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0,
          };
        }
        productSales[item.productId].totalQuantity += item.quantity;
        productSales[item.productId].totalRevenue += item.price * item.quantity;
        productSales[item.productId].orderCount += 1;
      });
    });
    const topSelling = Object.values(productSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    // Inventory
    const products = await Product.find({});
    const allOrders = await Order.find({ status: { $ne: "cancelled" } });
    const salesMap = {};
    allOrders.forEach(order => {
      order.items.forEach(item => {
        if (!salesMap[item.productId]) salesMap[item.productId] = 0;
        salesMap[item.productId] += item.quantity;
      });
    });
    const inventory = products.map(p => ({
      name: p.name,
      category: p.category,
      type: p.type || "N/A",
      totalSold: salesMap[p.id] || 0,
    })).sort((a, b) => b.totalSold - a.totalSold);

    res.json({
      month: now.toLocaleString("default", { month: "long", year: "numeric" }),
      totalRevenue: orders.reduce((s, o) => s + (o.totalAmount || 0), 0),
      totalOrders: orders.length,
      avgOrderValue: orders.length > 0
        ? Math.round(orders.reduce((s, o) => s + (o.totalAmount || 0), 0) / orders.length)
        : 0,
      dailyBreakdown,
      topSelling,
      inventory,
    });
  } catch (error) {
    res.status(500).json({ errors: "Failed to generate report" });
  }
});
// Promo Code schema
const PromoCode = mongoose.model("PromoCode", {
  code: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  discount: { type: Number, default: 200 },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Generate promo code
app.post("/promo/generate", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false });

    // Check if already has unused code
    const existing = await PromoCode.findOne({ email, used: false });
    if (existing) return res.json({ success: true, code: existing.code });

    // Generate unique code
    const code = "EY200-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const promo = new PromoCode({ code, email });
    await promo.save();
    res.json({ success: true, code });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Validate promo code
app.post("/promo/validate", fetchuser, async (req, res) => {
  try {
    const { code } = req.body;
    const promo = await PromoCode.findOne({ code: code.toUpperCase() });
    if (!promo) return res.json({ success: false, errors: "Invalid promo code." });
    if (promo.used) return res.json({ success: false, errors: "This promo code has already been used." });

    // Check if first order
    const orderCount = await Order.countDocuments({ userId: req.user.id });
    if (orderCount > 0) return res.json({ success: false, errors: "This code is only valid on your first order." });

    res.json({ success: true, discount: promo.discount, code: promo.code });
  } catch (error) {
    res.status(500).json({ success: false, errors: "Failed to validate code." });
  }
});
// Newsletter schema
const Newsletter = mongoose.model("Newsletter", {
  email: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
});

// Subscribe to newsletter
app.post("/newsletter/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, errors: "Invalid email" });
    }
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      return res.json({ success: false, already: true });
    }
    const subscriber = new Newsletter({ email });
    await subscriber.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, errors: "Failed to subscribe" });
  }
});
// Get user profile
app.get("/getuserprofile", fetchuser, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id).select("-password -cartData");
    res.json(user);
  } catch (error) {
    res.status(500).json({ errors: "Failed to fetch profile" });
  }
});
// ROOT API Route For Testing
app.get("/", (req, res) => {
  res.send("Root");
});


// Create an endpoint at ip/login for login the user and giving auth-token
app.post('/login', async (req, res) => {
  console.log("Login");
  let success = false;
  let user = await Users.findOne({ email: req.body.email });
  if (user) {
    const passCompare = await bcrypt.compare(req.body.password, user.password);
    if (passCompare) {
      const data = { user: { id: user.id } };
      success = true;
      const token = jwt.sign(data, 'secret_ecom');
      res.json({ success, token });
    } else {
      return res.status(400).json({ success: false, errors: "Incorrect email or password." });
    }
  } else {
    return res.status(400).json({ success: false, errors: "Incorrect email or password." });
  }
});


//Create an endpoint at ip/auth for regestring the user & sending auth-token
app.post('/signup', async (req, res) => {
  console.log("Sign Up");
  let check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({ success: false, errors: "An account with this email already exists." });
  }
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password: hashedPassword,
    cartData: {},
  });
  await user.save();
  const data = { user: { id: user.id } };
  const token = jwt.sign(data, 'secret_ecom');
  res.json({ success: true, token });
});


// endpoint for getting all products data
app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  console.log("All Products");
  res.send(products);
});


// endpoint for getting latest products data
app.get("/newcollections", async (req, res) => {
  let products = await Product.find({});
  let arr = products.slice(0).slice(-8);
  console.log("New Collections");
  res.send(arr);
});


// endpoint for getting womens products data
app.get("/popularinwomen", async (req, res) => {
  let products = await Product.find({ category: "women" });
  let arr = products.splice(0, 4);
  console.log("Popular In Women");
  res.send(arr);
});

// endpoint for getting womens products data
app.post("/relatedproducts", async (req, res) => {
  console.log("Related Products");
  const {category} = req.body;
  const products = await Product.find({ category });
  const arr = products.slice(0, 4);
  res.send(arr);
});


// Create an endpoint for saving the product in cart
app.post('/addtocart', fetchuser, async (req, res) => {
  console.log("Add Cart");
  let userData = await Users.findOne({ _id: req.user.id });
  if (!userData.cartData || typeof userData.cartData !== "object") {
    userData.cartData = {};
  }
  if (!userData.cartData[req.body.itemId]) {
    userData.cartData[req.body.itemId] = 0;
  }
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Added")
})


// Create an endpoint for removing the product in cart
app.post('/removefromcart', fetchuser, async (req, res) => {
  console.log("Remove Cart");
  let userData = await Users.findOne({ _id: req.user.id });
  if (!userData.cartData || typeof userData.cartData !== "object") {
    userData.cartData = {};
  }
  if (userData.cartData[req.body.itemId] && userData.cartData[req.body.itemId] != 0) {
    userData.cartData[req.body.itemId] -= 1;
  }
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Removed");
})


// Create an endpoint for getting cartdata of user
app.post('/getcart', fetchuser, async (req, res) => {
  console.log("Get Cart");
  let userData = await Users.findOne({ _id: req.user.id });
  res.json(userData.cartData);

})


app.post("/addproduct", async (req, res) => {
  try {
    if (!req.body.description || !req.body.description.trim()) {
      return res.status(400).json({ success: false, errors: "Description is required." });
    }
    if (!req.body.name || !req.body.name.trim()) {
      return res.status(400).json({ success: false, errors: "Product name is required." });
    }

    let products = await Product.find({});
    let id;
    if (products.length > 0) {
      let last_product_array = products.slice(-1);
      let last_product = last_product_array[0];
      id = last_product.id + 1;
    }
    else { id = 1; }

    const product = new Product({
      id: id,
      name: req.body.name,
      description: req.body.description,
      image: req.body.images[0] || req.body.image,
      images: req.body.images || [],
      category: req.body.category,
      type: req.body.type || "",
      tags: req.body.tags || [],
      new_price: req.body.new_price,
      old_price: req.body.old_price,
    });
    await product.save();
    console.log("Saved");
    res.json({ success: true, name: req.body.name });
  } catch (error) {
    console.error("Add product error:", error.message);
    res.status(500).json({ success: false, errors: "Failed to add product. Please check all required fields." });
  }
});

// Edit product endpoint
app.post("/editproduct", async (req, res) => {
  try {
    const { id, name, description, category, type, tags, new_price, old_price, images } = req.body;
    const updateData = { name, description, category, type, tags, new_price, old_price };
    if (images && images.length > 0) {
      updateData.image = images[0];
      updateData.images = images;
    }
    await Product.findOneAndUpdate({ id }, updateData);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, errors: "Failed to update product" });
  }
});
// Create an endpoint for removing products using admin panel
app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Removed");
  res.json({ success: true, name: req.body.name })
});

// Starting Express Server
server.listen(port, (error) => {
  if (!error) console.log("Server Running on port " + port);
  else console.log("Error : ", error);
});