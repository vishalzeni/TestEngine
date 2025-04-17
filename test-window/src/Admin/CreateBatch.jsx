import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Box,
  Typography,
  Container,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Badge,
  Tooltip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  People,
  Upload,
  Preview,
  Check,
  Close,
  School,
  CorporateFare,
  AccountTree,
  CalendarToday
} from '@mui/icons-material';
import { green, blue, orange, red, purple } from '@mui/material/colors';

const BatchCreationPage = () => {
  // Main state for batch creation
  const [batch, setBatch] = useState({
    year: '',
    courses: []
  });

  // State for adding new course
  const [newCourse, setNewCourse] = useState({
    name: '',
    branches: []
  });

  // State for adding new branch
  const [newBranch, setNewBranch] = useState({
    name: '',
    students: []
  });

  // State for renaming
  const [renameData, setRenameData] = useState({
    type: '',
    index: null,
    parentIndex: null,
    newName: ''
  });

  // State for preview
  const [previewData, setPreviewData] = useState({
    open: false,
    title: '',
    data: []
  });

  // Loading state
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(null);
  const [action, setAction] = useState({ type: '', payload: null });
  const fileInputRef = useRef(null);

  // Handle batch year change
  const handleYearChange = (e) => {
    setBatch(prev => ({
      ...prev,
      year: e.target.value
    }));
  };

  // Add new course
  const handleAddCourse = () => {
    if (newCourse.name.trim()) {
      setBatch(prev => ({
        ...prev,
        courses: [...prev.courses, { ...newCourse }]
      }));
      setNewCourse({ name: '', branches: [] });
      setCourseDialogOpen(false);
    }
  };

  // Add new branch to selected course
  const handleAddBranch = () => {
    if (newBranch.name.trim() && selectedCourseIndex !== null) {
      const updatedCourses = [...batch.courses];
      updatedCourses[selectedCourseIndex].branches.push({ ...newBranch });
      
      setBatch(prev => ({
        ...prev,
        courses: updatedCourses
      }));
      setNewBranch({ name: '', students: [] });
      setBranchDialogOpen(false);
    }
  };

  // Handle file upload for students
  const handleFileUpload = async (e, courseIndex, branchIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Process student data according to your Excel format
      const students = jsonData.map((row, idx) => ({
        id: idx + 1,
        firstName: row['First Name'] || '',
        lastName: row['Last Name'] || '',
        batch: row['Batch'] || batch.year,
        course: row['Course'] || batch.courses[courseIndex].name,
        branch: row['Branch'] || batch.courses[courseIndex].branches[branchIndex].name,
        semester: row['Semester'] || '',
        phone: row['Phone Number'] || '',
        email: row['Email ID'] || '',
        fullName: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim()
      }));

      // Update state with new students
      const updatedCourses = [...batch.courses];
      updatedCourses[courseIndex].branches[branchIndex].students = students;
      
      setBatch(prev => ({
        ...prev,
        courses: updatedCourses
      }));

      // Show preview
      setPreviewData({
        open: true,
        title: `${updatedCourses[courseIndex].name} - ${updatedCourses[courseIndex].branches[branchIndex].name} (${batch.year})`,
        data: students
      });
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing Excel file. Please check the format.');
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset file input
    }
  };

  // Confirm before delete/rename
  const handleConfirmAction = () => {
    if (action.type === 'deleteCourse') {
      const updatedCourses = batch.courses.filter((_, i) => i !== action.payload);
      setBatch(prev => ({ ...prev, courses: updatedCourses }));
    } 
    else if (action.type === 'deleteBranch') {
      const { courseIndex, branchIndex } = action.payload;
      const updatedCourses = [...batch.courses];
      updatedCourses[courseIndex].branches = updatedCourses[courseIndex].branches.filter(
        (_, i) => i !== branchIndex
      );
      setBatch(prev => ({ ...prev, courses: updatedCourses }));
    }
    else if (action.type === 'rename') {
      const { type, index, parentIndex, newName } = action.payload;
      const updatedCourses = [...batch.courses];
      
      if (type === 'course') {
        updatedCourses[index].name = newName;
      } 
      else if (type === 'branch') {
        updatedCourses[parentIndex].branches[index].name = newName;
      }
      
      setBatch(prev => ({ ...prev, courses: updatedCourses }));
    }

    setConfirmDialogOpen(false);
  };

  // Initiate rename process
  const initiateRename = (type, index, parentIndex = null) => {
    let currentName = '';
    
    if (type === 'course') {
      currentName = batch.courses[index].name;
    } 
    else if (type === 'branch') {
      currentName = batch.courses[parentIndex].branches[index].name;
    }
    
    setRenameData({
      type,
      index,
      parentIndex,
      newName: currentName
    });
    setRenameDialogOpen(true);
  };

  // Handle rename
  const handleRename = () => {
    setAction({
      type: 'rename',
      payload: renameData
    });
    setConfirmDialogOpen(true);
    setRenameDialogOpen(false);
  };

  // Count total students in a branch
  const countStudents = (courseIndex, branchIndex) => {
    return batch.courses[courseIndex]?.branches[branchIndex]?.students?.length || 0;
  };

  // Count all students in batch
  const countAllStudents = () => {
    return batch.courses.reduce((total, course) => {
      return total + course.branches.reduce((sum, branch) => sum + branch.students.length, 0);
    }, 0);
  };

  // Generate year options
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <School sx={{ mr: 2, color: blue[700] }} />
          Create New Batch
        </Typography>

        {/* Batch Year Selection */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="batch-year-label">Batch Year</InputLabel>
            <Select
              labelId="batch-year-label"
              id="year"
              name="year"
              value={batch.year}
              onChange={handleYearChange}
              label="Batch Year"
              startAdornment={<CalendarToday sx={{ color: 'action.active', mr: 1 }} />}
            >
              {generateYearOptions().map(year => (
                <MenuItem key={year} value={year.toString()}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Chip 
            label={`${countAllStudents()} total students`} 
            color="primary"
            icon={<People />}
            sx={{ px: 2 }}
          />
        </Box>

        {/* Courses Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AccountTree sx={{ mr: 1, color: orange[700] }} />
            <Typography variant="h6">Courses</Typography>
            <Chip 
              label={`${batch.courses.length} courses`} 
              size="small" 
              sx={{ ml: 2 }} 
            />
          </Box>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCourseDialogOpen(true)}
            sx={{ mb: 2 }}
            disabled={!batch.year}
          >
            Add Course
          </Button>

          {/* List of Courses */}
          {batch.courses.length > 0 ? (
            <Paper elevation={2} sx={{ p: 2 }}>
              <List>
                {batch.courses.map((course, courseIndex) => (
                  <React.Fragment key={`course-${courseIndex}`}>
                    <ListItem
                      secondaryAction={
                        <Box>
                          <Tooltip title="Rename">
                            <IconButton
                              edge="end"
                              aria-label="rename"
                              onClick={() => initiateRename('course', courseIndex)}
                              sx={{ color: blue[600] }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => {
                                setAction({
                                  type: 'deleteCourse',
                                  payload: courseIndex
                                });
                                setConfirmDialogOpen(true);
                              }}
                              sx={{ color: red[600] }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Badge 
                              badgeContent={course.branches.length} 
                              color="primary"
                              sx={{ mr: 2 }}
                            >
                              <Avatar sx={{ bgcolor: orange[500], width: 32, height: 32 }}>
                                {course.name.charAt(0).toUpperCase()}
                              </Avatar>
                            </Badge>
                            <Typography variant="subtitle1">
                              {course.name}
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                {course.branches.reduce((sum, branch) => sum + branch.students.length, 0)} students
                              </Typography>
                            </Typography>
                          </Box>
                        }
                      />
                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() => {
                          setSelectedCourseIndex(courseIndex);
                          setBranchDialogOpen(true);
                        }}
                        sx={{ ml: 2 }}
                      >
                        Add Branch
                      </Button>
                    </ListItem>

                    {/* List of Branches for this course */}
                    {course.branches.length > 0 && (
                      <Box sx={{ ml: 6 }}>
                        <List dense>
                          {course.branches.map((branch, branchIndex) => (
                            <ListItem
                              key={`branch-${branchIndex}`}
                              secondaryAction={
                                <Box>
                                  <Tooltip title="Rename">
                                    <IconButton
                                      edge="end"
                                      aria-label="rename"
                                      onClick={() => initiateRename('branch', branchIndex, courseIndex)}
                                      sx={{ color: blue[600] }}
                                    >
                                      <Edit />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      edge="end"
                                      aria-label="delete"
                                      onClick={() => {
                                        setAction({
                                          type: 'deleteBranch',
                                          payload: { courseIndex, branchIndex }
                                        });
                                        setConfirmDialogOpen(true);
                                      }}
                                      sx={{ color: red[600] }}
                                    >
                                      <Delete />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              }
                            >
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Badge 
                                      badgeContent={countStudents(courseIndex, branchIndex)} 
                                      color="primary"
                                      sx={{ mr: 2 }}
                                    >
                                      <Avatar sx={{ bgcolor: green[500], width: 24, height: 24, fontSize: 14 }}>
                                        {branch.name.substring(0, 2).toUpperCase()}
                                      </Avatar>
                                    </Badge>
                                    <Typography variant="body1">
                                      {branch.name}
                                    </Typography>
                                  </Box>
                                }
                              />
                              <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".xlsx, .xls, .csv"
                                onChange={(e) => handleFileUpload(e, courseIndex, branchIndex)}
                              />
                              <Button
                                variant="outlined"
                                startIcon={<Upload />}
                                onClick={() => fileInputRef.current.click()}
                                sx={{ ml: 2 }}
                                disabled={loading}
                              >
                                {loading ? <CircularProgress size={24} /> : 'Upload Students'}
                              </Button>
                              {countStudents(courseIndex, branchIndex) > 0 && (
                                <Button
                                  variant="outlined"
                                  startIcon={<Preview />}
                                  onClick={() => setPreviewData({
                                    open: true,
                                    title: `${course.name} - ${branch.name} (${batch.year})`,
                                    data: branch.students
                                  })}
                                  sx={{ ml: 1 }}
                                >
                                  Preview
                                </Button>
                              )}
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    <Divider sx={{ my: 1 }} />
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>
              {batch.year ? 'No courses added yet. Click "Add Course" to get started.' : 'Please select a batch year first.'}
            </Alert>
          )}
        </Box>

        {/* Submit Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<Check />}
            disabled={!batch.year || batch.courses.length === 0}
            sx={{ px: 4, py: 1.5 }}
          >
            Create Batch
          </Button>
        </Box>
      </Box>

      {/* Add Course Dialog */}
      <Dialog open={courseDialogOpen} onClose={() => setCourseDialogOpen(false)}>
        <DialogTitle sx={{ bgcolor: blue[50], display: 'flex', alignItems: 'center' }}>
          <Add sx={{ mr: 1, color: blue[700] }} />
          Add New Course
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Course Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newCourse.name}
            onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
            InputProps={{
              startAdornment: (
                <School sx={{ color: 'action.active', mr: 1 }} />
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCourseDialogOpen(false)}
            startIcon={<Close />}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddCourse}
            variant="contained"
            startIcon={<Check />}
            disabled={!newCourse.name.trim()}
          >
            Add Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Branch Dialog */}
      <Dialog open={branchDialogOpen} onClose={() => setBranchDialogOpen(false)}>
        <DialogTitle sx={{ bgcolor: green[50], display: 'flex', alignItems: 'center' }}>
          <Add sx={{ mr: 1, color: green[700] }} />
          Add New Branch
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Branch Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newBranch.name}
            onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
            InputProps={{
              startAdornment: (
                <AccountTree sx={{ color: 'action.active', mr: 1 }} />
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setBranchDialogOpen(false)}
            startIcon={<Close />}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddBranch}
            variant="contained"
            color="success"
            startIcon={<Check />}
            disabled={!newBranch.name.trim()}
          >
            Add Branch
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>Rename {renameData.type}</DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label={`New ${renameData.type} name`}
            value={renameData.newName}
            onChange={(e) => setRenameData({ ...renameData, newName: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRename} 
            variant="contained"
            disabled={!renameData.newName.trim()}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          {action.type === 'deleteCourse' && (
            <Typography>
              Are you sure you want to delete the course "{batch.courses[action.payload]?.name}" and all its branches?
            </Typography>
          )}
          {action.type === 'deleteBranch' && (
            <Typography>
              Are you sure you want to delete the branch "{batch.courses[action.payload.courseIndex]?.branches[action.payload.branchIndex]?.name}"?
            </Typography>
          )}
          {action.type === 'rename' && (
            <Typography>
              Confirm rename to "{action.payload.newName}"?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmAction} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Students Preview Dialog */}
      <Dialog 
        open={previewData.open} 
        onClose={() => setPreviewData({ ...previewData, open: false })}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: purple[50], display: 'flex', alignItems: 'center' }}>
          <People sx={{ mr: 1, color: purple[700] }} />
          {previewData.title}
          <Chip 
            label={`${previewData.data.length} students`} 
            color="primary"
            size="small"
            sx={{ ml: 2 }}
          />
        </DialogTitle>
        <DialogContent>
          <Box sx={{ maxHeight: '60vh', overflow: 'auto', mt: 2 }}>
            <TableContainer component={Paper}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Roll No</TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell>First Name</TableCell>
                    <TableCell>Last Name</TableCell>
                    <TableCell>Batch</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Branch</TableCell>
                    <TableCell>Semester</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.data.map((student, index) => (
                    <TableRow key={index}>
                      <TableCell>{student.id}</TableCell>
                      <TableCell>{student.fullName}</TableCell>
                      <TableCell>{student.firstName}</TableCell>
                      <TableCell>{student.lastName}</TableCell>
                      <TableCell>{student.batch}</TableCell>
                      <TableCell>{student.course}</TableCell>
                      <TableCell>{student.branch}</TableCell>
                      <TableCell>{student.semester}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>{student.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setPreviewData({ ...previewData, open: false })}
            startIcon={<Close />}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BatchCreationPage;