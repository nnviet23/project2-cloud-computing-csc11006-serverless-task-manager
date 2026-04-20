const API_URL = 'http://localhost:3000/tasks';

// Hàm tải dữ liệu thực tế từ Backend
async function fetchTasks() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        tasks = data; // Cập nhật mảng local
        renderTasks(); // Gọi lại hàm vẽ giao diện
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');
    const filterPriority = document.getElementById('filterPriority');
    const filterDate = document.getElementById('filterDate');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    
    // Mảng lưu trữ tạm thời để test UI (Sẽ thay bằng fetch gọi lên AWS)
    let tasks = [];
    const API_URL = ''; // Để trống lúc này, tuần 2 sẽ điền URL của API Gateway vào

    // Lắng nghe sự kiện thêm/cập nhật
    taskForm.addEventListener('submit', handleTaskSubmit);
    
    // Lắng nghe sự kiện bộ lọc
    filterPriority.addEventListener('change', renderTasks);
    filterDate.addEventListener('change', renderTasks);
    clearFiltersBtn.addEventListener('click', () => {
        filterPriority.value = 'all';
        filterDate.value = '';
        renderTasks();
    });

    function handleTaskSubmit(e) {
        e.preventDefault();
        
        const taskId = document.getElementById('taskId').value;
        const newTask = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            priority: document.getElementById('priority').value,
            dueDate: document.getElementById('dueDate').value,
            status: 'pending',
            userId: 'user123' // Hardcode tạm userId như ta đã bàn
        };

        if (taskId) {
            // Logic cho PUT (Update)
            console.log('Updating task:', taskId, newTask);
            // reset form và id
            document.getElementById('taskId').value = '';
            document.getElementById('submitBtn').innerText = 'Lưu Công Việc';
        } else {
            // Logic cho POST (Create)
            console.log('Creating new task:', newTask);
            newTask.taskId = Date.now().toString(); // Mock ID
            tasks.push(newTask);
        }

        taskForm.reset();
        renderTasks();
    }

    // Hàm hiển thị danh sách (có kèm logic lọc)
    function renderTasks() {
        taskList.innerHTML = '';
        
        const prioFilter = filterPriority.value;
        const dateFilter = filterDate.value;

        const filteredTasks = tasks.filter(task => {
            const matchPrio = prioFilter === 'all' || task.priority === prioFilter;
            const matchDate = dateFilter === '' || task.dueDate === dateFilter;
            return matchPrio && matchDate;
        });

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = `
                <div class="task-details">
                    <h3>${task.title} <span class="priority-${task.priority}">[${task.priority}]</span></h3>
                    <p>${task.description}</p>
                    <div class="task-meta">Hạn: ${task.dueDate} | Trạng thái: ${task.status}</div>
                </div>
                <div class="task-actions">
                    <button class="btn-edit" onclick="editTask('${task.taskId}')">Sửa</button>
                    <button class="btn-delete" onclick="deleteTask('${task.taskId}')">Xóa</button>
                </div>
            `;
            taskList.appendChild(li);
        });
    }

    // Hàm gọi khi bấm sửa (đưa data ngược lên form)
    window.editTask = function(id) {
        const task = tasks.find(t => t.taskId === id);
        if(!task) return;
        
        document.getElementById('taskId').value = task.taskId;
        document.getElementById('title').value = task.title;
        document.getElementById('description').value = task.description;
        document.getElementById('priority').value = task.priority;
        document.getElementById('dueDate').value = task.dueDate;
        
        document.getElementById('submitBtn').innerText = 'Cập Nhật';
        window.scrollTo(0,0);
    }

    // Hàm gọi khi bấm xóa
    window.deleteTask = function(id) {
        if(confirm('Bạn có chắc muốn xóa công việc này?')) {
            console.log('Deleting task:', id);
            tasks = tasks.filter(t => t.taskId !== id);
            renderTasks();
        }
    }
});