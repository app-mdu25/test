document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});

function loadOrders() {
    googleScriptFetch('getOrders', {}, (data) => {
        displayOrders(data);
    });
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';
    orders.forEach(order => {
        const div = document.createElement('div');
        div.className = 'card mb-3';
        div.innerHTML = `
            <div class="card-body">
                <h5>คำสั่งซื้อ #${order.OrderID}</h5>
                <p>สินค้า: ${order.ProductName}, จำนวน: ${order.Quantity}</p>
                <p>สถานะ: ${order.Status}</p>
                <button class="btn btn-success" onclick="updateOrderStatus(${order.OrderID}, 'Shipped')">จัดส่งแล้ว</button>
            </div>
        `;
        ordersList.appendChild(div);
    });
}

function updateOrderStatus(orderId, status) {
    googleScriptFetch('updateOrderStatus', { orderId: orderId, status: status }, (response) => {
        if (response.success) {
            Swal.fire('สำเร็จ!', 'อัปเดตสถานะสำเร็จ', 'success');
            loadOrders();
            sendLineNotification(response.lineId, 'สินค้าของคุณถูกจัดส่งแล้ว!');
        }
    });
}

function googleScriptFetch(endpoint, data, callback) {
    fetch(`https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?endpoint=${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    }).then(response => response.json()).then(callback);
}

function sendLineNotification(lineId, message) {
    fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_LINE_CHANNEL_ACCESS_TOKEN'
        },
        body: JSON.stringify({
            to: lineId,
            messages: [{ type: 'text', text: message }]
        })
    });
}
