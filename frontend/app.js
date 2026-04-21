document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');
    const filterPriority = document.getElementById('filterPriority');
    const filterDate = document.getElementById('filterDate');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    let tasks = [];
    //const API_URL = 'https://w88o3mc6b1.execute-api.us-east-1.amazonaws.com/prod/tasks';
    const API_URL = 'http://localhost:3000/tasks'; // Dùng cho local development
    // 1. Gọi API lấy dữ liệu từ Backend
    async function fetchTasks() {
        try {
            const response = await fetch(API_URL);
            tasks = await response.json();
            renderTasks();
        } catch (error) {
            console.error('Lỗi khi gọi API:', error);
        }
    }

    // 2. Hàm định dạng ngày tháng (dd/mm/yyyy)
    function formatDate(dateString) {
        if (!dateString) return "";
        const [year, month, day] = dateString.split("-");
        return `${day}/${month}/${year}`;
    }

    // 3. Hàm hiển thị danh sách (Bao gồm bộ lọc và kiểm tra trễ hạn)
    function renderTasks() {
        taskList.innerHTML = '';
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const prioFilter = filterPriority.value;
        const dateFilter = filterDate.value;

        // Lọc task trước
        const filteredTasks = tasks.filter(task => {
            const matchPrio = prioFilter === 'all' || task.priority === prioFilter;
            const matchDate = dateFilter === '' || task.dueDate === dateFilter;
            return matchPrio && matchDate;
        });

        // Đổ dữ liệu đã lọc ra màn hình
        filteredTasks.forEach(task => {
            const isOverdue = task.status === 'pending' && task.dueDate < today;

            const li = document.createElement('li');
            li.className = `task-item ${task.status === 'completed' ? 'task-completed' : ''} ${isOverdue ? 'task-overdue' : ''}`;
            
            li.innerHTML = `
                <div class="task-details">
                    <h3>
                        ${task.title} 
                        <span class="priority-${task.priority}">[${task.priority}]</span>
                        ${isOverdue ? '<span class="badge-overdue">TRỄ HẠN!</span>' : ''}
                    </h3>
                    <p>${task.description}</p>
                    <div class="task-meta">Hạn: ${formatDate(task.dueDate)} | Trạng thái: ${task.status === 'pending' ? 'Chưa xong' : 'Đã xong'}</div>
                </div>
                <div class="task-actions">
                    ${task.status === 'pending' ? `<button class="btn-done" onclick="completeTask('${task.taskId}')">Xong</button>` : ''}
                    <button class="btn-edit" onclick="editTask('${task.taskId}')">Sửa</button>
                    <button class="btn-delete" onclick="deleteTask('${task.taskId}')">Xóa</button>
                </div>
            `;
            taskList.appendChild(li);
        });
    }

    // 4. Submit form (Thêm mới hoặc Cập nhật) gọi API
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const taskId = document.getElementById('taskId').value;
        const taskData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            priority: document.getElementById('priority').value,
            dueDate: document.getElementById('dueDate').value,
            status: 'pending',
            userId: 'user123' 
        };

        try {
            if (taskId) {
                // Update (PUT)
                await fetch(`${API_URL}/${taskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                });
                document.getElementById('taskId').value = '';
                document.getElementById('submitBtn').innerText = 'Lưu Công Việc';
            } else {
                // Create (POST)
                await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                });
            }
            taskForm.reset();
            fetchTasks(); // Tải lại danh sách từ Backend
        } catch (error) {
            console.error('Lỗi khi lưu công việc:', error);
        }
    });

    // 5. Nút Hoàn thành task (Gọi API PUT cập nhật trạng thái)
    window.completeTask = async function(id) {
        const task = tasks.find(t => t.taskId === id);
        if(task) {
            try {
                const updatedTask = { ...task, status: 'completed' };
                await fetch(`${API_URL}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedTask)
                });
                fetchTasks(); // Cập nhật lại UI
            } catch (error) {
                console.error('Lỗi khi cập nhật trạng thái:', error);
            }
        }
    }

    // 6. Xóa task (Gọi API DELETE)
    window.deleteTask = async function(id) {
        if(confirm('Bạn có chắc muốn xóa công việc này?')) {
            try {
                await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                fetchTasks(); // Tải lại UI sau khi xóa
            } catch (error) {
                console.error('Lỗi khi xóa:', error);
            }
        }
    }

    // 7. Sửa task (Đưa dữ liệu lên Form)
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

    // Các sự kiện cho Bộ lọc
    filterPriority.addEventListener('change', renderTasks);
    filterDate.addEventListener('change', renderTasks);
    clearFiltersBtn.addEventListener('click', () => {
        filterPriority.value = 'all';
        filterDate.value = '';
        renderTasks();
    });

    // Load dữ liệu lần đầu khi vào trang
    fetchTasks();
});