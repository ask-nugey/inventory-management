import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../App';

function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    category_id: '',
    supplier_id: '',
    purchase_price: '',
    selling_price: '',
    image_url: '',
    quantity: '0', // 初期在庫数
    min_stock_level: '5', // 最小在庫レベル
    location: '' // 保管場所
  });
  
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // カテゴリーと仕入先の選択肢を取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        // カテゴリーの取得
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');
          
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
        
        // 仕入先の取得
        const { data: suppliersData, error: suppliersError } = await supabase
          .from('suppliers')
          .select('id, name')
          .order('name');
          
        if (suppliersError) throw suppliersError;
        setSuppliers(suppliersData || []);
        
        // 編集モードの場合、商品データを取得
        if (isEditMode) {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
            
          if (productError) throw productError;
          
          // 在庫データを取得
          const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory')
            .select('*')
            .eq('product_id', id)
            .single();
            
          if (inventoryError && inventoryError.code !== 'PGRST116') { // 'PGRST116'はデータがない場合のエラー
            throw inventoryError;
          }
          
          // フォームデータにセット
          setFormData({
            ...productData,
            purchase_price: productData.purchase_price.toString(),
            selling_price: productData.selling_price.toString(),
            quantity: inventoryData ? inventoryData.quantity.toString() : '0',
            min_stock_level: inventoryData ? inventoryData.min_stock_level.toString() : '5',
            location: inventoryData ? inventoryData.location : ''
          });
        }
      } catch (error) {
        setError('データの取得に失敗しました: ' + error.message);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      // 数値型への変換
      const productData = {
        name: formData.name,
        description: formData.description,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        category_id: formData.category_id || null,
        supplier_id: formData.supplier_id || null,
        purchase_price: parseFloat(formData.purchase_price),
        selling_price: parseFloat(formData.selling_price),
        image_url: formData.image_url || null
      };
      
      let productId = id;
      
      if (isEditMode) {
        // 商品データの更新
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);
          
        if (updateError) throw updateError;
      } else {
        // 新規商品の作成
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();
          
        if (insertError) throw insertError;
        productId = newProduct.id;
      }
      
      // 在庫データの更新または作成
      const inventoryData = {
        product_id: productId,
        quantity: parseInt(formData.quantity),
        min_stock_level: parseInt(formData.min_stock_level),
        location: formData.location || null
      };
      
      // 在庫データが存在するか確認
      const { data: existingInventory, error: checkError } = await supabase
        .from('inventory')
        .select('id')
        .eq('product_id', productId);
        
      if (checkError) throw checkError;
      
      if (existingInventory && existingInventory.length > 0) {
        // 在庫データの更新
        const { error: updateInventoryError } = await supabase
          .from('inventory')
          .update(inventoryData)
          .eq('product_id', productId);
          
        if (updateInventoryError) throw updateInventoryError;
      } else {
        // 新規在庫データの作成
        const { error: insertInventoryError } = await supabase
          .from('inventory')
          .insert(inventoryData);
          
        if (insertInventoryError) throw insertInventoryError;
      }
      
      setSuccessMessage('商品データを保存しました');
      
      // 編集後に商品一覧へ戻る
      setTimeout(() => {
        navigate('/products');
      }, 1500);
      
    } catch (error) {
      setError('データの保存に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form">
      <h2>{isEditMode ? '商品情報の編集' : '新規商品登録'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>基本情報</h3>
          
          <div className="form-group">
            <label htmlFor="name">商品名 *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">商品説明</label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows="4"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sku">SKU</label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="barcode">バーコード</label>
              <input
                type="text"
                id="barcode"
                name="barcode"
                value={formData.barcode || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category_id">カテゴリー</label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id || ''}
                onChange={handleChange}
              >
                <option value="">カテゴリーを選択</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="supplier_id">仕入先</label>
              <select
                id="supplier_id"
                name="supplier_id"
                value={formData.supplier_id || ''}
                onChange={handleChange}
              >
                <option value="">仕入先を選択</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="purchase_price">仕入価格 *</label>
              <input
                type="number"
                id="purchase_price"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="selling_price">販売価格 *</label>
              <input
                type="number"
                id="selling_price"
                name="selling_price"
                value={formData.selling_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="image_url">画像URL</label>
            <input
              type="text"
              id="image_url"
              name="image_url"
              value={formData.image_url || ''}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="form-section">
          <h3>在庫情報</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">在庫数</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="min_stock_level">最小在庫レベル</label>
              <input
                type="number"
                id="min_stock_level"
                name="min_stock_level"
                value={formData.min_stock_level}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="location">保管場所</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="form-buttons">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="btn btn-secondary"
          >
            キャンセル
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;