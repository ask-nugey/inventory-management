import React, { useState, useEffect } from 'react';
import { supabase } from '../App';

function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'in', 'out'
    startDate: '',
    endDate: new Date().toISOString().split('T')[0] // 今日の日付
  });

  useEffect(() => {
    // 初期表示時、過去30日間のデータを表示
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setFilters(prev => ({
      ...prev,
      startDate: thirtyDaysAgo.toISOString().split('T')[0]
    }));
    
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('transactions')
        .select(`
          id,
          product_id,
          products(name),
          type,
          quantity,
          reference_number,
          notes,
          created_at
        `)
        .order('created_at', { ascending: false });
      
      // フィルター適用
      if (filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate + 'T00:00:00');
      }
      
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setTransactions(data || []);
    } catch (error) {
      setError('取引履歴の取得に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchTransactions();
  };

  // 検索フィルター
  const filteredTransactions = transactions.filter(transaction => {
    return (
      (transaction.products?.name && transaction.products.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.reference_number && transaction.reference_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.notes && transaction.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // 取引タイプに応じたクラス名とテキスト
  const getTransactionTypeClass = (type) => {
    return type === 'in' ? 'transaction-in' : 'transaction-out';
  };
  
  const getTransactionTypeText = (type) => {
    return type === 'in' ? '入庫' : '出庫';
  };

  return (
    <div className="transaction-list">
      <h2>取引履歴</h2>
      
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="type">取引タイプ</label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="all">すべて</option>
              <option value="in">入庫</option>
              <option value="out">出庫</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="startDate">開始日</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="endDate">終了日</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          
          <button 
            className="btn btn-apply-filter"
            onClick={applyFilters}
          >
            フィルター適用
          </button>
        </div>
        
        <div className="search-bar">
          <input
            type="text"
            placeholder="商品名、参照番号、メモで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">データを読み込み中...</div>
      ) : (
        <div className="transactions-container">
          {filteredTransactions.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>日時</th>
                  <th>商品名</th>
                  <th>タイプ</th>
                  <th>数量</th>
                  <th>参照番号</th>
                  <th>メモ</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.created_at).toLocaleString()}</td>
                    <td>{transaction.products?.name || '不明な商品'}</td>
                    <td className={getTransactionTypeClass(transaction.type)}>
                      {getTransactionTypeText(transaction.type)}
                    </td>
                    <td>{transaction.quantity}</td>
                    <td>{transaction.reference_number || '-'}</td>
                    <td>{transaction.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">該当する取引データがありません</p>
          )}
        </div>
      )}
    </div>
  );
}

export default TransactionList;