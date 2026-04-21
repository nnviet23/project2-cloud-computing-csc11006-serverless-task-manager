const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
    DynamoDBDocumentClient,
    ScanCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand
} = require('@aws-sdk/lib-dynamodb');

// Khởi tạo kết nối DynamoDB
const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'TasksTable';

// Cấu hình CORS cực kỳ quan trọng để Frontend gọi được API
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Ở đồ án thực tế có thể thay bằng link CloudFront của bạn
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event) => {
    console.log("Sự kiện nhận được:", JSON.stringify(event));
    let body;
    let statusCode = 200;

    try {
        // Xử lý Preflight request của CORS
        if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }

        const routeKey = `${event.httpMethod} ${event.resource}`;

        switch (routeKey) {
            case 'GET /tasks':
                // Lấy toàn bộ danh sách công việc
                const scanResult = await dynamo.send(new ScanCommand({ TableName: TABLE_NAME }));
                body = scanResult.Items;
                break;

            case 'POST /tasks':
                // Thêm công việc mới
                const requestBody = JSON.parse(event.body);
                const newTask = {
                    ...requestBody,
                    taskId: Date.now().toString(), // Tạo ID
                    createdAt: new Date().toISOString()
                };
                await dynamo.send(new PutCommand({
                    TableName: TABLE_NAME,
                    Item: newTask
                }));
                body = { message: 'Tạo thành công', task: newTask };
                statusCode = 201;
                break;

            case 'PUT /tasks/{id}':
                // Cập nhật trạng thái hoặc thông tin
                const updateBody = JSON.parse(event.body);
                const updateId = event.pathParameters.id;
                await dynamo.send(new PutCommand({
                    TableName: TABLE_NAME,
                    Item: { ...updateBody, taskId: updateId }
                }));
                body = { message: 'Cập nhật thành công' };
                break;

            case 'DELETE /tasks/{id}':
                // Xóa công việc
                await dynamo.send(new DeleteCommand({
                    TableName: TABLE_NAME,
                    Key: { taskId: event.pathParameters.id }
                }));
                body = { message: 'Xóa thành công' };
                break;

            default:
                throw new Error(`Đường dẫn không tồn tại: ${routeKey}`);
        }
    } catch (err) {
        console.error(err);
        statusCode = 400;
        body = { error: err.message };
    }

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(body)
    };
};