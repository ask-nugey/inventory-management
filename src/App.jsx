import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';

// コンポーネントのインポート
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import InventoryList from './components/InventoryList';
import InventoryForm from './components/InventoryForm';
import CategoryList from './components/CategoryList';
import CategoryForm from './components/CategoryForm';
import SupplierList from './components/SupplierList';
import SupplierForm from './components/SupplierForm';
import TransactionList from './components/TransactionList';
import Login from './components/Login';
import Register from './components/Register';

// Supabase クライアントの初期化
const supabaseUrl = 'https://fpbblytzxzlvtouyzajs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwYmJseXR6eHpsdnRvdXl6YWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMDcxNTYsImV4cCI6MjA1OTg4MzE1Nn0.QiIfcbpqJdSPENgBnSrr50iaIYmNLwPqul3CPLp2E9E';
export const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // セッションの取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // セッション変更のリスナー
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 認証済みユーザーかを確認するコンポーネント
  const PrivateRoute = ({ children }) => {
    if (loading) return <div>Loading...</div>;
    return session ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="app">
        {session && (
          <nav className="navbar">
            <div className="logo">
              <h1>在庫管理システム</h1>
            </div>
            <ul className="nav-links">
              <li><Link to="/dashboard">ダッシュボード</Link></li>
              <li><Link to="/products">商品</Link></li>
              <li><Link to="/inventory">在庫</Link></li>
              <li><Link to="/categories">カテゴリー</Link></li>
              <li><Link to="/suppliers">仕入先</Link></li>
              <li><Link to="/transactions">取引履歴</Link></li>
              <li>
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="logout-button"
                >
                  ログアウト
                </button>
              </li>
            </ul>
          </nav>
        )}

        <div className="content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/products" 
              element={
                <PrivateRoute>
                  <ProductList />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/products/new" 
              element={
                <PrivateRoute>
                  <ProductForm />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/products/edit/:id" 
              element={
                <PrivateRoute>
                  <ProductForm />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/inventory" 
              element={
                <PrivateRoute>
                  <InventoryList />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/inventory/edit/:id" 
              element={
                <PrivateRoute>
                  <InventoryForm />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/categories" 
              element={
                <PrivateRoute>
                  <CategoryList />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/categories/new" 
              element={
                <PrivateRoute>
                  <CategoryForm />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/categories/edit/:id" 
              element={
                <PrivateRoute>
                  <CategoryForm />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/suppliers" 
              element={
                <PrivateRoute>
                  <SupplierList />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/suppliers/new" 
              element={
                <PrivateRoute>
                  <SupplierForm />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/suppliers/edit/:id" 
              element={
                <PrivateRoute>
                  <SupplierForm />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/transactions" 
              element={
                <PrivateRoute>
                  <TransactionList />
                </PrivateRoute>
              } 
            />
            
            <Route path="/" element={<Navigate to={session ? "/dashboard" : "/login"} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;