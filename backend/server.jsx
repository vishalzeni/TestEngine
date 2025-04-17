const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const sanitize = require('express-mongo-sanitize');
const Joi = require('joi');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your_jwt_secret_key';

// Middleware
const corsOptions = {
  origin: true, // Allow requests from this origin
  credentials: true, // Allow credentials (cookies, etc.)
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(sanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: 'Too many login attempts. Please try again later.',
});

// MongoDB Connection
mongoose.connect('mongodb+srv://contentsimplified4u:content%40123@cluster0.aad41.mongodb.net/test-window', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  setTimeout(() => mongoose.connect('mongodb+srv://contentsimplified4u:content%40123@cluster0.aad41.mongodb.net/test-window', { useNewUrlParser: true, useUnifiedTopology: true }), 5000);
});

// Test Schema
const testSchema = new mongoose.Schema({
  name: String,
  startDateTime: String,
  endDateTime: String,
  sections: [
    {
      sectionName: String,
      duration: String,
      questions: Array,
    },
  ],
  marksPerQuestion: Number,
  negativeMarking: Number,
  calculatorEnabled: { type: Boolean, default: false }, // Add calculatorEnabled field
  createdAt: { type: Date, default: Date.now },
});
const Test = mongoose.model('Test', testSchema);

// Student Schema
const studentSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  rollNumber: { 
    type: String, 
    unique: true,
    required: true,
    trim: true,
    lowercase: true
  },
  email: { 
    type: String, 
    unique: true,
    required: true,
    trim: true,
    lowercase: true
  },
  password: String, // Store plain text password
  createdAt: { type: Date, default: Date.now }
});

// Remove password hashing middleware

const Student = mongoose.model('Student', studentSchema);

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { 
    type: String, 
    unique: true, 
    required: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
});

// Hash passwords before saving
adminSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const Admin = mongoose.model('Admin', adminSchema);

// Generate random password
const generatePassword = () => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&";
  return Array.from({ length: 12 }, () => charset.charAt(Math.floor(Math.random() * charset.length))).join('');
};

// Token verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// Validate input using Joi
const validateStudent = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    rollNumber: Joi.string().required(),
    email: Joi.string().email().required(),
  });
  return schema.validate(data);
};

const validateTest = (data) => {
  const schema = Joi.object({
    name: Joi.string().max(100).required(),
    startDateTime: Joi.string().required(),
    endDateTime: Joi.string().required(),
    sections: Joi.array().items(
      Joi.object({
        sectionName: Joi.string().max(100).required(),
        duration: Joi.string().required(),
        questions: Joi.array().required(),
      })
    ).required(),
    marksPerQuestion: Joi.number().required(),
    negativeMarking: Joi.number().required(),
    calculatorEnabled: Joi.boolean().required(), // Validate calculatorEnabled
  });
  return schema.validate(data);
};

