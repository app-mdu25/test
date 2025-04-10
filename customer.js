let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    liff.init({ liffId: 'YOUR_LIFF_ID' }).then(() => {
        if (liff.isLoggedIn()) {
            const profile = liff.getProfile();
            document.getElementById('loginInfo').innerHTML = `ยินดีต้อนรับ: ${profile.displayName} (Line ID: ${profile.userId})`;
            loadProducts();
        } else {
            liff.login();
        }
    });
});

function loadProducts() {
    googleScriptFetch('getProducts', {}, (data) => {
        displayProducts(data);
    });
}

function displayProducts(products) {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';
    products.forEach(product => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-3';
        col.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${product.Name}</h5>
                    <p class="card-text">ราคา: ${product.Price} บาท</p>
                    <button class="btn btn-primary" onclick="addToCart(${product.ID}, '${product.Name}', ${product.Price})">เพิ่มในตะกร้า</button>
                </div>
            </div>
        `;
        productList.appendChild(col);
    });
}

function searchProducts() {
    const query = document.getElementById('searchInput').value;
    googleScriptFetch('searchProducts', { query: query }, (data) => {
        displayProducts(data);
    });
}

function addToCart(id, name, price) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity++;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    updateCart();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCart();
}

function updateCart() {
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = '';
    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `${item.name} - ${item.price} บาท x ${item.quantity} 
            <button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.id})">ลบ</button>`;
        cartItems.appendChild(div);
    });
}

function checkout() {
    if (!validateOrder()) {
        return;
    }

    const lineId = liff.getProfile().then(profile => profile.userId);
    googleScriptFetch('placeOrder', { cart: cart, lineId: lineId }, (response) => {
        if (response.success) {
            Swal.fire('สำเร็จ!', 'สั่งซื้อสินค้าสำเร็จ', 'success');
            cart = [];
            updateCart();
            sendLineNotification(lineId, 'มีคำสั่งซื้อใหม่!');
        } else {
            Swal.fire('ข้อผิดพลาด!', 'ไม่สามารถสั่งซื้อได้', 'error');
        }
    });
}

function validateOrder() {
    if (cart.length === 0) {
        Swal.fire('ข้อผิดพลาด!', 'กรุณาเพิ่มสินค้าในตะกร้าก่อน', 'warning');
        return false;
    }
    return true;
}

function googleScriptFetch(endpoint, data, callback) {
    fetch(`https://script.google.com/macros/s/AKfycbyCEGKegOY1ItI5XN1KnALWr_ygwaVWwI7zvlVl9QYWcMq2_A-a92wnlTpbMltCJMsmig/exec?endpoint=${endpoint}`, {
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
            'Authorization': 'Bearer GIyRK3lfQnwUnXefVGv5dBUUMbgIsRfDKRjJ7quMHU0uGTWVZ1Z9F4JIIXdn/KAplz5aKr9bGVnleaWZjcjbqFNwQEX3tsJbibezDgW6az65xj0zuLUQiI3gBBHJoEq31dAFmbleZF6foZvmj794VgdB04t89/1O/w1cDnyilFU='
        },
        body: JSON.stringify({
            to: lineId,
            messages: [{ type: 'text', text: message }]
        })
    });
}
