import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../App';

function InventoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    quantity: '0',
    min_stock_level: '5',
    location: ''
  });
  
  const [productInfo, setProductInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 商品情報を取得
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
          
        if (productError) throw productError;
        setProductInfo(productData);
        
        // 在庫データを取得
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select('*')
          .eq('product_id', id)
          .single();
          
        if (inventoryError && inventoryError.code !== 'PGRST116') { // データがない場合のエラー
          throw inventoryError;
        }
        
        if (inventoryData) {
          setFormData({
            quantity: inventoryData.quantity.toString(),
            min_stock_level: inventoryData.min_stock_level.toString(),
            location: inventoryData.location || ''
          });
        }
      } catch (error) {
        setError('データの取得に失敗しました: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
      
      // 在庫データの作成または更新
      const inventoryData = {
        product_id: parseInt(id),
        quantity: parseInt(formData.quantity),
        min_stock_level: parseInt(formData.min_stock_level),
        location: formData.location || null
      };
      
      // 在庫データが存在するか確認
      const { data: existingInventory, error: checkError } = await supabase
        .from('inventory')
        .select('id')
        .eq('product_id', id);
        
      if (checkError) throw checkError;
      
      if (existingInventory && existingInventory.length > 0) {
        // 在庫データの更新
        const { error: updateError } = await supabase
          .from('inventory')
          .update(inventoryData)
          .eq('product_id', id);
          
        if (updateError) throw updateError;
      } else {
        // 新規在庫データの作成
        const { error: insertError } = await supabase
          .from('inventory')
          .insert(inventoryData);
          
        if (insertError) throw insertError;
      }
      
      setSuccessMessage('在庫データを保存しました');
      
      // 編集後に在庫一覧へ戻る
      setTimeout(() => {
        navigate('/inventory');
      }, 1500);
      
    } catch (error) {
      setError('データの保存に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !productInfo) {
    return <div className="loading">データを読み込み中...</div>;
  }

  if (!productInfo) {
    return <div className="error-message">商品が見つかりません</div>;
  }

  return (
    <div className="inventory-form">
      <h2>在庫情報の編集: {productInfo.name}</h2>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="product-info">
            <p><strong>SKU:</strong> {productInfo.sku || '-'}</p>
            <p><strong>商品説明:</strong> {productInfo.description || '-'}</p>
          </div>
          
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
              <small>この数値以下になると在庫不足として警告します</small>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="location">保管場所</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="form-buttons">
          <button
            type="button"
            onClick={() => navigate('/inventory')}
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

export default InventoryForm;