import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../App';

function SupplierForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // 編集モードの場合、仕入先データを取得
    if (isEditMode) {
      const fetchSupplier = async () => {
        try {
          setLoading(true);
          
          const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', id)
            .single();
            
          if (error) throw error;
          
          setFormData({
            name: data.name,
            contact_person: data.contact_person || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || ''
          });
          
        } catch (error) {
          setError('仕入先データの取得に失敗しました: ' + error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchSupplier();
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
      
      const supplierData = {
        name: formData.name,
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null
      };
      
      if (isEditMode) {
        // 仕入先の更新
        const { error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', id);
          
        if (error) throw error;
        
        setSuccessMessage('仕入先情報を更新しました');
      } else {
        // 新規仕入先の作成
        const { error } = await supabase
          .from('suppliers')
          .insert(supplierData);
          
        if (error) throw error;
        
        setSuccessMessage('仕入先を登録しました');
      }
      
      // 成功後、仕入先一覧へ戻る
      setTimeout(() => {
        navigate('/suppliers');
      }, 1500);
      
    } catch (error) {
      setError('仕入先情報の保存に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="supplier-form">
      <h2>{isEditMode ? '仕入先情報の編集' : '新規仕入先登録'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">仕入先名 *</label>
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
          <label htmlFor="contact_person">担当者</label>
          <input
            type="text"
            id="contact_person"
            name="contact_person"
            value={formData.contact_person}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">電話番号</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="address">住所</label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="3"
          />
        </div>
        
        <div className="form-buttons">
          <button
            type="button"
            onClick={() => navigate('/suppliers')}
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

export default SupplierForm;