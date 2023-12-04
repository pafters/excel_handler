import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Authorization from './pages/auth/Authorization';
import BaseRouter from './modules/router';
import MainPage from './pages/main/MainPage';
function App() {
  const router = new BaseRouter();
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route exact path='/' element={<MainPage router={router} />} />
          <Route exact path='/auth' element={<Authorization router={router} />} />
        </Routes>
      </Router>

    </div>
  );
}

export default App;
