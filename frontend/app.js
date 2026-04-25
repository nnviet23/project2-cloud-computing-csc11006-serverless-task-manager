document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');
    const filterPriority = document.getElementById('filterPriority');
    const filterDate = document.getElementById('filterDate');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const submitBtn = document.getElementById('submitBtn');

    let tasks = [];
    
    // Cập nhật địa chỉ API Gateway

    // Dùng URL cục bộ khi chạy Backend trên localhost
    // const API_URL = 'https://localhost:3000';

    // const API_URL = 'https://your-api-id.execute-api.region.amazonaws.com/prod/tasks';
    const API_URL = 'https://2894wocicl.execute-api.us-east-1.amazonaws.com/prod/tasks';

    // Hiển thị thông báo cho người dùng
    function showMessage(message, isError = false) {
        if (isError) {
            console.error("Hệ thống báo lỗi:", message);
            alert(`LỖI: ${message}`);
        } else {
            console.log("Thành công:", message);
            alert(message); 
        }
    }

    // Hàm gọi API và xử lý phản hồi
    async function fetchAPI(endpoint, method = 'GET', bodyData = null) {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (bodyData) {
            options.body = JSON.stringify(bodyData);
        }

        try {
            const response = await fetch(endpoint, options);
            
            // Xử lý mã trạng thái lỗi từ Backend
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMsg = errorData ? (errorData.error || errorData.details) : `Mã lỗi HTTP ${response.status}`;
                throw new Error(errorMsg);
            }

            return await response.json();
        } catch (error) {
            // Xử lý ngoại lệ mạng và lỗi ném ra từ API
            showMessage(error.message, true);
            throw error;
        }
    }

    // 1. Lấy dữ liệu công việc từ Backend
    async function fetchTasks() {
        taskList.innerHTML = '<p style="text-align:center; color:#666;">Đang tải dữ liệu...</p>';
        try {
            tasks = await fetchAPI(API_URL, 'GET');
            renderTasks();
        } catch (error) {
            taskList.innerHTML = '<p style="text-align:center; color:red;">Lỗi không thể tải danh sách công việc.</p>';
        }
    }

    // 2. Định dạng ngày tháng (dd/mm/yyyy)
    function formatDate(dateString) {
        if (!dateString) return "";
        const [year, month, day] = dateString.split("-");
        return `${day}/${month}/${year}`;
    }

    // 3. Hiển thị danh sách công việc
    function renderTasks() {
        taskList.innerHTML = '';
        const today = new Date().toISOString().split('T')[0];
        const prioFilter = filterPriority.value;
        const dateFilter = filterDate.value;

        // Áp dụng bộ lọc
        const filteredTasks = tasks.filter(task => {
            const matchPrio = prioFilter === 'all' || task.priority === prioFilter;
            const matchDate = dateFilter === '' || task.dueDate === dateFilter;
            return matchPrio && matchDate;
        });

        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<p style="text-align:center; color:#666;">Chưa có công việc nào.</p>';
            return;
        }

        // Tạo giao diện cho từng công việc
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
                    <p>${task.description || '<i style="color:#aaa;">Không có mô tả</i>'}</p>
                    <div class="task-meta">
                        Phụ trách: <strong>${task.userId}</strong> | Hạn: ${formatDate(task.dueDate)} | Trạng thái: ${task.status === 'pending' ? 'Chưa xong' : 'Đã xong'}
                    </div>
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

    // 4. Xử lý sự kiện submit form (Thêm/Sửa)
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Vô hiệu hóa nút bấm trong khi xử lý
        submitBtn.disabled = true;
        submitBtn.innerText = 'Đang xử lý...';
        
        const taskId = document.getElementById('taskId').value;
        const taskData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            priority: document.getElementById('priority').value,
            dueDate: document.getElementById('dueDate').value,
            status: 'pending',
            userId: document.getElementById('userId').value
        };

        try {
            if (taskId) {
                // Cập nhật công việc hiện có
                await fetchAPI(`${API_URL}/${taskId}`, 'PUT', taskData);
                showMessage("Đã cập nhật công việc!");
            } else {
                // Thêm công việc mới
                await fetchAPI(API_URL, 'POST', taskData);
                showMessage("Thêm công việc thành công!");
            }
            
            // Đặt lại trạng thái form
            taskForm.reset();
            document.getElementById('taskId').value = '';
            submitBtn.innerText = 'Lưu Công Việc';
            
            fetchTasks();
        } catch (error) {
            // Xử lý lỗi đã được thực hiện trong hàm fetchAPI
        } finally {
            // Khôi phục trạng thái nút bấm
            submitBtn.disabled = false;
            if(!document.getElementById('taskId').value) submitBtn.innerText = 'Lưu Công Việc';
        }
    });

    // 5. Đánh dấu hoàn thành công việc
    window.completeTask = async function(id) {
        const task = tasks.find(t => t.taskId === id);
        if(task) {
            try {
                const updatedTask = { ...task, status: 'completed' };
                await fetchAPI(`${API_URL}/${id}`, 'PUT', updatedTask);
                fetchTasks();
            } catch (error) {
                // Xử lý lỗi đã được thực hiện trong hàm fetchAPI
            }
        }
    }

    // 6. Xóa công việc
    window.deleteTask = async function(id) {
        if(confirm('Bạn có chắc muốn xóa công việc này? Hành động này không thể hoàn tác.')) {
            try {
                await fetchAPI(`${API_URL}/${id}`, 'DELETE');
                showMessage("Đã xóa công việc!");
                fetchTasks();
            } catch (error) {
                // Xử lý lỗi đã được thực hiện trong hàm fetchAPI
            }
        }
    }

    // 7. Điền thông tin công việc lên form để sửa
    window.editTask = function(id) {
        const task = tasks.find(t => t.taskId === id);
        if(!task) return;
        
        document.getElementById('taskId').value = task.taskId;
        document.getElementById('title').value = task.title;
        document.getElementById('description').value = task.description;
        document.getElementById('priority').value = task.priority;
        document.getElementById('dueDate').value = task.dueDate;
        document.getElementById('userId').value = task.userId || '';

        document.getElementById('submitBtn').innerText = 'Cập Nhật';
        
        // Cuộn màn hình lên khu vực form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Xử lý các sự kiện cho bộ lọc
    filterPriority.addEventListener('change', renderTasks);
    filterDate.addEventListener('change', renderTasks);
    clearFiltersBtn.addEventListener('click', () => {
        filterPriority.value = 'all';
        filterDate.value = '';
        renderTasks();
    });

    // Tải dữ liệu khi khởi tạo trang
    fetchTasks();
});