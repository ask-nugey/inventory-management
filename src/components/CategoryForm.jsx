import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../App';

function CategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // 編集モードの場合、カテゴリーデータを取得
    if (isEditMode) {
      const fetchCategory = async () => {
        try {
          setLoading(true);
          
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();
            
          if (error) throw error;
          
          setFormData({
            name: data.name,
            description: data.description || ''
          });
          
        } catch (error) {
          setError('カテゴリーデータの取得に失敗しました: ' + error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchCategory();
    }
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
      
      const categoryData = {
        name: formData.name,
        description: formData.description || null
      };
      
      if (isEditMode) {
        // カテゴリーの更新
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', id);
          
        if (error) throw error;
        
        setSuccessMessage('カテゴリーを更新しました');
      } else {
        // 新規カテゴリーの作成
        const { error } = await supabase
          .from('categories')
          .insert(categoryData);
          
        if (error) throw error;
        
        setSuccessMessage('カテゴリーを作成しました');
      }
      
      // 成功後、カテゴリー一覧へ戻る
      setTimeout(() => {
        navigate('/categories');
      }, 1500);
      
    } catch (error) {
      setError('カテゴリーの保存に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="category-form">
      <h2>{isEditMode ? 'カテゴリーの編集' : '新規カテゴリー登録'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">カテゴリー名 *</label>
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
          <label htmlFor="description">説明</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
          />
        </div>
        
        <div className="form-buttons">
          <button
            type="button"
            onClick={() => navigate('/categories')}
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

export default CategoryForm;