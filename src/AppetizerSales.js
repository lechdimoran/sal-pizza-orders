import React, { useState, useMemo } from "react";
import { useApi, useApiMutation } from "./useApi";
import ToastContainer from "./ToastContainer";

// Helper to parse tuple string format for appetizers
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
    
    if (parts.length < 2) return null;
    
    return {
        id: parseInt(parts[0]),
        description: parts[1].replace(/^"|"$/g, '')
    };
};

// Helper to normalize appetizer items
const normalizeAppetizer = (item) => {
    if (Array.isArray(item) && item.length > 0) {
        item = item[0];
    }
    
    if (item && item.fn_GetAppetizers) {
        return parseTupleString(item.fn_GetAppetizers);
    }
    if (typeof item === 'string') {
        return parseTupleString(item);
    }
    
    return {
        id: item?.id || item?.Id || item?.ID,
        description: item?.description || item?.Description || item?.name || item?.Name || ''
    };
};

function AppetizerSales() {
    const { data: appetizersData, loading: appetizersLoading, error: appetizersError } = useApi('/appetizers');
    const { data: pricesData, loading: pricesLoading, error: pricesError } = useApi('/appetizerprices');
    const { mutate: submitAppetizerOrders, loading: submitting } = useApiMutation('POST');
    
    const [toasts, setToasts] = useState([]);
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [orders, setOrders] = useState([{ id: Math.random(), appetizerId: null, quantity: 1 }]);
    
    // Normalize appetizers data
    const appetizers = useMemo(() => {
        if (!appetizersData) return [];
        if (Array.isArray(appetizersData)) {
            return appetizersData.map(item => normalizeAppetizer(item)).filter(Boolean);
        }
        return [];
    }, [appetizersData]);
    
    // Normalize prices data - expecting (id, price) tuples
    const prices = useMemo(() => {
        if (!pricesData) return {};
        const priceMap = {};
        const priceArray = Array.isArray(pricesData) ? pricesData : [];
        
        priceArray.forEach(item => {
            if (Array.isArray(item) && item.length > 0) {
                item = item[0];
            }
            
            let id, price;
            
            // Check for tuple format
            if (item && typeof item === 'object' && item.fn_GetAppetizerPrices) {
                const tupleStr = item.fn_GetAppetizerPrices;
                if (tupleStr && typeof tupleStr === 'string') {
                    const inner = tupleStr.trim().slice(1, -1);
                    const parts = inner.split(',').map(p => p.trim());
                    if (parts.length >= 2) {
                        id = parseInt(parts[0]);
                        price = parseFloat(parts[1].replace('$', '').replace(',', ''));
                    }
                }
            } else if (item && typeof item === 'object') {
                // Property-based format
                id = item.id || item.Id || item.ID || item.appetizerId || item.AppetizerId;
                price = item.price || item.Price || item.cost || item.Cost;
                if (typeof price === 'string') {
                    price = parseFloat(price.replace('$', '').replace(',', ''));
                }
            }
            
            if (id && !isNaN(price)) {
                priceMap[id] = price;
            }
        });
        
        return priceMap;
    }, [pricesData]);
    
    // Calculate order total
    const orderTotal = useMemo(() => {
        return orders.reduce((total, order) => {
            if (order.appetizerId && prices[order.appetizerId]) {
                return total + (prices[order.appetizerId] * parseInt(order.quantity || 0));
            }
            return total;
        }, 0);
    }, [orders, prices]);
    
    const addToast = (message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };
    
    const dismissToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };
    
    const handleAddOrder = () => {
        setOrders(prev => [...prev, { id: Math.random(), appetizerId: null, quantity: 1 }]);
    };
    
    const handleRemoveOrder = (id) => {
        if (orders.length === 1) {
            addToast('At least one order is required', 'error');
            return;
        }
        setOrders(prev => prev.filter(order => order.id !== id));
    };
    
    const handleOrderChange = (id, field, value) => {
        setOrders(prev => prev.map(order => 
            order.id === id ? { 
                ...order, 
                [field]: field === 'quantity' ? parseInt(value) : value 
            } : order
        ));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate all orders have appetizer selected
        if (orders.some(order => !order.appetizerId)) {
            addToast('Please select an appetizer for all orders', 'error');
            return;
        }
        
        try {
            // Build items array with ingredientid and quantity
            const items = orders.map(order => {
                const appetizerId = parseInt(order.appetizerId);
                const quantity = parseInt(order.quantity);
                
                return {
                    ingredientid: appetizerId,
                    quantity: quantity
                };
            });
            
            const payload = {
                appetizerorderdate: orderDate,
                items: items,
                ordertotal: orderTotal
            };
            
            console.log('Submitting appetizer order:', payload);
            await submitAppetizerOrders('/insertappetizerorder', payload);
            addToast('Appetizer order submitted successfully!', 'success');
            
            // Reset form
            setOrderDate(new Date().toISOString().split('T')[0]);
            setOrders([{ id: Math.random(), appetizerId: null, quantity: 1 }]);
        } catch (err) {
            addToast('Failed to submit order: ' + err.message, 'error');
        }
    };
    
    return (
        <div className="page appetizer-sales">
            <ToastContainer toasts={toasts} onClose={dismissToast} />
            <h2>Appetizer Sales Entry</h2>
            
            {appetizersError && <div style={{ color: 'red', marginBottom: '1rem' }}>Error loading appetizers: {appetizersError}</div>}
            {pricesError && <div style={{ color: 'red', marginBottom: '1rem' }}>Error loading prices: {pricesError}</div>}
            
            <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
                {/* Date Section */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="orderDate" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Order Date
                    </label>
                    <input
                        id="orderDate"
                        type="date"
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                        required
                        style={{ padding: '0.5rem', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%', maxWidth: '200px' }}
                    />
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #ddd' }}>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Appetizer</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem', width: '120px' }}>Quantity</th>
                                <th style={{ textAlign: 'center', padding: '0.75rem', width: '80px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appetizersLoading ? (
                                <tr><td colSpan="3" style={{ padding: '1rem', textAlign: 'center' }}>Loading appetizers...</td></tr>
                            ) : (
                                orders.map((order, idx) => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            <select 
                                                value={order.appetizerId || ''}
                                                onChange={(e) => handleOrderChange(order.id, 'appetizerId', e.target.value)}
                                                required
                                                style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
                                            >
                                                <option value="">-- Select Appetizer --</option>
                                                {appetizers.map(app => (
                                                    <option key={app.id} value={app.id}>
                                                        {app.description}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                value={order.quantity || 1}
                                                onChange={(e) => handleOrderChange(order.id, 'quantity', e.target.value)}
                                                required
                                                style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveOrder(order.id)}
                                                style={{ padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px' }}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    
                    <button 
                        type="button"
                        onClick={handleAddOrder}
                        style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', fontSize: '1rem', marginBottom: '1rem' }}
                    >
                        + Add Another Appetizer
                    </button>
                </div>
                
                {/* Order Total */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Order Total:</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c5f2d' }}>
                            ${orderTotal.toFixed(2)}
                        </span>
                    </div>
                </div>
                
                <button 
                    type="submit" 
                    disabled={submitting || appetizersLoading}
                    style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', cursor: 'pointer' }}
                >
                    {submitting ? 'Submitting...' : 'Submit Orders'}
                </button>
            </form>
        </div>
    );
}

export default AppetizerSales;
