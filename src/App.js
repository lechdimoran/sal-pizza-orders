import './App.css';
import Header from './Header';
import NavBar from './NavBar';
import Login from './Login';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './AuthContext';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <div>
                <Header />
                <NavBar />
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
