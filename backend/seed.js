require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Category = require("./models/Category");
const Food = require("./models/Food");
const User = require("./models/User");
const Order = require("./models/Order");
const Rating = require("./models/Rating");
const RestaurantProfile = require("./models/RestaurantProfile");
const PaymentSettings = require("./models/PaymentSettings");

const PASSWORD = "password123";

const categorySeeds = [
  {
    name: "Starters",
    description: "Crispy, spicy, and shareable appetizers.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Biryani",
    description: "Layered rice dishes with aromatic spices.",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "North Indian",
    description: "Rich curries, paneer dishes, and tandoori favorites.",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "South Indian",
    description: "Classic dosas, idlis, and comforting regional plates.",
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Chinese",
    description: "Indo-Chinese noodles, rice, and wok-tossed snacks.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Desserts",
    description: "Sweet endings and chilled favorites.",
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Beverages",
    description: "Fresh drinks, shakes, and coolers.",
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80",
  },
];

const foodsByCategory = {
  Starters: [
    ["Paneer Tikka", 249, 35, "Cottage cheese cubes marinated in spices and grilled.", "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=900&q=80"],
    ["Chicken 65", 269, 28, "Crispy fried chicken tossed with curry leaves and chillies.", "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=80"],
    ["Veg Spring Roll", 159, 42, "Crunchy rolls filled with seasoned vegetables.", "https://images.unsplash.com/photo-1604909052868-dd2e2f6a7210?auto=format&fit=crop&w=900&q=80"],
    ["Gobi Manchurian", 179, 38, "Crispy cauliflower tossed in a tangy Indo-Chinese sauce.", "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80"],
  ],
  Biryani: [
    ["Hyderabadi Chicken Biryani", 329, 50, "Dum-cooked chicken biryani with fragrant basmati rice.", "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=900&q=80"],
    ["Veg Dum Biryani", 249, 44, "Aromatic basmati rice layered with vegetables and spices.", "https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?auto=format&fit=crop&w=900&q=80"],
    ["Mutton Biryani", 399, 30, "Slow-cooked mutton biryani with deep spice flavors.", "https://images.unsplash.com/photo-1642821373181-696a54913e93?auto=format&fit=crop&w=900&q=80"],
    ["Egg Biryani", 229, 36, "Classic biryani topped with boiled eggs and fried onions.", "https://images.unsplash.com/photo-1701579231378-3726490a407b?auto=format&fit=crop&w=900&q=80"],
  ],
  "North Indian": [
    ["Butter Chicken", 349, 32, "Tender chicken cooked in a creamy tomato gravy.", "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80"],
    ["Paneer Butter Masala", 299, 40, "Paneer cubes in a rich buttery makhani sauce.", "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80"],
    ["Dal Makhani", 229, 45, "Slow-simmered black lentils finished with cream.", "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80"],
    ["Garlic Naan", 59, 80, "Soft tandoori naan brushed with garlic butter.", "https://images.unsplash.com/photo-1619535860434-cf9b2b392614?auto=format&fit=crop&w=900&q=80"],
  ],
  "South Indian": [
    ["Masala Dosa", 149, 55, "Crispy dosa filled with spiced potato masala.", "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80"],
    ["Idli Sambar", 119, 60, "Steamed idlis served with sambar and chutneys.", "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=900&q=80"],
    ["Medu Vada", 129, 48, "Crispy lentil doughnuts with coconut chutney.", "https://images.unsplash.com/photo-1630409346824-4f0e7b080087?auto=format&fit=crop&w=900&q=80"],
    ["Curd Rice", 129, 35, "Comforting rice mixed with curd and tempering.", "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=900&q=80"],
  ],
  Chinese: [
    ["Veg Hakka Noodles", 189, 45, "Wok-tossed noodles with fresh vegetables.", "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=900&q=80"],
    ["Chicken Fried Rice", 219, 40, "Fried rice tossed with chicken, egg, and vegetables.", "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=80"],
    ["Chilli Paneer", 229, 34, "Paneer cubes tossed with peppers and chilli sauce.", "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80"],
    ["Schezwan Momos", 179, 38, "Steamed momos coated in spicy schezwan sauce.", "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=900&q=80"],
  ],
  Desserts: [
    ["Gulab Jamun", 99, 70, "Warm milk-solid dumplings soaked in saffron syrup.", "https://images.unsplash.com/photo-1605197161470-5d2a9af0dc97?auto=format&fit=crop&w=900&q=80"],
    ["Rasmalai", 139, 42, "Soft chenna patties in chilled saffron milk.", "https://images.unsplash.com/photo-1601303516534-b5df7fdb5d3b?auto=format&fit=crop&w=900&q=80"],
    ["Brownie with Ice Cream", 179, 32, "Chocolate brownie served with vanilla ice cream.", "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80"],
    ["Mango Kulfi", 119, 45, "Creamy frozen mango dessert.", "https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&w=900&q=80"],
  ],
  Beverages: [
    ["Mango Lassi", 99, 65, "Thick yogurt drink blended with mango pulp.", "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=900&q=80"],
    ["Fresh Lime Soda", 79, 80, "Refreshing lime soda served sweet, salt, or mixed.", "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=900&q=80"],
    ["Cold Coffee", 129, 50, "Chilled coffee blended with milk and ice cream.", "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80"],
    ["Masala Chai", 49, 100, "Classic Indian tea brewed with spices.", "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&w=900&q=80"],
  ],
};

