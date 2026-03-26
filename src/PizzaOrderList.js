import React, { useMemo } from "react";
import { useApi } from "./useApi";
import "./PizzaOrderList.css";

// Helper to parse tuple string format for pizza orders
const parseTupleString = (tupleStr) => {
    if (!tupleStr || typeof tupleStr !== 'string') return null;
    
    const inner = tupleStr.trim().slice(1, -1);
    const parts = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < inner.length; i++) {
        const char = inner[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            parts.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    if (current) parts.push(current.trim());
    
    // For pizza orders, we expect 4 parts: orderNumber, orderDate, crustSize, toppings
    if (parts.length < 4) return null;
    
    return {
        orderNumber: parts[0].replace(/^"|"$/g, ''),
        orderDate: parts[1].replace(/^"|"$/g, ''),
        crustSize: parts[2].replace(/^"|"$/g, ''),
        toppings: parts[3].replace(/^"|"$/g, '')
    };
};

// Helper to normalize pizza order items
const normalizePizzaOrder = (item) => {
    if (Array.isArray(item) && item.length > 0) {
        item = item[0];
    }
    
    // Check for tuple-string format
    if (item && item.fn_GetPizzaOrderList) {
        return parseTupleString(item.fn_GetPizzaOrderList);
    }
    if (item && item.fn_GetPizzaOrders) {
        return parseTupleString(item.fn_GetPizzaOrders);
    }
    if (typeof item === 'string') {
        return parseTupleString(item);
    }
    
    // Property-based format for row-level ingredients from DB view
    return {
        orderId: item?.Pizza_Order_Id || item?.pizzaOrderId || item?.OrderId || item?.orderId || item?.order_number || item?.OrderNumber || '',
        orderDate: item?.Pizza_Order_Date || item?.pizzaOrderDate || item?.order_date || item?.orderDate || item?.OrderDate || '',
        size: item?.Size || item?.size || item?.crustSize || item?.CrustSize || item?.crust_size || item?.Crust_Size || '',
        ingredient: item?.Ingredient || item?.ingredient || item?.Topping || item?.topping || ''
    };
};

function PizzaOrderList() {
    const { data: ordersData, loading, error } = useApi('/pizzaorderlist');

    // Normalized array of order-ingredient records
    const normalizedOrders = useMemo(() => {
        if (!ordersData) return [];

        const rawArray =
            Array.isArray(ordersData) ? ordersData :
            Array.isArray(ordersData?.data) ? ordersData.data :
            Array.isArray(ordersData?.items) ? ordersData.items :
            Array.isArray(ordersData?.orders) ? ordersData.orders :
            Array.isArray(ordersData?.pizzaOrders) ? ordersData.pizzaOrders :
            (typeof ordersData === 'object' && ordersData ? [ordersData] : []);

        return rawArray
            .map(item => {
                const record = normalizePizzaOrder(item);
                return record && record.orderId ? record : null;
            })
            .filter(Boolean);
    }, [ordersData]);

    const { orders, toppingColumns } = useMemo(() => {
        const orderIdMap = new Map();
        const allToppings = new Set();

        normalizedOrders.forEach(item => {
            const orderId = item.orderId;
            if (!orderId) return;

            allToppings.add(item.ingredient);

            if (!orderIdMap.has(orderId)) {
                orderIdMap.set(orderId, {
                    orderId,
                    orderDate: item.orderDate,
                    size: item.size,
                    toppings: new Set(),
                });
            }

            orderIdMap.get(orderId).toppings.add(item.ingredient);
        });

        const orderRows = Array.from(orderIdMap.values()).sort((a, b) => a.orderId - b.orderId);
        const toppingColumns = Array.from(allToppings).sort((a, b) => a.localeCompare(b));

        return { orders: orderRows, toppingColumns };
    }, [normalizedOrders]);

    if (loading) {
        return (
            <div className="page pizza-order-list">
                <h2>Pizza Orders</h2>
                <p className="loading">Loading orders...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page pizza-order-list">
                <h2>Pizza Orders</h2>
                <p className="error">Error loading orders: {error}</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="page pizza-order-list">
                <h2>Pizza Orders</h2>
                <p>No orders found.</p>
            </div>
        );
    }

    return (
        <div className="page pizza-order-list">
            <h2>Pizza Orders</h2>

            <div className="orders-grid-container">
                <table className="orders-grid">
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Order Date</th>
                            <th>Crust Size</th>
                            {toppingColumns.map((topping) => (
                                <th key={topping}>{topping}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.orderId}>
                                <td>{order.orderId}</td>
                                <td>{formatDate(order.orderDate)}</td>
                                <td>{order.size}</td>
                                {toppingColumns.map((topping) => (
                                    <td key={topping} className="toppings-cell">
                                        {order.toppings.has(topping) ? '✔' : ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');

        return `${month}/${day}/${year}`;
    } catch {
        return dateString;
    }
}

export default PizzaOrderList;
