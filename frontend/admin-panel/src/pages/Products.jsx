import React, { useState, useEffect } from 'react';
import { productAPI } from '../utils/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    unit: 'pcs',
    image: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = async () => {
    try {
      const response = await productAPI.getAllProducts();
      setProducts(response.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Could not fetch products from backend.');
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openNewProductModal = () => {
    setCurrentProduct(null);
    setFormValues({
      name: '',
      category: '',
      price: '',
      stock: '',
      unit: 'pcs',
      image: '',
      description: ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleInputChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: formValues.name.trim(),
        category: formValues.category.trim() || 'Uncategorized',
        price: Number(formValues.price),
        stock: Number(formValues.stock),
        unit: formValues.unit.trim() || 'pcs',
        image: formValues.image.trim() || null,
        description: formValues.description.trim() || null,
        inDeal: false,
        deal_price: null,
        deal_end: null
      };

      if (!payload.name || !payload.category || !payload.price || !payload.stock) {
        setError('Please fill in all required fields.');
        setLoading(false);
        return;
      }

      await productAPI.createProduct(payload);
      await loadProducts();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Create product failed:', err);
      setError(err.message || 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="table-container">
        <div className="table-header">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search products..." 
            style={{width: '300px'}}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary" onClick={openNewProductModal}>
            + Add Product
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Deal Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.ProductID || product.id}>
                <td>{product.name}</td>
                <td>{product.category || 'Uncategorized'}</td>
                <td>${Number(product.price).toFixed(2)}</td>
                <td style={{color: product.stock < 10 ? 'red' : 'inherit', fontWeight: product.stock < 10 ? 'bold' : 'normal'}}>
                  {product.stock}
                </td>
                <td>
                  <span className={`status-badge ${product.current_price < product.price ? 'bg-green' : 'bg-amber'}`}>
                    {product.current_price < product.price ? 'On Deal' : 'No Deal'}
                  </span>
                </td>
                <td style={{display: 'flex', gap: '8px'}}>
                  <button className="btn btn-blue" style={{background: '#3b82f6', color: 'white'}} disabled>
                    Edit
                  </button>
                  <button className="btn btn-warning" disabled>Deal</button>
                  <button className="btn btn-danger" disabled>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{currentProduct ? 'Edit Product' : 'Add New Product'}</h2>

            {error && (
              <div style={{ marginBottom: '16px', color: '#b91c1c', fontWeight: '600' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formValues.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  className="form-control"
                  value={formValues.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="Fruits, Dairy, Bakery"
                  required
                />
              </div>
              <div style={{display: 'flex', gap: '15px'}}>
                <div className="form-group" style={{flex: 1}}>
                  <label>Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formValues.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label>Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formValues.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{display: 'flex', gap: '15px'}}>
                <div className="form-group" style={{flex: 1}}>
                  <label>Unit</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formValues.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label>Image URL</label>
                  <input
                    type="url"
                    className="form-control"
                    value={formValues.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    placeholder="Optional product image URL"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={formValues.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional product description"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}