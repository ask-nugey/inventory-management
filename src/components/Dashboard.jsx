import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../App';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalInventory: 0,
    lowStockItems: 0,
    categories: [],
    recentTransactions: []
  });

  // 各種統計データの取得
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 商品数を取得
        const { count: productsCount, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });
          
        if (productsError) throw productsError;
        
        // 在庫合計数を取得
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select('quantity');
          
        if (inventoryError) throw inventoryError;
        
        const totalInventory = inventoryData.reduce((sum, item) => sum + item.quantity, 0);
        
        // 在庫不足アイテムの数を取得
        const { data: lowStockData, error: lowStockError } = await supabase
          .from('low_stock_alert_view')
          .select('*');
          
        if (lowStockError) throw lowStockError;
        
        // カテゴリー別商品数を取得
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('products')
          .select(`
            category_id,
            categories(name)
          `);
          
        if (categoriesError) throw categoriesError;
        
        // カテゴリーごとの商品数をカウント
        const categoryCounts = {};
        categoriesData.forEach(product => {
          const categoryName = product.categories?.name || '未分類';
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        });
        
        const categoriesChartData = Object.entries(categoryCounts).map(([name, value]) => ({
          name,
          value
        }));
        
        // 最近の取引を取得
        const { data: recentTransactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select(`
            id,
            product_id,
            products(name),
            type,
            quantity,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (transactionsError) throw transactionsError;
        
        setStats({
          totalProducts: productsCount,
          totalInventory,
          lowStockItems: lowStockData.length,
          categories: categoriesChartData,
          recentTransactions: recentTransactionsData
        });
      } catch (error) {
        console.error('ダッシュボードデータの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 円グラフの色
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="dashboard">
      <h2>ダッシュボード</h2>
      
      {loading ? (
        <div className="loading">データを読み込み中...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>総商品数</h3>
              <p className="stat-value">{stats.totalProducts}</p>
              <Link to="/products" className="stat-link">商品一覧を見る</Link>
            </div>
            
            <div className="stat-card">
              <h3>総在庫数</h3>
              <p className="stat-value">{stats.totalInventory}</p>
              <Link to="/inventory" className="stat-link">在庫一覧を見る</Link>
            </div>
            
            <div className="stat-card">
              <h3>在庫不足アイテム</h3>
              <p className="stat-value">{stats.lowStockItems}</p>
              <Link to="/inventory" className="stat-link">在庫を確認する</Link>
            </div>
          </div>

          <div className="dashboard-charts">
            <div className="chart-container">
              <h3>カテゴリー別商品数</h3>
              {stats.categories.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.categories}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">カテゴリーデータがありません</p>
              )}
            </div>
          </div>

          <div className="recent-transactions">
            <h3>最近の取引</h3>
            {stats.recentTransactions.length > 0 ? (
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>商品名</th>
                    <th>タイプ</th>
                    <th>数量</th>
                    <th>日時</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTransactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td>{transaction.id}</td>
                      <td>{transaction.products?.name || '不明な商品'}</td>
                      <td>{transaction.type === 'in' ? '入庫' : '出庫'}</td>
                      <td>{transaction.quantity}</td>
                      <td>{new Date(transaction.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">取引データがありません</p>
            )}
            <Link to="/transactions" className="view-all-link">すべての取引を見る</Link>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;