// Student Routes
app.post('/api/students', async (req, res, next) => {
  const { error } = validateStudent(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const rawPassword = generatePassword(); // Generate a random password
    const studentData = { 
      ...req.body, 
      rollNumber: req.body.rollNumber.trim().toLowerCase(),
      email: req.body.email.trim().toLowerCase(),
      password: rawPassword // Save the generated password as plain text
    };
    
    const student = new Student(studentData);
    await student.save();
    
    res.status(201).json({ 
      message: 'Student added successfully',
      student: {
        firstName: student.firstName,
        lastName: student.lastName,
        rollNumber: student.rollNumber,
        email: student.email,
        password: rawPassword // Return the generated password to the client
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = error.message.includes('rollNumber') ? 'Roll number' : 'Email';
      return res.status(400).json({ 
        message: `${field} already exists` 
      });
    }
    console.error('Error adding student:', error);
    res.status(500).json({ message: 'Error adding student', error: error.message });
  }
});

app.post('/api/students/login', loginLimiter, async (req, res) => {
  try {
    const { rollNumber, password } = req.body;

    // Validate input
    if (!rollNumber || !password) {
      return res.status(400).json({ 
        message: 'Roll number and password are required',
        details: {
          rollNumber: !rollNumber ? 'Missing' : 'Provided',
          password: !password ? 'Missing' : 'Provided'
        }
      });
    }

    // Find student with case-insensitive search
    const student = await Student.findOne({ 
      rollNumber: { $regex: new RegExp(`^${rollNumber.trim()}$`, 'i') }
    });

    if (!student) {
      console.error(`Login failed: Student with roll number ${rollNumber} not found.`);
      return res.status(404).json({ 
        message: 'Student not found',
        suggestion: 'Please check your roll number or contact admin'
      });
    }

    // Compare passwords directly
    if (password !== student.password) {
      console.error(`Login failed: Invalid password for roll number ${rollNumber}.`);
      return res.status(401).json({ 
        message: 'Invalid credentials',
        suggestion: 'Please check your password'
      });
    }

    // Create token
    const token = jwt.sign(
      { 
        rollNumber: student.rollNumber, 
        id: student._id,
        role: 'student'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response
    res.status(200).json({ 
      message: 'Login successful',
      token,
      student: {
        firstName: student.firstName,
        lastName: student.lastName,
        rollNumber: student.rollNumber,
        email: student.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed',
      error: error.message,
      systemSuggestion: 'Please try again later'
    });
  }
});

app.post('/api/students/forgot-password', async (req, res) => {
  try {
    const { rollNumber, email, newPassword } = req.body;

    if (!rollNumber || !email || !newPassword) {
      return res.status(400).json({ message: 'Roll number, email, and new password are required' });
    }

    // Case-insensitive search for rollNumber
    const student = await Student.findOne({
      rollNumber: { $regex: new RegExp(`^${rollNumber.trim()}$`, 'i') },
      email: email.trim().toLowerCase()
    });

    if (!student) {
      return res.status(404).json({ 
        message: 'Student not found',
        details: 'Please check your roll number and email combination'
      });
    }

    // Update password directly
    student.password = newPassword;
    await student.save();

    res.status(200).json({ 
      message: 'Password reset successfully',
      success: true
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      message: 'Error resetting password',
      error: error.message 
    });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find({}, '-password');
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// Middleware to check if admin exists
const checkAdminExists = async (req, res, next) => {
  try {
    const adminExists = await Admin.exists({});
    if (adminExists) {
      return res.status(403).json({ message: 'Admin signup is not allowed as an admin already exists' });
    }
    next();
  } catch (error) {
    console.error('Error checking admin existence:', error);
    res.status(500).json({ message: 'Error checking admin existence' });
  }
};

// Admin Routes
app.post('/api/admin/signup', checkAdminExists, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const existingAdmin = await Admin.findOne({ username: username.trim() });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const admin = new Admin({ username: username.trim(), password });
    await admin.save();

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error('Error during admin signup:', error);
    res.status(500).json({ message: 'Error during signup', error: error.message });
  }
});

app.post('/api/admin/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const admin = await Admin.findOne({ username: username.trim() });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { username: admin.username, id: admin._id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({ 
      message: 'Login successful',
      token,
      admin: {
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
});

app.post('/api/admin/forgot-password', async (req, res) => {
  try {
    const { username, email, newPassword } = req.body;

    if (!username || !email || !newPassword) {
      return res.status(400).json({ message: 'Username, email, and new password are required' });
    }

    const admin = await Admin.findOne({
      username: username.trim(),
      email: email.trim().toLowerCase(),
    });

    if (!admin) {
      return res.status(404).json({ 
        message: 'Admin not found',
        details: 'Please check your username and email combination'
      });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.status(200).json({ 
      message: 'Password reset successfully',
      success: true
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      message: 'Error resetting password',
      error: error.message 
    });
  }
});

app.post('/api/admins', async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required' });
    }

    const existingAdmin = await Admin.findOne({ username: username.trim() });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const rawPassword = generatePassword(); // Generate a random password
    const admin = new Admin({ username: username.trim(), email: email.trim(), password: rawPassword });
    await admin.save();

    res.status(201).json({ 
      message: 'Admin added successfully',
      admin: {
        username: admin.username,
        email: admin.email,
        password: rawPassword // Return the generated password to the client
      }
    });
  } catch (error) {
    console.error('Error adding admin:', error);
    res.status(500).json({ message: 'Error adding admin', error: error.message });
  }
});

app.get('/api/admin/check-admin', async (req, res) => {
  try {
    const adminExists = await Admin.exists({});
    res.status(200).json({ exists: !!adminExists });
  } catch (error) {
    console.error('Error checking admin existence:', error);
    res.status(500).json({ message: 'Error checking admin existence' });
  }
});

// Test Routes
app.post('/api/tests', async (req, res) => {
  const { error } = validateTest(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    if (!req.body.name) {
      return res.status(400).json({ message: 'Test name is required' });
    }

    const existingTest = await Test.findOne({ name: req.body.name });
    if (existingTest) {
      return res.status(400).json({ message: 'Test name already exists' });
    }
    
    const test = new Test(req.body);
    await test.save();
    res.status(201).json({ message: 'Test created successfully', test });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ message: 'Error creating test', error: error.message });
  }
});


app.get('/api/tests', async (req, res) => {
  try {
    const tests = await Test.find();
    res.status(200).json(tests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ message: 'Error fetching tests', error: error.message });
  }
});

app.get('/api/tests/:testName', async (req, res) => {
  try {
    const testName = decodeURIComponent(req.params.testName);
    if (!testName) {
      return res.status(400).json({ message: 'Test name is required' });
    }

    const test = await Test.findOne({ name: testName });
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    res.status(200).json(test);
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ message: 'Error fetching test', error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));