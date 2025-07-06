import React from 'react';
import logo from './logo.svg';
import './App.css';
import SignUp from './components/signup';
import LogIn from './components/simple_signup';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import RedirectHandler from './components/RedirectHandler';


function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<LogIn />} />
        <Route path="/redirect" element={<RedirectHandler />} /> {/* Redirect route */}
        <Route path="/dashboard" element={<RedirectHandler />} /> {/* Dashboard route */}
      </Routes>
    </Router>

    // <div className="App">
    //   {/* <SignUp /> */}
    //   <LogIn />
    // </div>
  );
}

export default App;
