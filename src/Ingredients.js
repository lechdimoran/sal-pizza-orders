import React, { useState, useEffect } from "react";
import { useApi, useApiMutation } from "./useApi";
import { apiGet } from "./apiService";
import "./Ingredients.css";

function Ingredients() {
    const { data: ingredients, loading, error, refetch } = useApi('/ingredients');
    const { mutate: updateIngredient, loading: updating } = useApiMutation('POST');
    
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

    // Handle row selection
    const handleRowClick = async (ingredient) => {
        try {
            // Fetch detailed ingredient data
            const detailedIngredient = await apiGet(`/ingredient`, { 
                IngredientID: ingredient.ingredientid 
            });
            
            setSelectedIngredient(detailedIngredient);
            setFormData({
                IngredientId: detailedIngredient.ingredientid || ingredient.ingredientid,
                inDescription: detailedIngredient.description || '',
                inPackSize: detailedIngredient.packsize || '',
                inPackType: detailedIngredient.packtype || '',
                inSmallServing: detailedIngredient.smallserving || '',
                inLargeServing: detailedIngredient.largeserving || '',
                inKingKoldPrice: detailedIngredient.kingkoldprice || '',
                inPiquaPizzaSupply: detailedIngredient.piquapizzasupply || '',
                inTopping: detailedIngredient.topping || false,
                inAppetizer: detailedIngredient.appetizer || false
            });
            setEditing(true);
        } catch (err) {
            console.error('Failed to fetch ingredient details:', err);
            alert('Failed to load ingredient details');
        }
    };

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle form submission
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
            
            alert('Ingredient updated successfully!');
            setEditing(false);
            setSelectedIngredient(null);
            refetch(); // Refresh the ingredients list
        } catch (err) {
            console.error('Failed to update ingredient:', err);
            alert('Failed to update ingredient: ' + err.message);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        setEditing(false);
        setSelectedIngredient(null);
    };

    if (loading) return <div className="page ingredients"><p>Loading ingredients...</p></div>;
    if (error) return <div className="page ingredients"><p>Error: {error}</p></div>;

    return (
        <div className="page ingredients">
            <h2>Ingredients</h2>
            
            {!editing ? (
                <div className="ingredients-table-container">
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
                            {ingredients && ingredients.map((ingredient) => (
                                <tr 
                                    key={ingredient.ingredientid} 
                                    onClick={() => handleRowClick(ingredient)}
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                                >
                                    <td>{ingredient.ingredientid}</td>
                                    <td>{ingredient.description}</td>
                                    <td>{ingredient.packsize}</td>
                                    <td>{ingredient.packtype}</td>
                                    <td>{ingredient.smallserving}</td>
                                    <td>{ingredient.largeserving}</td>
                                    <td>${ingredient.kingkoldprice}</td>
                                    <td>${ingredient.piquapizzasupply}</td>
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