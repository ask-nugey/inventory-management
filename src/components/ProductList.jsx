import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../App';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          sku,
          purchase_price,
          selling_price,
          categories(id, name),
          suppliers(id, name),
          image_url
        `)
        .order('name');
        
      if (error) throw error;
      
      setProducts(data || []);
    } catch (error) {
      setError('商品データの取得に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('この商品を削除してもよろしいですか？')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // 在庫データを削除
      const { error: inventoryError } = await supabase
        .from('inventory')
        .delete()
        .match({ product_id: id });
        
      if (inventoryError) throw inventoryError;
      
      // 商品データを削除
      const { error } = await supabase
        .from('products')
        .delete()
        .match({ id });
        
      if (error) throw error;
      
      // 削除後に商品リストを再読み込み
      fetchProducts();
    } catch (error) {
      setError('商品の削除に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 検索フィルター
  const filteredProducts = products.filter(product => {
    return (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.categories?.name && product.categories.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.suppliers?.name && product.suppliers.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="product-list">
      <div className="list-header">
        <h2>商品一覧</h2>
        <Link to="/products/new" className="btn btn-primary">
          新規商品登録
        </Link>
      </div>
      
      <div className="search-bar">
        <input
          type="text"
          placeholder="商品名、SKU、カテゴリー、仕入先で検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">データを読み込み中...</div>
      ) : (
        <div className="product-grid">
          {filteredProducts.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>商品名</th>
                  <th>SKU</th>
                  <th>カテゴリー</th>
                  <th>仕入先</th>
                  <th>仕入価格</th>
                  <th>販売価格</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku || '-'}</td>
                    <td>{product.categories?.name || '-'}</td>
                    <td>{product.suppliers?.name || '-'}</td>
                    <td>¥{product.purchase_price}</td>
                    <td>¥{product.selling_price}</td>
                    <td className="action-buttons">
                      <button 
                        onClick={() => navigate(`/products/edit/${product.id}`)}
                        className="btn btn-small btn-edit"
                      >
                        編集
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="btn btn-small btn-delete"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">商品データがありません</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductList;