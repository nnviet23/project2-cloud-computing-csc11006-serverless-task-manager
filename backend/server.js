const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// BẬT CORS 
app.use(cors());
// Middleware để đọc dữ liệu JSON từ Frontend gửi lên
app.use(express.json());

// Mock Data (Tuần 2 sẽ thay bằng code kết nối DynamoDB)
let tasks = [
    { taskId: '1', title: 'Học AWS VPC Endpoint', description: 'Đọc tài liệu project 2', priority: 'high', dueDate: '2026-04-25', status: 'pending', userId: 'user123' }
];

// 1. GET /tasks - Lấy danh sách
app.get('/tasks', (req, res) => {
    res.status(200).json(tasks);
});

// 2. POST /tasks - Tạo mới
app.post('/tasks', (req, res) => {
    const newTask = req.body;
    newTask.taskId = Date.now().toString(); // Tạo ID tạm
    newTask.createdAt = new Date().toISOString();
    tasks.push(newTask);
    res.status(201).json({ message: 'Tạo thành công', task: newTask });
});

// 3. PUT /tasks/:id - Cập nhật
app.put('/tasks/:id', (req, res) => {
    const id = req.params.id;
    const index = tasks.findIndex(t => t.taskId === id);
    
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...req.body };
        res.status(200).json({ message: 'Cập nhật thành công', task: tasks[index] });
    } else {
        res.status(404).json({ error: 'Không tìm thấy công việc' });
    }
});

// 4. DELETE /tasks/:id - Xóa
app.delete('/tasks/:id', (req, res) => {
    const id = req.params.id;
    tasks = tasks.filter(t => t.taskId !== id);
    res.status(200).json({ message: 'Đã xóa thành công' });
});

app.listen(PORT, () => {
    console.log(`Backend API đang chạy tại: http://localhost:${PORT}`);
});