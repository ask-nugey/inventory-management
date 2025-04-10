import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../App';

function InventoryList() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'low', 'out'
  const navigate = useNavigate();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('product_inventory_view')
        .select('*')
        .order('product_name');
        
      if (error) throw error;
      
      setInventory(data || []);
    } catch (error) {
      setError('在庫データの取得に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 検索とフィルターを適用
  const filteredInventory = inventory.filter(item => {
    // 検索条件
    const matchesSearch = (
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category_name && item.category_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // フィルター条件
    if (filter === 'all') return matchesSearch;
    if (filter === 'low') return matchesSearch && item.quantity <= item.min_stock_level && item.quantity > 0;
    if (filter === 'out') return matchesSearch && item.quantity === 0;
    
    return matchesSearch;
  });

  // 在庫状態に応じたクラス名を取得
  const getStockStatusClass = (quantity, minStockLevel) => {
    if (quantity === 0) return 'stock-out';
    if (quantity <= minStockLevel) return 'stock-low';
    return 'stock-normal';
  };

  // 在庫状態を表示するテキスト
  const getStockStatusText = (quantity, minStockLevel) => {
    if (quantity === 0) return '在庫切れ';
    if (quantity <= minStockLevel) return '在庫低';
    return '正常';
  };

  // 在庫数調整ダイアログ
  const [adjustStock, setAdjustStock] = useState({
    show: false,
    productId: null,
    productName: '',
    currentQuantity: 0,
    newQuantity: 0,
    type: 'add' // 'add' or 'subtract'
  });

  const openAdjustStockDialog = (product, type) => {
    setAdjustStock({
      show: true,
      productId: product.product_id,
      productName: product.product_name,
      currentQuantity: product.quantity,
      newQuantity: 0,
      type
    });
  };

  const closeAdjustStockDialog = () => {
    setAdjustStock({
      show: false,
      productId: null,
      productName: '',
      currentQuantity: 0,
      newQuantity: 0,
      type: 'add'
    });
  };

  const handleAdjustStock = async () => {
    try {
      setLoading(true);
      
      const { productId, currentQuantity, newQuantity, type } = adjustStock;
      const updatedQuantity = type === 'add' 
        ? currentQuantity + parseInt(newQuantity)
        : Math.max(0, currentQuantity - parseInt(newQuantity));
      
      // 在庫数を更新
      const { error } = await supabase
        .from('inventory')
        .update({ quantity: updatedQuantity })
        .eq('product_id', productId);
        
      if (error) throw error;
      
      // 更新後に在庫リストを再読み込み
      fetchInventory();
      closeAdjustStockDialog();
    } catch (error) {
      setError('在庫調整に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inventory-list">
      <div className="list-header">
        <h2>在庫一覧</h2>
      </div>
      
      <div className="filter-toolbar">
        <div className="search-bar">
          <input
            type="text"
            placeholder="商品名、SKU、カテゴリー、保管場所で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-options">
          <label>
            <input 
              type="radio" 
              name="filter" 
              value="all" 
              checked={filter === 'all'} 
              onChange={() => setFilter('all')}
            />
            すべて
          </label>
          <label>
            <input 
              type="radio" 
              name="filter" 
              value="low" 
              checked={filter === 'low'} 
              onChange={() => setFilter('low')}
            />
            在庫低
          </label>
          <label>
            <input 
              type="radio" 
              name="filter" 
              value="out" 
              checked={filter === 'out'} 
              onChange={() => setFilter('out')}
            />
            在庫切れ
          </label>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading && !adjustStock.show ? (
        <div className="loading">データを読み込み中...</div>
      ) : (
        <div className="inventory-grid">
          {filteredInventory.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>商品名</th>
                  <th>SKU</th>
                  <th>カテゴリー</th>
                  <th>仕入先</th>
                  <th>在庫数</th>
                  <th>最小在庫</th>
                  <th>保管場所</th>
                  <th>状態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(item => (
                  <tr key={item.product_id}>
                    <td>{item.product_name}</td>
                    <td>{item.sku || '-'}</td>
                    <td>{item.category_name || '-'}</td>
                    <td>{item.supplier_name || '-'}</td>
                    <td>{item.quantity}</td>
                    <td>{item.min_stock_level}</td>
                    <td>{item.location || '-'}</td>
                    <td className={getStockStatusClass(item.quantity, item.min_stock_level)}>
                      {getStockStatusText(item.quantity, item.min_stock_level)}
                    </td>
                    <td className="action-buttons">
                      <button 
                        onClick={() => openAdjustStockDialog(item, 'add')}
                        className="btn btn-small btn-add"
                      >
                        入庫
                      </button>
                      <button 
                        onClick={() => openAdjustStockDialog(item, 'subtract')}
                        className="btn btn-small btn-subtract"
                        disabled={item.quantity <= 0}
                      >
                        出庫
                      </button>
                      <button 
                        onClick={() => navigate(`/inventory/edit/${item.product_id}`)}
                        className="btn btn-small btn-edit"
                      >
                        編集
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">該当する在庫データがありません</p>
          )}
        </div>
      )}
      
      {/* 在庫調整ダイアログ */}
      {adjustStock.show && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>
              {adjustStock.type === 'add' ? '入庫' : '出庫'}: {adjustStock.productName}
            </h3>
            <p>現在の在庫数: {adjustStock.currentQuantity}</p>
            
            <div className="form-group">
              <label htmlFor="stockAmount">{adjustStock.type === 'add' ? '入庫' : '出庫'}数量:</label>
              <input
                type="number"
                id="stockAmount"
                min="1"
                value={adjustStock.newQuantity}
                onChange={(e) => setAdjustStock({
                  ...adjustStock, 
                  newQuantity: parseInt(e.target.value) || 0
                })}
              />
            </div>
            
            <div className="modal-buttons">
              <button 
                onClick={closeAdjustStockDialog}
                className="btn btn-secondary"
              >
                キャンセル
              </button>
              <button 
                onClick={handleAdjustStock}
                className="btn btn-primary"
                disabled={!adjustStock.newQuantity || adjustStock.newQuantity <= 0}
              >
                {adjustStock.type === 'add' ? '入庫' : '出庫'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryList;