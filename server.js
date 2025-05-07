import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure 'uploads' directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/form", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connection successful"))
  .catch((err) => console.error("MongoDB connection error: ", err));

// Define schema for admission form
const AdmissionSchema = new mongoose.Schema({
  studentFirstName: { type: String, required: true },
  studentLastName: { type: String, required: true },
  fatherName: { type: String, required: true },
  studentDob: { type: String, required: true },
  inputEmail: { type: String, required: true, unique: true },
  inputPhone: { type: String, required: true },
  programOfInterest: { type: String, required: true },
  highSchoolName: { type: String, required: true },
  highSchoolGrade: { type: String, required: true },
  matricMarks: { type: String, required: true },
  cvUpload: { type: String, required: true },
  statementOfPurpose: { type: String, required: true },
  className: { type: String },
  rollNumber: { type: String },
  admissionFee: { type: Number },
  securityFee: { type: Number },
  tuitionFee: { type: Number },
  assessmentFund: { type: Number },
  computerFee: { type: Number },
  totalAmount: { type: Number },
  dueDateAmount: { type: Number },
  afterDateAmount: { type: Number }
});

// Define model
const Admission = mongoose.model("Admission", AdmissionSchema);

// Submit form route
app.post('/submitForm', upload.single('cvUpload'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Document file is required.' });
    }

    const {
      studentFirstName, studentLastName, fatherName, studentDob, inputEmail, inputPhone, programOfInterest,
      highSchoolName, highSchoolGrade, matricMarks, statementOfPurpose
    } = req.body;

    const admission = new Admission({
      studentFirstName,
      studentLastName,
      fatherName,
      studentDob,
      inputEmail,
      inputPhone,
      programOfInterest,
      highSchoolName,
      highSchoolGrade,
      matricMarks,
      cvUpload: req.file.filename,
      statementOfPurpose
    });

    await admission.save();
    res.json({ message: 'Data saved successfully!' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists. Please use a different email.' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Generate fee voucher route
app.get('/generateVoucher/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const studentData = await Admission.findById(studentId);

    if (!studentData) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      _id: studentData._id,
      studentFirstName: studentData.studentFirstName,
      studentLastName: studentData.studentLastName,
      fatherName: studentData.fatherName,
      programOfInterest: studentData.programOfInterest,
      rollNumber: studentData.rollNumber || 'Not provided',
      admissionFee: studentData.admissionFee || 0,
      securityFee: studentData.securityFee || 0,
      tuitionFee: studentData.tuitionFee || 0,
      assessmentFund: studentData.assessmentFund || 0,
      computerFee: studentData.computerFee || 0,
      totalAmount: studentData.totalAmount || 0,
      dueDateAmount: studentData.dueDateAmount || 0,
      afterDateAmount: studentData.afterDateAmount || 0
    });
  } catch (err) {
    console.error("Error fetching voucher data:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start server
const PORT = 5500;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});