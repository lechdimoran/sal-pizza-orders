import React from "react";
import { useApi, useApiMutation } from "./useApi";

function PizzaOrders(){
    const { data: orders, loading, error, refetch } = useApi('/orders');
    const { mutate: createOrder, loading: creating } = useApiMutation('POST');

    const handleCreateOrder = async () => {
        try {
            await createOrder('/orders', { pizzaType: 'margherita', quantity: 1 });
            refetch(); // Refresh the orders list
        } catch (err) {
            console.error('Failed to create order:', err);
        }
    };

    if (loading) return <div>Loading orders...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="page pizza-orders">
            <h2>Pizza Orders</h2>
            <button onClick={handleCreateOrder} disabled={creating}>
                {creating ? 'Creating...' : 'Create New Order'}
            </button>
            <ul>
                {orders && orders.map(order => (
                    <li key={order.id}>{order.pizzaType} - {order.quantity}</li>
                ))}
            </ul>
        </div>
    );
}

export default PizzaOrders