import React, { useState, useEffect, useMemo } from "react";
import { useApi, useApiMutation } from "./useApi";
import { apiGet } from "./apiService";
import "./Ingredients.css";
import ToastContainer from "./ToastContainer";

// Helper to parse tuple string format: (id,desc,packSize,packType,smallServ,largeServ,kingPrice,piquaPrice,topping)
const parseTupleString = (tupleStr) => {
    if (!tupleStr || typeof tupleStr !== 'string') return null;
    
    // Remove outer parentheses
    const inner = tupleStr.trim().slice(1, -1);
    
    // Parse CSV-like format with quoted strings support
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
    
    if (parts.length < 9) return null;
    
    return {
        ingredientid: parseInt(parts[0]),
        description: parts[1].replace(/^"|"$/g, ''), // Remove quotes
        packsize: parseInt(parts[2]),
        packtype: parts[3],
        smallserving: parseFloat(parts[4]),
        largeserving: parseFloat(parts[5]),
        kingkoldprice: parseFloat(parts[6].replace('$', '').replace(',', '')),
        piquapizzasupply: parseFloat(parts[7].replace('$', '').replace(',', '')),
        topping: parts[8].toLowerCase() === 't',
        appetizer: false
    };
};

// Helpers to map varying API field names to our UI model
const getProp = (obj, keys) => {
    for (const k of keys) {
        if (obj && Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== null && obj[k] !== undefined) {
            return obj[k];
        }
    }
    return undefined;
};

const normalizeIngredient = (item) => {
    // First, check if this is a tuple-string format (fn_GetIngredients key)
    if (item && item.fn_GetIngredients) {
        const parsed = parseTupleString(item.fn_GetIngredients);
        if (parsed) return parsed;
    }
    
    // Fall back to property-based format
    const ingredientid = getProp(item, ["ingredientid", "IngredientId", "IngredientID", "ingredientId", "id"]);
    return {
        ingredientid: ingredientid,
        description: getProp(item, ["description", "Description", "desc", "name"]) || "",
        packsize: Number(getProp(item, ["packsize", "PackSize", "packSize"])) || 0,
        packtype: getProp(item, ["packtype", "PackType", "packType", "unit", "Unit"]) || "",
        smallserving: Number(getProp(item, ["smallserving", "SmallServing", "smallServing"])) || 0,
        largeserving: Number(getProp(item, ["largeserving", "LargeServing", "largeServing"])) || 0,
        kingkoldprice: Number(getProp(item, ["kingkoldprice", "KingKoldPrice", "price", "Price"])) || 0,
        piquapizzasupply: Number(getProp(item, ["piquapizzasupply", "PiquaPizzaSupply", "supplyCost"])) || 0,
        topping: Boolean(getProp(item, ["topping", "Topping", "isTopping"])) || false,
        appetizer: Boolean(getProp(item, ["appetizer", "Appetizer", "isAppetizer"])) || false,
    };
};

