# FitNexus Server 🏋️‍♂️

A comprehensive fitness management backend API built with Node.js, Express.js, and MongoDB. This server powers the FitNexus fitness platform, providing robust APIs for user management, trainer applications, class scheduling, payments, and community features.

## 🌐 Live API Base URL

```
https://fit-nexus-server.vercel.app
```

## 🚀 Features

### 👥 User Management

- User registration and authentication
- Role-based access control (Admin, Trainer, Member)
- Profile management with comprehensive user data
- Login tracking and user activity monitoring

### 🎯 Trainer Management

- Trainer application system
- Trainer approval/rejection workflow
- Public trainer directory with search and pagination
- Trainer profile management with slots and availability
- Trainer-specific class management

### 📚 Class Management

- Advanced class creation and management
- Multi-parameter filtering (status, price range, popularity)
- Smart search across multiple fields
- Sorting options (newest, price, popularity, alphabetical)
- Class interaction system (like/dislike)
- Enrollment tracking and capacity management

### 💳 Payment Integration

- Stripe payment processing
- Payment history tracking
- Automatic enrollment updates on successful payments
- Secure payment intent creation

### 🗣️ Community Forum

- Forum post creation, editing, and deletion
- User-specific post management
- Voting system for posts
- Pagination and filtering

### 📧 Newsletter

- Newsletter subscription management
- Email integration capabilities

### 🎰 Slot Management

- Trainer slot creation and management
- Class-slot linking system
- Availability tracking
- Booking management

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with MongoDB Driver
- **Payment**: Stripe API
- **Deployment**: Vercel
- **Environment**: dotenv for configuration

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- Stripe account for payment processing

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Programming-Hero-Web-Course4/b11a12-server-side-MottuqeBrid.git
cd b11a12-server-side-MottuqeBrid
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_URI=mongodb+srv://username:password@cluster.mongodb.net/fitnexus
DB_NAME=fitnexus

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (Optional)
CLIENT_URL=http://localhost:3000

# MongoDB Collections (Auto-created)
# - users
# - applied_trainers
# - classes
# - class_interactions
# - forum_posts
# - payments
# - newsletter_subscriptions
```

### 4. Database Setup

The application will automatically create the required collections when first accessed:

- `users` - User accounts and profiles
- `applied_trainers` - Trainer applications and profiles
- `classes` - Fitness classes
- `class_interactions` - User likes/dislikes for classes
- `forum_posts` - Community forum posts
- `payments` - Payment transaction records
- `newsletter_subscriptions` - Newsletter subscribers

### 5. Run the Server

#### Development Mode

```bash
npm run dev
# or
node index.js
```

#### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000` (or your specified PORT)

## 📚 API Documentation

### Base URL

- **Local**: `http://localhost:3000`
- **Production**: `https://fit-nexus-server.vercel.app`

### 🔐 Authentication

Most endpoints require user authentication. Include user details in request body or query parameters as needed.

---

## 📖 API Endpoints

### 👥 Users API

| Method  | Endpoint                | Description            |
| ------- | ----------------------- | ---------------------- |
| `POST`  | `/users/register`       | Register new user      |
| `GET`   | `/users/role/:email`    | Get user role by email |
| `PATCH` | `/users/update/login`   | Update last login      |
| `GET`   | `/users/profile/:email` | Get user profile       |
| `PATCH` | `/users/profile/:email` | Update user profile    |
| `GET`   | `/users`                | Get all users (Admin)  |

### 🎯 Trainers API

| Method   | Endpoint                         | Description                       |
| -------- | -------------------------------- | --------------------------------- |
| `POST`   | `/trainers/apply`                | Submit trainer application        |
| `GET`    | `/trainers/applied`              | Get all trainer applications      |
| `GET`    | `/trainers/apply/:id`            | Get trainer by ID                 |
| `GET`    | `/trainers/apply/byEmail/:email` | Get trainer by email              |
| `DELETE` | `/trainers/apply/:id`            | Delete trainer application        |
| `PUT`    | `/trainers/apply/:id`            | Update trainer info               |
| `GET`    | `/trainers/public`               | Get approved trainers (paginated) |
| `GET`    | `/trainers/public/:id`           | Get public trainer details        |
| `GET`    | `/trainers/classes/:email`       | Get classes by trainer email      |
| `PUT`    | `/trainers/classes/:id`          | Update trainer slot               |
| `PATCH`  | `/trainers/add-slots/:id`        | Add slots to trainer              |

### 📚 Classes API

| Method | Endpoint                         | Description                           |
| ------ | -------------------------------- | ------------------------------------- |
| `GET`  | `/classes`                       | Get classes (with advanced filtering) |
| `POST` | `/classes`                       | Create new class                      |
| `GET`  | `/classes/:id`                   | Get class details                     |
| `GET`  | `/classes/by-trainer/:trainerId` | Get classes by trainer                |
| `POST` | `/classes/:id/interaction`       | Like/dislike class                    |
| `GET`  | `/classes/interactions`          | Get user interactions                 |
| `GET`  | `/classes/stats`                 | Get class statistics                  |
| `GET`  | `/classes/home/featured-classes` | Get featured classes                  |

