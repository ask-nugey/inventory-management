import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../App';

function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          description,
          created_at
        `)
        .order('name');
        
      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      setError('カテゴリーデータの取得に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('このカテゴリーを削除してもよろしいですか？\n※関連する商品のカテゴリー情報も削除されます。')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // 関連する商品のカテゴリーをnullに更新
      const { error: updateError } = await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', id);
        
      if (updateError) throw updateError;
      
      // カテゴリーを削除
      const { error } = await supabase
        .from('categories')
        .delete()
        .match({ id });
        
      if (error) throw error;
      
      // 削除後にカテゴリーリストを再読み込み
      fetchCategories();
    } catch (error) {
      setError('カテゴリーの削除に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="category-list">
      <div className="list-header">
        <h2>カテゴリー一覧</h2>
        <Link to="/categories/new" className="btn btn-primary">
          新規カテゴリー登録
        </Link>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">データを読み込み中...</div>
      ) : (
        <div className="category-grid">
          {categories.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>カテゴリー名</th>
                  <th>説明</th>
                  <th>作成日</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.description || '-'}</td>
                    <td>{new Date(category.created_at).toLocaleDateString()}</td>
                    <td className="action-buttons">
                      <button 
                        onClick={() => navigate(`/categories/edit/${category.id}`)}
                        className="btn btn-small btn-edit"
                      >
                        編集
                      </button>
                      <button 
                        onClick={() => handleDelete(category.id)}
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
            <p className="no-data">カテゴリーデータがありません</p>
          )}
        </div>
      )}
    </div>
  );
}

export default CategoryList;