function Ingredients() {
    const { data: ingredients, loading, error, refetch } = useApi('/ingredients');
    const { mutate: updateIngredient, loading: updating } = useApiMutation('POST');
    const [toasts, setToasts] = useState([]);
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        IngredientId: '',
        inDescription: '',
        inPackSize: '',
        inPackType: '',
        inSmallServing: '',
        inLargeServing: '',
        inKingKoldPrice: '',
        inPiquaPizzaSupply: '',
        inTopping: false,
        inAppetizer: false
    });

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

    useEffect(() => {
        if (error) {
            addToast(`Error: ${error}`, 'error');
        }
    }, [error]);

    const rawRows = useMemo(() => {
        if (!ingredients) return [];
        if (Array.isArray(ingredients)) return ingredients;
        if (Array.isArray(ingredients?.data)) return ingredients.data;
        if (Array.isArray(ingredients?.items)) return ingredients.items;
        return [];
    }, [ingredients]);

    const rows = useMemo(() => rawRows.map(normalizeIngredient), [rawRows]);

    const handleRowClick = async (ingredient) => {
        try {
            const detailedIngredient = await apiGet(`/ingredient/${ingredient.ingredientid}`);
            const normalizedDetail = normalizeIngredient(detailedIngredient);
            setSelectedIngredient(normalizedDetail);
            setFormData({
                IngredientId: normalizedDetail.ingredientid || ingredient.ingredientid,
                inDescription: normalizedDetail.description || '',
                inPackSize: normalizedDetail.packsize || '',
                inPackType: normalizedDetail.packtype || '',
                inSmallServing: normalizedDetail.smallserving || '',
                inLargeServing: normalizedDetail.largeserving || '',
                inKingKoldPrice: normalizedDetail.kingkoldprice || '',
                inPiquaPizzaSupply: normalizedDetail.piquapizzasupply || '',
                inTopping: normalizedDetail.topping || false,
                inAppetizer: normalizedDetail.appetizer || false
            });
            setEditing(true);
        } catch (err) {
            addToast('Failed to load ingredient details', 'error');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateIngredient('/updateingredient', {
                IngredientId: parseInt(formData.IngredientId),
                inDescription: formData.inDescription,
                inPackSize: parseInt(formData.inPackSize),
                inPackType: formData.inPackType,
                inSmallServing: parseFloat(formData.inSmallServing),
                inLargeServing: parseFloat(formData.inLargeServing),
                inKingKoldPrice: parseFloat(formData.inKingKoldPrice),
                inPiquaPizzaSupply: parseFloat(formData.inPiquaPizzaSupply),
                inTopping: formData.inTopping,
                inAppetizer: formData.inAppetizer
            });
            addToast('Ingredient updated successfully!', 'success');
            setEditing(false);
            setSelectedIngredient(null);
            refetch();
        } catch (err) {
            addToast('Failed to update ingredient: ' + err.message, 'error');
        }
    };

    const handleCancel = () => {
        setEditing(false);
        setSelectedIngredient(null);
    };

    if (loading) return <div className="page ingredients"><p>Loading ingredients...</p></div>;
    if (error) return <div className="page ingredients"><p>Error: {error}</p></div>;

    return (
        <div className="page ingredients">
            <ToastContainer toasts={toasts} onClose={dismissToast} />
            <h2>Ingredients</h2>
            {!editing ? (
                <div className="ingredients-table-container">
                    {rows.length === 0 && (
                        <div style={{ padding: '1rem', color: '#666' }}>No ingredients to display.</div>
                    )}
                    <table className="ingredients-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Description</th>
                                <th>Pack Size</th>
                                <th>Pack Type</th>
                                <th>Small Serving</th>
                                <th>Large Serving</th>
                                <th>King Kold Price</th>
                                <th>Piqua Pizza Supply</th>
                                <th>Topping</th>
                                <th>Appetizer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows && rows.map((ingredient, idx) => (
                                <tr 
                                    key={ingredient.ingredientid ?? idx} 
                                    onClick={() => handleRowClick(ingredient)}
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                                >
                                    <td>{ingredient.ingredientid ?? '-'}</td>
                                    <td>{ingredient.description ?? '-'}</td>
                                    <td>{ingredient.packsize ?? '-'}</td>
                                    <td>{ingredient.packtype ?? '-'}</td>
                                    <td>{ingredient.smallserving ?? '-'}</td>
                                    <td>{ingredient.largeserving ?? '-'}</td>
                                    <td>{ingredient.kingkoldprice !== undefined ? `$${ingredient.kingkoldprice}` : '-'}</td>
                                    <td>{ingredient.piquapizzasupply !== undefined ? `$${ingredient.piquapizzasupply}` : '-'}</td>
                                    <td>{ingredient.topping ? '✓' : ''}</td>
                                    <td>{ingredient.appetizer ? '✓' : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p style={{ marginTop: '10px', color: '#666' }}>Click on a row to edit</p>
                </div>
            ) : (
                <div className="ingredient-form">
                    <h3>Edit Ingredient</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Ingredient ID:</label>
                            <input type="text" value={formData.IngredientId} disabled />
                        </div>
                        <div className="form-group">
                            <label>Description:</label>
                            <input 
                                type="text" 
                                name="inDescription" 
                                value={formData.inDescription}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Pack Size:</label>
                            <input 
                                type="number" 
                                name="inPackSize" 
                                value={formData.inPackSize}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Pack Type:</label>
                            <input 
                                type="text" 
                                name="inPackType" 
                                value={formData.inPackType}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Small Serving:</label>
                            <input 
                                type="number" 
                                step="0.01"
                                name="inSmallServing" 
                                value={formData.inSmallServing}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Large Serving:</label>
                            <input 
                                type="number" 
                                step="0.01"
                                name="inLargeServing" 
                                value={formData.inLargeServing}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>King Kold Price:</label>
                            <input 
                                type="number" 
                                step="0.01"
                                name="inKingKoldPrice" 
                                value={formData.inKingKoldPrice}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Piqua Pizza Supply:</label>
                            <input 
                                type="number" 
                                step="0.01"
                                name="inPiquaPizzaSupply" 
                                value={formData.inPiquaPizzaSupply}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                <input 
                                    type="checkbox" 
                                    name="inTopping" 
                                    checked={formData.inTopping}
                                    onChange={handleChange}
                                />
                                Topping
                            </label>
                        </div>

                        <div className="form-group">
                            <label>
                                <input 
                                    type="checkbox" 
                                    name="inAppetizer" 
                                    checked={formData.inAppetizer}
                                    onChange={handleChange}
                                />
                                Appetizer
                            </label>
                        </div>

                        <div className="form-actions">
                            <button type="submit" disabled={updating}>
                                {updating ? 'Updating...' : 'Update Ingredient'}
                            </button>
                            <button type="button" onClick={handleCancel}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Ingredients;