### 💳 Payments API

| Method | Endpoint            | Description                  |
| ------ | ------------------- | ---------------------------- |
| `POST` | `/payments/stripe`  | Create Stripe payment intent |
| `POST` | `/payments/history` | Save payment history         |
| `GET`  | `/payments`         | Get all payments             |

### 🗣️ Forum API

| Method   | Endpoint              | Description                    |
| -------- | --------------------- | ------------------------------ |
| `GET`    | `/forum/posts`        | Get forum posts (with filters) |
| `POST`   | `/forum/posts`        | Create new post                |
| `PATCH`  | `/forum/posts/:id`    | Update post                    |
| `DELETE` | `/forum/posts/:id`    | Delete post                    |
| `PATCH`  | `/forum/vote/:postId` | Vote on post                   |

### 📧 Newsletter API

| Method | Endpoint                  | Description             |
| ------ | ------------------------- | ----------------------- |
| `POST` | `/newsletter/subscribe`   | Subscribe to newsletter |
| `GET`  | `/newsletter/subscribers` | Get all subscribers     |

---

## 🔍 Advanced Features

### Classes API Query Parameters

```bash
GET /classes?page=1&limit=6&search=yoga&status=active&sortBy=popular&priceRange=0-50
```

**Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 6)
- `search` - Search in class name, description, trainer name
- `status` - Filter by status: `all`, `active`, `inactive`
- `sortBy` - Sort by: `newest`, `oldest`, `price-low`, `price-high`, `popular`, `alphabetical`
- `priceRange` - Price filter: `all`, `0-50`, `50-100`, `100+`

### Trainers API Query Parameters

```bash
GET /trainers/public?page=1&limit=6&search=john
```

**Parameters:**

- `page` - Page number
- `limit` - Items per page
- `search` - Search trainer names and skills

### Forum API Query Parameters

```bash
GET /forum/posts?page=1&limit=10&author=user@email.com
```

**Parameters:**

- `page` - Page number
- `limit` - Posts per page
- `author` - Filter by author email

## 📊 Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  uid: String,           // Firebase UID
  name: String,
  email: String,
  photoURL: String,
  role: String,          // "admin", "trainer", "member"
  phone: String,
  dateOfBirth: Date,
  address: String,
  bio: String,
  height: Number,
  weight: Number,
  fitnessGoals: String,
  emergencyContact: String,
  medicalConditions: String,
  preferredWorkoutTime: String,
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

### Classes Collection

```javascript
{
  _id: ObjectId,
  className: String,
  description: String,
  coverImage: String,
  schedule: String,
  price: Number,
  capacity: Number,
  selectedTrainer: ObjectId,     // Trainer ID
  selectedDays: Array,           // ["Mon", "Tue", "Wed"]
  trainerName: String,
  trainerEmail: String,
  status: String,                // "active", "inactive"
  enrolled: Number,              // Enrollment count
  likes: Number,                 // Like count
  dislikes: Number,              // Dislike count
  createdAt: Date,
  updatedAt: Date
}
```

### Applied Trainers Collection

```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String,
  age: Number,
  photoURL: String,
  yearsOfExperience: Number,
  bio: String,
  skills: Array,
  availableDays: Array,
  availableTime: String,
  socialLinks: Object,
  status: String,                // "pending", "approved", "rejected"
  slots: Array,                  // Trainer time slots
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Deployment

### Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel`
4. Set environment variables in Vercel dashboard

### Environment Variables for Production

- `DB_URI` - MongoDB connection string
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NODE_ENV=production`

## 🧪 Testing

### Test the API

```bash
# Test server health
curl https://fit-nexus-server.vercel.app/

# Test users endpoint
curl https://fit-nexus-server.vercel.app/users

# Test classes with filters
curl "https://fit-nexus-server.vercel.app/classes?page=1&limit=3&status=active"
```

## 🔧 Development Scripts

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

## 📁 Project Structure

```
FitNexus-server/
├── controllers/           # Route controllers
│   ├── trainer.controller.js
│   └── user.controller.js
├── db/                   # Database configuration
│   └── connect.js
├── routes/               # API routes
│   ├── classes.routes.js
│   ├── forum.routes.js
│   ├── newsletter.js
│   ├── payment.routes.js
│   ├── trainer.routes.js
│   └── user.routes.js
├── .env                  # Environment variables
├── .gitignore
├── index.js              # Main server file
├── package.json
├── README.md
└── vercel.json           # Vercel deployment config
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For support, email: support@fitnexus.com

## 🙏 Acknowledgments

- Express.js team for the amazing framework
- MongoDB team for the robust database
- Stripe for secure payment processing
- Vercel for seamless deployment

---

**Built with ❤️ for the fitness community**
