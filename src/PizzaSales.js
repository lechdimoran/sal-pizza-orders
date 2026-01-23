import React, { useState, useMemo } from "react";
import { useApi, useApiMutation } from "./useApi";

// Helper to parse tuple string format for sizes and toppings
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

// Helper to normalize items with tuple or property-based format
const normalizeItem = (item) => {
    if (Array.isArray(item) && item.length > 0) {
        item = item[0];
    }
    
    // Check for tuple-string format
    if (item && item.fn_GetPizzaSizes) {
        return parseTupleString(item.fn_GetPizzaSizes);
    }
    if (item && item.fn_GetToppings) {
        return parseTupleString(item.fn_GetToppings);
    }
    if (typeof item === 'string') {
        return parseTupleString(item);
    }
    
    // Property-based format
    return {
        id: item?.id || item?.Id || item?.ID,
        description: item?.description || item?.Description || item?.name || item?.Name || ''
    };
};

function PizzaSales() {
    const { data: sizesData, loading: sizesLoading, error: sizesError } = useApi('/pizzasizes');
    const { data: toppingsData, loading: toppingsLoading, error: toppingsError } = useApi('/toppings');
    const { mutate: insertPizzaOrder, loading: submitting } = useApiMutation('POST');
    
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedToppings, setSelectedToppings] = useState({});
    
    // Normalize sizes data
    const sizes = useMemo(() => {
        if (!sizesData) return [];
        if (Array.isArray(sizesData)) {
            return sizesData.map(item => normalizeItem(item)).filter(Boolean);
        }
        return [];
    }, [sizesData]);
    
    // Normalize toppings data
    const toppings = useMemo(() => {
        if (!toppingsData) return [];
        if (Array.isArray(toppingsData)) {
            return toppingsData.map(item => normalizeItem(item)).filter(Boolean);
        }
        return [];
    }, [toppingsData]);
    
    const handleSizeChange = (sizeId) => {
        setSelectedSize(sizeId);
    };
    
    const handleToppingChange = (toppingId) => {
        setSelectedToppings(prev => ({
            ...prev,
            [toppingId]: !prev[toppingId]
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const selectedToppingIds = Object.keys(selectedToppings)
            .filter(id => selectedToppings[id])
            .map(Number);
        
        try {
            console.log(`Submitting pizza order: sizeId=${selectedSize}, toppingIds=${selectedToppingIds}, orderDate=${orderDate}`);
            await insertPizzaOrder('/insertpizzaorder', {
                sizeid: selectedSize,
                toppingids: selectedToppingIds,
                orderdate: orderDate
            });
            console.log('Pizza order submitted successfully');
            // Reset form
            setOrderDate(new Date().toISOString().split('T')[0]);
            setSelectedSize(null);
            setSelectedToppings({});
        } catch (err) {
            console.error('Error submitting pizza order:', err);
        }
    };
    
    return (
        <div className="page pizza-sales">
            <h2>Pizza Sales Entry</h2>
            
            {sizesError && <div style={{ color: 'red', marginBottom: '1rem' }}>Error loading sizes: {sizesError}</div>}
            {toppingsError && <div style={{ color: 'red', marginBottom: '1rem' }}>Error loading toppings: {toppingsError}</div>}
            
            <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
                {/* Date Section */}
                <div style={{ marginBottom: '2rem' }}>
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
                
                {/* Pizza Size Section */}
                <fieldset style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <legend style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Pizza Size</legend>
                    {sizesLoading ? (
                        <p>Loading sizes...</p>
                    ) : sizes.length === 0 ? (
                        <p>No sizes available</p>
                    ) : (
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            {sizes.map(size => (
                                <label key={size.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="size"
                                        value={size.id}
                                        checked={selectedSize === size.id}
                                        onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                                    />
                                    {size.description}
                                </label>
                            ))}
                        </div>
                    )}
                </fieldset>
                
                {/* Toppings Section */}
                <fieldset style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <legend style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Toppings</legend>
                    {toppingsLoading ? (
                        <p>Loading toppings...</p>
                    ) : toppings.length === 0 ? (
                        <p>No toppings available</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            {toppings.map(topping => (
                                <label key={topping.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        value={topping.id}
                                        checked={selectedToppings[topping.id] || false}
                                        onChange={(e) => handleToppingChange(parseInt(e.target.value))}
                                    />
                                    {topping.description}
                                </label>
                            ))}
                        </div>
                    )}
                </fieldset>
                
                <button type="submit" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', cursor: 'pointer' }} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Place Order'}
                </button>
            </form>
        </div>
    );
}

export default PizzaSales;
