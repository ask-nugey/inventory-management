import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../App';

function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      setSuppliers(data || []);
    } catch (error) {
      setError('仕入先データの取得に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('この仕入先を削除してもよろしいですか？\n※関連する商品の仕入先情報も削除されます。')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // 関連する商品の仕入先をnullに更新
      const { error: updateError } = await supabase
        .from('products')
        .update({ supplier_id: null })
        .eq('supplier_id', id);
        
      if (updateError) throw updateError;
      
      // 仕入先を削除
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .match({ id });
        
      if (error) throw error;
      
      // 削除後に仕入先リストを再読み込み
      fetchSuppliers();
    } catch (error) {
      setError('仕入先の削除に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 検索フィルター
  const filteredSuppliers = suppliers.filter(supplier => {
    return (
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.phone && supplier.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="supplier-list">
      <div className="list-header">
        <h2>仕入先一覧</h2>
        <Link to="/suppliers/new" className="btn btn-primary">
          新規仕入先登録
        </Link>
      </div>
      
      <div className="search-bar">
        <input
          type="text"
          placeholder="仕入先名、担当者、メール、電話番号で検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">データを読み込み中...</div>
      ) : (
        <div className="supplier-grid">
          {filteredSuppliers.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>仕入先名</th>
                  <th>担当者</th>
                  <th>メールアドレス</th>
                  <th>電話番号</th>
                  <th>住所</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map(supplier => (
                  <tr key={supplier.id}>
                    <td>{supplier.name}</td>
                    <td>{supplier.contact_person || '-'}</td>
                    <td>{supplier.email || '-'}</td>
                    <td>{supplier.phone || '-'}</td>
                    <td>{supplier.address || '-'}</td>
                    <td className="action-buttons">
                      <button 
                        onClick={() => navigate(`/suppliers/edit/${supplier.id}`)}
                        className="btn btn-small btn-edit"
                      >
                        編集
                      </button>
                      <button 
                        onClick={() => handleDelete(supplier.id)}
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
            <p className="no-data">仕入先データがありません</p>
          )}
        </div>
      )}
    </div>
  );
}

export default SupplierList;