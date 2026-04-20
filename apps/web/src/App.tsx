/**
 * OMEGA Lattice App
 *
 * Main React application entry point
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CodexProvider } from './context/CodexContext';
import LatticePage from './pages/LatticePage';
import MetricsPage from './pages/MetricsPage';
import NewsPage from './pages/NewsPage';
import OperatorConsole from './components/OperatorConsole';
import AIChat from './components/AIChat';

import './App.css';
import { Link } from 'react-router-dom';

function App() {
	return (
		<CodexProvider>
			<Router>
				<div className="app">
					<nav className="navbar">
						<div className="nav-logo">Omega Lattice</div>
						<ul className="nav-links">
							<li><Link to="/">Lattice</Link></li>
							<li><Link to="/console">Console</Link></li>
							<li><Link to="/metrics">Metrics</Link></li>
							<li><Link to="/news">News</Link></li>
						</ul>
					</nav>
					<div className="main-content">
						<Routes>
							<Route path="/" element={<LatticePage />} />
							<Route path="/console" element={<OperatorConsole />} />
							<Route path="/metrics" element={<MetricsPage />} />
							<Route path="/news" element={<NewsPage />} />
						</Routes>
						<AIChat />
					</div>
				</div>
			</Router>
		</CodexProvider>
	);
}

export default App;
