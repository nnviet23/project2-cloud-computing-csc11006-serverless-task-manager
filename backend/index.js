const crypto = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
    DynamoDBDocumentClient,
    ScanCommand,
    PutCommand,
    DeleteCommand
} = require('@aws-sdk/lib-dynamodb');

// Khởi tạo kết nối tới DynamoDB
const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'TasksTable_01';

// Cấu hình Header cho phép phản hồi từ domain CloudFront cụ thể
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://drj7otpqp57zn.cloudfront.net',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

/**
 * Hàm xử lý chính cho AWS Lambda
 * Điều hướng yêu cầu dựa trên HTTP Method và Resource Path
 */
exports.handler = async (event) => {
    console.log("Event Received:", JSON.stringify(event));
    let body;
    let statusCode = 200;

    try {
        // Xử lý Preflight request cho cơ chế CORS
        if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }

        const routeKey = `${event.httpMethod} ${event.resource}`;

        switch (routeKey) {
            case 'GET /tasks':
                // Truy vấn toàn bộ danh sách công việc từ database
                const scanResult = await dynamo.send(new ScanCommand({ TableName: TABLE_NAME }));
                body = scanResult.Items;
                break;

            case 'POST /tasks':
                // Xử lý tạo công việc mới với ID duy nhất và thời gian khởi tạo
                const postData = JSON.parse(event.body);
                const newTask = {
                    ...postData,
                    taskId: crypto.randomUUID(),
                    createdAt: new Date().toISOString()
                };
                await dynamo.send(new PutCommand({
                    TableName: TABLE_NAME,
                    Item: newTask
                }));
                body = { message: 'Tạo công việc thành công', task: newTask };
                statusCode = 201;
                break;

            case 'PUT /tasks/{id}':
                // Cập nhật thông tin công việc dựa trên ID được cung cấp
                const updateData = JSON.parse(event.body);
                const updateId = event.pathParameters.id;
                await dynamo.send(new PutCommand({
                    TableName: TABLE_NAME,
                    Item: { ...updateData, taskId: updateId }
                }));
                body = { message: 'Cập nhật thành công' };
                statusCode = 200;
                break;

            case 'DELETE /tasks/{id}':
                // Loại bỏ công việc khỏi hệ thống theo ID
                await dynamo.send(new DeleteCommand({
                    TableName: TABLE_NAME,
                    Key: { taskId: event.pathParameters.id }
                }));
                body = { message: 'Xóa công việc thành công' };
                statusCode = 200;
                break;

            default:
                // Lỗi khi Client gọi tới các Endpoint không được định nghĩa
                throw new Error(`Route not supported: ${routeKey}`);
        }
    } catch (err) {
        console.error("Chi tiết lỗi hệ thống:", err);

        // Phân loại mã lỗi trả về để hỗ trợ Debug nhanh trên trình duyệt
        if (err instanceof SyntaxError) {
            // Lỗi khi dữ liệu gửi lên không phải là JSON hợp lệ
            statusCode = 400;
            body = { error: "Định dạng JSON không hợp lệ", details: err.message };
        } 
        else if (err.name === 'ValidationException' || err.name === 'ConditionalCheckFailedException') {
            // Lỗi do dữ liệu không khớp với Schema của DynamoDB hoặc thiếu trường bắt buộc
            statusCode = 400;
            body = { error: "Dữ liệu đầu vào không hợp lệ", type: err.name };
        } 
        else if (err.message.includes("Route not supported")) {
            // Lỗi truy cập sai đường dẫn API
            statusCode = 404;
            body = { error: err.message };
        } 
        else {
            // Các lỗi nghiêm trọng liên quan đến quyền truy cập (IAM) hoặc kết nối mạng (VPC)
            statusCode = 500;
            body = { 
                error: "Lỗi thực thi tại Backend", 
                type: err.name,
                message: err.message 
            };
        }
    }

    return {
        statusCode,
        headers,
        body: JSON.stringify(body)
    };
};