const customerSeeds = [
  ["Aarav Sharma", "aarav.customer@example.com", "9876501001", "12 MG Road, Bengaluru"],
  ["Priya Nair", "priya.customer@example.com", "9876501002", "45 Indiranagar, Bengaluru"],
  ["Rohan Mehta", "rohan.customer@example.com", "9876501003", "8 Koramangala, Bengaluru"],
  ["Sneha Rao", "sneha.customer@example.com", "9876501004", "21 Whitefield, Bengaluru"],
];

const deliverySeeds = [
  ["Kiran Delivery", "kiran.delivery@example.com", "9876502001", "Honda Activa KA-01-AB-1234", 128, 4.7],
  ["Manoj Delivery", "manoj.delivery@example.com", "9876502002", "TVS Jupiter KA-02-CD-5678", 94, 4.5],
  ["Farhan Delivery", "farhan.delivery@example.com", "9876502003", "Bajaj CT100 KA-03-EF-9012", 156, 4.8],
];

const orderStatuses = ["pending", "accepted", "preparing", "ready", "assigned", "out_for_delivery", "delivered"];

const hashPassword = async () => bcrypt.hash(PASSWORD, await bcrypt.genSalt(10));

async function upsertUser(seed, role, password) {
  const [name, email, phone, extra, totalDeliveries, rating] = seed;
  const update = {
    name,
    email,
    phone,
    role,
    password,
    status: "active",
  };

  if (role === "delivery") {
    update.vehicle = extra;
    update.address = "Spice Garden delivery hub";
    update.totalDeliveries = totalDeliveries;
    update.rating = rating;
  } else {
    update.address = extra;
  }

  return User.findOneAndUpdate({ email }, update, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function seedCategories() {
  const categories = {};

  for (const seed of categorySeeds) {
    const category = await Category.findOneAndUpdate(
      { name: seed.name },
      { ...seed, active: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categories[category.name] = category;
  }

  return categories;
}

async function seedFoods(categories) {
  const foods = [];

  for (const [categoryName, items] of Object.entries(foodsByCategory)) {
    const category = categories[categoryName];
    for (const [name, price, stock, description, image] of items) {
      const food = await Food.findOneAndUpdate(
        { name },
        {
          name,
          price,
          stock,
          description,
          image,
          category: category._id,
          availability: true,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      foods.push(food);
    }
  }

  return foods;
}

async function seedOrders(customers, deliveryPeople, foods) {
  const existingCount = await Order.countDocuments();
  if (existingCount >= 12) return 0;

  const orders = [];
  for (let index = 0; index < 14; index += 1) {
    const customer = customers[index % customers.length];
    const deliveryPerson = deliveryPeople[index % deliveryPeople.length];
    const status = orderStatuses[index % orderStatuses.length];
    const selected = [foods[index % foods.length], foods[(index + 5) % foods.length]];

    const items = selected.map((food, itemIndex) => ({
      food: food._id,
      name: food.name,
      price: food.price,
      quantity: itemIndex + 1,
      image: food.image,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const isDeliveryAssigned = ["assigned", "picked", "out_for_delivery", "delivered"].includes(status);

    orders.push({
      user: customer._id,
      customerDetails: {
        name: customer.name,
        phone: customer.phone,
        location: "Bengaluru",
        address: customer.address,
        instructions: index % 3 === 0 ? "Please call before delivery." : "",
      },
      items,
      totalAmount,
      paymentMethod: index % 2 === 0 ? "upi" : "cash",
      paymentStatus: index % 2 === 0 || status === "delivered" ? "paid" : "pending",
      orderStatus: status,
      assignedDeliveryPerson: isDeliveryAssigned ? deliveryPerson._id : null,
      placedAt: new Date(Date.now() - index * 1000 * 60 * 60 * 6),
      deliveredAt: status === "delivered" ? new Date(Date.now() - index * 1000 * 60 * 60 * 5) : null,
    });
  }

  await Order.insertMany(orders);
  return orders.length;
}

async function seedRatings(customers, foods) {
  const comments = [
    "Fresh, tasty, and packed well. The portion size felt worth the price.",
    "Loved the flavor and spice balance. Will definitely order this again.",
    "Good taste and fast delivery. Packaging was neat and spill-free.",
    "Restaurant quality was excellent, especially the aroma and presentation.",
    "The food arrived hot and tasted freshly prepared.",
    "Nice quantity for one person and the masala was balanced well.",
    "A reliable option when I want something filling and flavorful.",
    "The texture was perfect and the sides matched the dish nicely.",
    "Very satisfying meal. The taste felt consistent with my last order.",
    "Could use a little more garnish, but the flavor was very good.",
    "Loved the freshness. This has become one of my regular picks.",
    "The spice level was just right and the delivery was on time.",
  ];

  let count = 0;
  for (let index = 0; index < 32; index += 1) {
    const user = customers[index % customers.length];
    const food = foods[(index * 5) % foods.length];
    await Rating.findOneAndUpdate(
      { user: user._id, food: food._id },
      {
        user: user._id,
        food: food._id,
        rating: index % 7 === 0 ? 3 : 4 + (index % 2),
        comment: comments[index % comments.length],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    count += 1;
  }

  return count;
}

async function seedSingletons() {
  await RestaurantProfile.findOneAndUpdate(
    {},
    {
      name: "Spice Garden Restaurant",
      ownerName: "Mahesh",
      email: "admin@spicegarden.com",
      phone: "9876500000",
      address: "MG Road, Bengaluru, Karnataka",
      openingTime: "10:00",
      closingTime: "23:00",
      description: "A smart restaurant experience serving Indian, Chinese, desserts, and beverages.",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await PaymentSettings.findOneAndUpdate(
    {},
    {
      upiId: "spicegarden@upi",
      upiEnabled: true,
      cashEnabled: true,
      cardEnabled: true,
      qrEnabled: false,
      instructions: "Pay using UPI or cash on delivery. Keep your order ID ready.",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Add it to backend/.env before running the seed script.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const password = await hashPassword();
  const categories = await seedCategories();
  const foods = await seedFoods(categories);
  const customers = await Promise.all(customerSeeds.map((seed) => upsertUser(seed, "user", password)));
  const deliveryPeople = await Promise.all(deliverySeeds.map((seed) => upsertUser(seed, "delivery", password)));
  await seedSingletons();
  const orderCount = await seedOrders(customers, deliveryPeople, foods);
  const ratingCount = await seedRatings(customers, foods);

  console.log("Seed completed");
  console.log(`Categories: ${Object.keys(categories).length}`);
  console.log(`Foods: ${foods.length}`);
  console.log(`Customers: ${customers.length}`);
  console.log(`Delivery people: ${deliveryPeople.length}`);
  console.log(`New orders inserted: ${orderCount}`);
  console.log(`Ratings upserted: ${ratingCount}`);
  console.log(`Demo password for seeded users: ${PASSWORD}`);

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
